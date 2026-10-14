import { withTransaction } from "@/lib/db";
import { criarNotificacao } from "@/lib/notifications";
import { registrarAuditoria } from "@/lib/audit";
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

export function podeMudarStatusServico({ role, userId, clientId, technicianId, currentStatus, nextStatus }) {
  if (!STATUS_VALIDOS.includes(nextStatus) || nextStatus === currentStatus) return false;
  if (role === "admin") {
    return Boolean(CLIENTE_PODE[currentStatus]?.includes(nextStatus) || TECNICO_PODE[currentStatus]?.includes(nextStatus));
  }
  if (role === "client" && clientId === userId) return Boolean(CLIENTE_PODE[currentStatus]?.includes(nextStatus));
  if (role === "technician" && technicianId === userId) return Boolean(TECNICO_PODE[currentStatus]?.includes(nextStatus));
  return false;
}


export function criarChamado(user, d) {
  return executar(() =>
    withTransaction(async (db) => {
      if (user.role !== "client") {
        throw new ErroDeRegra(403, "Apenas clientes podem abrir chamados.");
      }
      if (!user.emailVerified) {
        throw new ErroDeRegra(403, "Confirme seu e-mail antes de abrir um chamado.");
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
          href: "/solicitacoes",
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
      if (!user.emailVerified) {
        throw new ErroDeRegra(403, "Confirme seu e-mail antes de aceitar um chamado.");
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
        href: `/chamados/${serviceId}`,
      });
      return { protocol: rows[0].protocol, clientId: rows[0].client_id };
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
      const ehCliente = user.role === "client" && s.client_id === user.id;
      const ehTecnico = user.role === "technician" && s.technician_id === user.id;
      if (!ehAdmin && !ehCliente && !ehTecnico) {
        throw new ErroDeRegra(403, "Você não tem permissão sobre este chamado.");
      }
      if (novoStatus === s.status) {
        throw new ErroDeRegra(409, "O chamado já está neste status.");
      }

      if (!podeMudarStatusServico({
        role: user.role,
        userId: user.id,
        clientId: s.client_id,
        technicianId: s.technician_id,
        currentStatus: s.status,
        nextStatus: novoStatus,
      })) {
        throw new ErroDeRegra(
          403,
          `Você não pode mudar este chamado de "${STATUS_LABELS[s.status]}" para "${STATUS_LABELS[novoStatus]}".`,
        );
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
            novoStatus === "completed" && userId === s.client_id
              ? "Seu atendimento foi concluído. Abra o chamado para avaliar o serviço."
              : novoStatus === "disputed"
              ? "Uma disputa foi aberta neste chamado."
              : `O status mudou para "${STATUS_LABELS[novoStatus]}".`,
          href: ehAdmin
            ? "/disputas"
            : userId === s.client_id
              ? `/chamados/${serviceId}`
              : `/meus-chamados/${serviceId}`,
        });
      }
      return {
        serviceId,
        protocol: s.protocol,
        clientId: s.client_id,
        technicianId: s.technician_id,
        status: novoStatus,
      };
    })
  );
}


export function podeAvaliarChamado({ role, userId, clientId, status, alreadyReviewed }) {
  return role === "client" && userId === clientId && status === "completed" && !alreadyReviewed;
}

export function avaliarServico(user, { serviceId, rating, comment, tags = [] }) {
  return executar(() =>
    withTransaction(async (db) => {
      if (user.role !== "client") {
        throw new ErroDeRegra(403, "Apenas clientes podem avaliar chamados.");
      }
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
      if (!s.technician_id) throw new ErroDeRegra(409, "Este chamado não tem técnico associado.");

      const { rows: jaAvaliado } = await db.query(
        `select 1 from reviews where service_id = $1`,
        [serviceId]
      );
      if (!podeAvaliarChamado({
        role: user.role,
        userId: user.id,
        clientId: s.client_id,
        status: s.status,
        alreadyReviewed: jaAvaliado.length > 0,
      })) {
        throw new ErroDeRegra(409, "Este chamado já foi avaliado.");
      }

      await db.query(
        `insert into reviews (service_id, client_id, technician_id, rating, comment, tags)
         values ($1,$2,$3,$4,$5,$6)`,
        [serviceId, user.id, s.technician_id, rating, comment || null, tags]
      );

      await db.query(
        `update technicians t set
           average_rating = sub.avg, total_reviews = sub.total
         from (
           select technician_id, avg(rating)::numeric(3,2) as avg, count(*)::int as total
           from reviews where technician_id = $1 and is_hidden = false group by technician_id
         ) sub
         where t.user_id = sub.technician_id`,
        [s.technician_id]
      );

      await criarNotificacao(db, {
        userId: s.technician_id,
        title: `Nova avaliação no chamado ${s.protocol}`,
        body: `O cliente deu nota ${rating} de 5.`,
        href: "/painel-tecnico",
      });
    })
  );
}

