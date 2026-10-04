import { withTransaction } from "@/lib/db";
import { criarNotificacao } from "@/lib/notifications";
import { STATUS_LABELS } from "@/lib/utils";


const STATUS_VALIDOS = Object.keys(STATUS_LABELS);

const CLIENTE_PODE = {
  pending: ["cancelled"],
  accepted: ["cancelled"],
  en_route: ["cancelled"],
  in_progress: ["disputed"],
};
const TECNICO_PODE = {
  accepted: ["en_route"],
  en_route: ["in_progress"],
  in_progress: ["completed"],
};

export class ErroDeRegra extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function executar(fn) {
  try {
    const dados = await fn();
    return { ok: true, status: 200, ...(dados || {}) };
  } catch (err) {
    if (err instanceof ErroDeRegra) {
      return { ok: false, status: err.status, error: err.message };
    }
    if (err?.code === "23505") {
      return { ok: false, status: 409, error: "Este registro já existe." };
    }
    if (err?.code === "23503") {
      return { ok: false, status: 422, error: "Referência inválida (registro não encontrado)." };
    }
    throw err;
  }
}

async function idsDosAdmins(db) {
  const { rows } = await db.query(`select id from "user" where role = 'admin'`);
  return rows.map((r) => r.id);
}


export function criarChamado(user, d) {
  return executar(() =>
    withTransaction(async (db) => {
      if (user.role !== "client") {
        throw new ErroDeRegra(403, "Apenas clientes podem abrir chamados.");
      }

      await db.query(`insert into clients (user_id) values ($1) on conflict do nothing`, [user.id]);

      if (d.technicianId) {
        const { rows } = await db.query(
          `select is_verified, is_available from technicians where user_id = $1`,
          [d.technicianId]
        );
        if (!rows[0]) throw new ErroDeRegra(422, "Técnico não encontrado.");
        if (!rows[0].is_verified || !rows[0].is_available) {
          throw new ErroDeRegra(409, "Este técnico não está disponível no momento.");
        }
      }

      const { rows } = await db.query(
        `insert into services
           (client_id, technician_id, specialty_id, description, is_emergency, address, latitude, longitude)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         returning id, protocol, status`,
        [
          user.id,
          d.technicianId ?? null,
          d.specialtyId ?? null,
          d.description,
          d.isEmergency ?? false,
          d.address ?? null,
          d.latitude ?? null,
          d.longitude ?? null,
        ]
      );
      const service = rows[0];

      await db.query(
        `insert into service_status_history (service_id, status, changed_by) values ($1, 'pending', $2)`,
        [service.id, user.id]
      );

      if (d.technicianId) {
        await criarNotificacao(db, {
          userId: d.technicianId,
          title: d.isEmergency ? `Chamado de emergência ${service.protocol}` : `Novo chamado ${service.protocol}`,
          body: "Um cliente solicitou o seu atendimento. Veja em Meus chamados.",
        });
      }

      return { service };
    })
  );
}


export function aceitarServico(user, serviceId) {
  return executar(() =>
    withTransaction(async (db) => {
      if (user.role !== "technician") {
        throw new ErroDeRegra(403, "Apenas técnicos podem aceitar chamados.");
      }

      const { rows: perfil } = await db.query(
        `select is_verified from technicians where user_id = $1`,
        [user.id]
      );
      if (!perfil[0]) throw new ErroDeRegra(403, "Perfil de técnico não encontrado.");
      if (!perfil[0].is_verified) {
        throw new ErroDeRegra(
          403,
          "Seu cadastro ainda está em verificação. Você poderá aceitar chamados depois da aprovação de um administrador."
        );
      }

      const { rows } = await db.query(
        `update services
            set technician_id = $1, status = 'accepted', accepted_at = now()
          where id = $2
            and status = 'pending'
            and (technician_id is null or technician_id = $1)
        returning protocol, client_id`,
        [user.id, serviceId]
      );
      if (rows.length !== 1) {
        throw new ErroDeRegra(409, "Este chamado não está mais disponível.");
      }

      await db.query(
        `insert into service_status_history (service_id, status, changed_by) values ($1, 'accepted', $2)`,
        [serviceId, user.id]
      );
      await criarNotificacao(db, {
        userId: rows[0].client_id,
        title: `Chamado ${rows[0].protocol} aceito`,
        body: "Um técnico aceitou o seu chamado.",
      });
    })
  );
}


