"use server";

import { revalidatePath } from "next/cache";
import { getSession, isUuid } from "@/lib/session";
import { withTransaction, pool } from "@/lib/db";
import { aceitarServico, mudarStatusServico } from "@/lib/services";
import { requisitosDisponibilidade } from "@/lib/technicians";

const ERRO_GENERICO = "Não foi possível concluir a ação. Tente novamente.";

async function tecnicoLogado() {
  const session = await getSession();
  if (!session || session.user.role !== "technician") return null;
  return session.user;
}

function atualizarTelas() {
  revalidatePath("/", "layout");
}

/** Aceita um chamado pendente (precisa ser técnico verificado). */
export async function aceitarChamado(_prev, formData) {
  const user = await tecnicoLogado();
  if (!user) return { error: "Faça login como técnico para continuar." };

  const serviceId = formData.get("service_id");
  if (!isUuid(serviceId)) return { error: "Chamado inválido." };

  try {
    const r = await aceitarServico(user, serviceId);
    if (!r.ok) return { error: r.error };
    atualizarTelas();
    return { ok: "Chamado aceito." };
  } catch (err) {
    console.error("aceitarChamado:", err);
    return { error: ERRO_GENERICO };
  }
}

/** Avança o status do chamado: a caminho, em atendimento ou concluído. */
export async function avancarStatus(_prev, formData) {
  const user = await tecnicoLogado();
  if (!user) return { error: "Faça login como técnico para continuar." };

  const serviceId = formData.get("service_id");
  const status = formData.get("status");
  if (!isUuid(serviceId) || typeof status !== "string") return { error: "Dados inválidos." };

  try {
    const r = await mudarStatusServico(user, serviceId, status);
    if (!r.ok) return { error: r.error };
    atualizarTelas();
    return { ok: "Status atualizado." };
  } catch (err) {
    console.error("avancarStatus:", err);
    return { error: ERRO_GENERICO };
  }
}

/** Liga/desliga a disponibilidade do técnico na busca. */
export async function alternarDisponibilidade(_prev, formData) {
  const user = await tecnicoLogado();
  if (!user) return { error: "Faça login como técnico para continuar." };

  const ligar = formData.get("ligar") === "1";

  try {
    if (ligar) {
      const req = await requisitosDisponibilidade(pool, user.id);
      if (!req) return { error: "Perfil de técnico não encontrado." };
      if (!req.pronto) {
        return { error: `Para ficar disponível falta: ${req.faltando.join("; ").toLowerCase()}.` };
      }
    }
    await pool.query(`update technicians set is_available = $1 where user_id = $2`, [ligar, user.id]);
    atualizarTelas();
    return { ok: ligar ? "Você está disponível para novos chamados." : "Você está indisponível." };
  } catch (err) {
    console.error("alternarDisponibilidade:", err);
    return { error: ERRO_GENERICO };
  }
}

function numeroOuNulo(valor) {
  const texto = String(valor ?? "").trim().replace(",", ".");
  if (texto === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) ? n : NaN;
}

/** Salva bio, endereço, coordenadas e especialidades do técnico. */
export async function salvarPerfilTecnico(_prev, formData) {
  const user = await tecnicoLogado();
  if (!user) return { error: "Faça login como técnico para continuar." };

  const bio = String(formData.get("bio") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const latitude = numeroOuNulo(formData.get("latitude"));
  const longitude = numeroOuNulo(formData.get("longitude"));
  const especialidades = [...new Set(formData.getAll("specialties").map(Number))].filter(
    (n) => Number.isInteger(n) && n > 0
  );

  if (bio.length > 500) return { error: "A bio pode ter no máximo 500 caracteres." };
  if (address.length > 300) return { error: "O endereço pode ter no máximo 300 caracteres." };
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: "Latitude e longitude devem ser números (ex.: -23.5505)." };
  }
  if ((latitude === null) !== (longitude === null)) {
    return { error: "Preencha latitude e longitude juntas, ou deixe as duas em branco." };
  }
  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    return { error: "A latitude deve estar entre -90 e 90." };
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    return { error: "A longitude deve estar entre -180 e 180." };
  }

  try {
    await withTransaction(async (db) => {
      await db.query(
        `update technicians set bio = $1, address = $2, latitude = $3, longitude = $4 where user_id = $5`,
        [bio || null, address || null, latitude, longitude, user.id]
      );
      await db.query(`delete from technician_specialties where technician_id = $1`, [user.id]);
      if (especialidades.length > 0) {
        await db.query(
          `insert into technician_specialties (technician_id, specialty_id)
           select $1, id from specialties where id = any($2::int[])`,
          [user.id, especialidades]
        );
      }
      // Se o perfil deixou de cumprir os requisitos, sai da busca automaticamente.
      const req = await requisitosDisponibilidade(db, user.id);
      if (req && req.isAvailable && !req.pronto) {
        await db.query(`update technicians set is_available = false where user_id = $1`, [user.id]);
      }
    });
    atualizarTelas();
    return { ok: "Perfil salvo." };
  } catch (err) {
    console.error("salvarPerfilTecnico:", err);
    return { error: ERRO_GENERICO };
  }
}