export function responderAvaliacao(user, { reviewId, reply }) {
  return executar(() =>
    withTransaction(async (db) => {
      if (user.role !== "technician") {
        throw new ErroDeRegra(403, "Apenas o técnico avaliado pode responder.");
      }
      const { rows } = await db.query(
        `update reviews
            set technician_reply = $1, replied_at = now()
          where id = $2 and technician_id = $3 and is_hidden = false and technician_reply is null
        returning id`,
        [reply, reviewId, user.id]
      );
      if (rows.length !== 1) {
        throw new ErroDeRegra(409, "Esta avaliação já recebeu resposta ou não pertence ao seu perfil.");
      }
    })
  );
}

export function denunciarAvaliacao(user, { reviewId, reason }) {
  return executar(() =>
    withTransaction(async (db) => {
      if (!['client', 'technician'].includes(user.role)) {
        throw new ErroDeRegra(403, "Somente clientes e técnicos podem denunciar avaliações.");
      }
      const { rows } = await db.query(
        `select r.id, r.client_id, r.technician_id, r.is_hidden
           from reviews r where r.id = $1 for update`,
        [reviewId]
      );
      const review = rows[0];
      if (!review || review.is_hidden || review.client_id === user.id) throw new ErroDeRegra(404, "Avaliação não encontrada.");
      await db.query(
        `insert into review_reports (review_id, reporter_id, reason) values ($1, $2, $3)`,
        [reviewId, user.id, reason]
      );
    })
  );
}

export function moderarAvaliacao(admin, { reportId, decision }) {
  return executar(() =>
    withTransaction(async (db) => {
      if (admin.role !== "admin") throw new ErroDeRegra(403, "Apenas administradores podem moderar avaliações.");
      if (!['hide', 'keep'].includes(decision)) throw new ErroDeRegra(422, "Decisão de moderação inválida.");
      const { rows } = await db.query(
        `select rr.review_id
           from review_reports rr
           join reviews r on r.id = rr.review_id
          where rr.id = $1 and rr.status = 'open'
          for update of rr, r`,
        [reportId]
      );
      if (!rows[0]) throw new ErroDeRegra(409, "Esta denúncia já foi analisada.");
      const reviewId = rows[0].review_id;
      if (decision === 'hide') {
        await db.query(
          `update reviews set is_hidden = true, hidden_by = $1, hidden_at = now() where id = $2`,
          [admin.id, reviewId]
        );
        await db.query(
          `update technicians
              set average_rating = coalesce((select avg(rating)::numeric(3,2) from reviews
                                              where technician_id = (select technician_id from reviews where id = $1)
                                                and is_hidden = false), 0),
                  total_reviews = (select count(*)::int from reviews
                                    where technician_id = (select technician_id from reviews where id = $1)
                                      and is_hidden = false)
            where user_id = (select technician_id from reviews where id = $1)`,
          [reviewId]
        );
      }
      await db.query(
        `update review_reports
            set status = $1, reviewed_by = $2, reviewed_at = now()
          where review_id = $3 and status = 'open'`,
        [decision === 'hide' ? 'resolved' : 'dismissed', admin.id, reviewId]
      );
      await registrarAuditoria(db, {
        actorId: admin.id,
        action: decision === 'hide' ? 'review_hidden' : 'review_report_dismissed',
        targetId: reviewId,
      });
    })
  );
}