export function mudarStatusServico(user, serviceId, novoStatus, { motivo } = {}) {
  return executar(() =>
    withTransaction(async (db) => {
      if (!STATUS_VALIDOS.includes(novoStatus)) {
        throw new ErroDeRegra(422, "Status inválido.");
      }

      const { rows } = await db.query(
        `select id, protocol, status, client_id, technician_id
           from services where id = $1 for update`,
        [serviceId]
      );
      const s = rows[0];
      if (!s) throw new ErroDeRegra(404, "Chamado não encontrado.");

      const ehAdmin = user.role === "admin";
      const ehCliente = s.client_id === user.id;
      const ehTecnico = s.technician_id === user.id;
      if (!ehAdmin && !ehCliente && !ehTecnico) {
        throw new ErroDeRegra(403, "Você não tem permissão sobre este chamado.");
      }
      if (novoStatus === s.status) {
        throw new ErroDeRegra(409, "O chamado já está neste status.");
      }

      if (ehAdmin) {
        const exigeTecnico = ["accepted", "en_route", "in_progress"].includes(novoStatus);
        if (exigeTecnico && !s.technician_id) {
          throw new ErroDeRegra(409, "Este chamado ainda não tem técnico atribuído.");
        }
      } else {
        const permitido =
          (ehCliente && CLIENTE_PODE[s.status]?.includes(novoStatus)) ||
          (ehTecnico && TECNICO_PODE[s.status]?.includes(novoStatus));
        if (!permitido) {
          throw new ErroDeRegra(
            403,
            `Você não pode mudar este chamado de "${STATUS_LABELS[s.status]}" para "${STATUS_LABELS[novoStatus]}".`
          );
        }
      }

      if (novoStatus === "disputed") {
        const texto = (motivo ?? "").trim();
        if (texto.length < 5) {
          throw new ErroDeRegra(422, "Descreva o motivo da disputa (mínimo de 5 caracteres).");
        }
        await db.query(
          `insert into disputes (service_id, opened_by, reason) values ($1, $2, $3)`,
          [serviceId, user.id, texto]
        );
      }

      const extra =
        novoStatus === "completed"
          ? ", completed_at = now()"
          : novoStatus === "accepted"
            ? ", accepted_at = now()"
            : "";
      await db.query(
        `update services set status = $1::service_status ${extra} where id = $2`,
        [novoStatus, serviceId]
      );
      await db.query(
        `insert into service_status_history (service_id, status, changed_by) values ($1, $2::service_status, $3)`,
        [serviceId, novoStatus, user.id]
      );

      const destinatarios = new Set([s.client_id, s.technician_id].filter(Boolean));
      if (novoStatus === "disputed") {
        for (const id of await idsDosAdmins(db)) destinatarios.add(id);
      }
      destinatarios.delete(user.id);
      for (const userId of destinatarios) {
        await criarNotificacao(db, {
          userId,
          title: `Chamado ${s.protocol}: ${STATUS_LABELS[novoStatus]}`,
          body:
            novoStatus === "disputed"
              ? "Uma disputa foi aberta neste chamado."
              : `O status mudou para "${STATUS_LABELS[novoStatus]}".`,
        });
      }
    })
  );
}


export function avaliarServico(user, { serviceId, rating, comment }) {
  return executar(() =>
    withTransaction(async (db) => {
      const { rows } = await db.query(
        `select protocol, client_id, technician_id, status
           from services where id = $1 for update`,
        [serviceId]
      );
      const s = rows[0];
      if (!s || s.client_id !== user.id) {
        throw new ErroDeRegra(403, "Você não pode avaliar este chamado.");
      }
      if (s.status !== "completed") {
        throw new ErroDeRegra(409, "O chamado ainda não foi concluído.");
      }

      const { rows: jaAvaliado } = await db.query(
        `select 1 from reviews where service_id = $1`,
        [serviceId]
      );
      if (jaAvaliado.length > 0) {
        throw new ErroDeRegra(409, "Este chamado já foi avaliado.");
      }

      await db.query(
        `insert into reviews (service_id, client_id, technician_id, rating, comment)
         values ($1,$2,$3,$4,$5)`,
        [serviceId, user.id, s.technician_id, rating, comment || null]
      );

      await db.query(
        `update technicians t set
           average_rating = sub.avg, total_reviews = sub.total
         from (
           select technician_id, avg(rating)::numeric(3,2) as avg, count(*)::int as total
           from reviews where technician_id = $1 group by technician_id
         ) sub
         where t.user_id = sub.technician_id`,
        [s.technician_id]
      );

      await criarNotificacao(db, {
        userId: s.technician_id,
        title: `Nova avaliação no chamado ${s.protocol}`,
        body: `O cliente deu nota ${rating} de 5.`,
      });
    })
  );
}

