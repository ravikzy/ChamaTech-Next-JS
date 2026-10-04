import { query } from "@/lib/db";

export const LOCALIZACAO_PADRAO = { lat: -23.5505, lng: -46.6333 };

export async function buscarTecnicos({ lat, lng, especialidade } = {}) {
  const params = [lat ?? LOCALIZACAO_PADRAO.lat, lng ?? LOCALIZACAO_PADRAO.lng];
  let filtroEspecialidade = "";
  if (especialidade) {
    params.push(especialidade);
    filtroEspecialidade = `
      and exists (
        select 1 from technician_specialties ts2
        join specialties s2 on s2.id = ts2.specialty_id
        where ts2.technician_id = t.user_id and s2.slug = $${params.length}
      )`;
  }

  const { rows } = await query(
    `
    select
      t.user_id, u.name, t.bio, t.average_rating, t.total_reviews,
      array_remove(array_agg(distinct s.name), null) as especialidades,
      case
        when t.latitude is null or t.longitude is null then null
        else 6371 * acos(least(1, greatest(-1,
          cos(radians($1)) * cos(radians(t.latitude)) *
          cos(radians(t.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(t.latitude))
        )))
      end as distancia_km
    from technicians t
    join "user" u on u.id = t.user_id
    left join technician_specialties ts on ts.technician_id = t.user_id
    left join specialties s on s.id = ts.specialty_id
    where t.is_available = true and t.is_verified = true
    ${filtroEspecialidade}
    group by t.user_id, u.name, t.bio, t.average_rating, t.total_reviews, t.latitude, t.longitude
    order by distancia_km asc nulls last, t.average_rating desc
    limit 20
    `,
    params
  );
  return rows;
}


 
export async function requisitosDisponibilidade(db, userId) {
  const { rows } = await db.query(
    `select t.is_verified, t.is_available, coalesce(trim(t.bio), '') as bio,
            (select count(*)::int from technician_specialties ts where ts.technician_id = t.user_id) as especialidades
       from technicians t where t.user_id = $1`,
    [userId]
  );
  const t = rows[0];
  if (!t) return null;

  const faltando = [];
  if (!t.is_verified) faltando.push("Cadastro verificado por um administrador");
  if (t.bio.length === 0) faltando.push("Bio preenchida no perfil");
  if (t.especialidades === 0) faltando.push("Pelo menos uma especialidade");

  return {
    isVerified: t.is_verified,
    isAvailable: t.is_available,
    faltando,
    pronto: faltando.length === 0,
  };
}
