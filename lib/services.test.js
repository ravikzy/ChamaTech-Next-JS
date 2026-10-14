import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  withTransaction: vi.fn(),
}));

import { withTransaction } from "@/lib/db";
import { avaliarServico, podeAvaliarChamado, podeMudarStatusServico } from "@/lib/services";

const CHAMADO = {
  client_id: "client-1",
  technician_id: "tech-1",
  protocol: "OS-2026-000001",
  status: "completed",
};

function usuario(role, id) {
  return { role, id, emailVerified: true };
}

describe("permissão e transição de status", () => {
  it("permite ao cliente cancelar o próprio chamado pendente", () => {
    expect(podeMudarStatusServico({
      role: "client",
      userId: "client-1",
      clientId: "client-1",
      technicianId: "tech-1",
      currentStatus: "pending",
      nextStatus: "cancelled",
    })).toBe(true);
  });

  it("nega mudança feita por alguém que não participa do chamado", () => {
    expect(podeMudarStatusServico({
      role: "technician",
      userId: "tech-other",
      clientId: "client-1",
      technicianId: "tech-1",
      currentStatus: "accepted",
      nextStatus: "en_route",
    })).toBe(false);
  });

  it("nega transição fora da sequência e status repetido", () => {
    const base = { role: "technician", userId: "tech-1", clientId: "client-1", technicianId: "tech-1" };
    expect(podeMudarStatusServico({ ...base, currentStatus: "accepted", nextStatus: "completed" })).toBe(false);
    expect(podeMudarStatusServico({ ...base, currentStatus: "accepted", nextStatus: "accepted" })).toBe(false);
  });

  it("permite ao técnico avançar o próprio chamado e ao admin usar uma transição válida", () => {
    expect(podeMudarStatusServico({
      role: "technician", userId: "tech-1", clientId: "client-1", technicianId: "tech-1",
      currentStatus: "accepted", nextStatus: "en_route",
    })).toBe(true);
    expect(podeMudarStatusServico({
      role: "admin", userId: "admin-1", clientId: "client-1", technicianId: "tech-1",
      currentStatus: "in_progress", nextStatus: "completed",
    })).toBe(true);
  });
});

describe("avaliação única por chamado", () => {
  it("só permite ao cliente dono avaliar um chamado concluído ainda sem avaliação", () => {
    expect(podeAvaliarChamado({
      role: "client", userId: "client-1", clientId: "client-1", status: "completed", alreadyReviewed: false,
    })).toBe(true);
    expect(podeAvaliarChamado({
      role: "client", userId: "client-2", clientId: "client-1", status: "completed", alreadyReviewed: false,
    })).toBe(false);
    expect(podeAvaliarChamado({
      role: "client", userId: "client-1", clientId: "client-1", status: "completed", alreadyReviewed: true,
    })).toBe(false);
  });

  it("recusa a segunda avaliação antes de inserir outra linha", async () => {
    const db = { query: vi.fn(async (sql) => {
      if (sql.includes("select protocol, client_id")) return { rows: [CHAMADO] };
      if (sql.includes("select 1 from reviews")) return { rows: [{ 1: 1 }] };
      return { rows: [] };
    }) };
    withTransaction.mockImplementation((callback) => callback(db));

    const result = await avaliarServico(usuario("client", "client-1"), {
      serviceId: "service-1", rating: 5, comment: "Ótimo", tags: [],
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(409);
    expect(db.query.mock.calls.some(([sql]) => sql.includes("insert into reviews"))).toBe(false);
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});
