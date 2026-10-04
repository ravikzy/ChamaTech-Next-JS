import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { aceitarChamado, avancarStatus } from "@/app/actions/tecnico";

const PROXIMO = {
  accepted: { status: "en_route", label: "A caminho", pendente: "Atualizando..." },
  en_route: { status: "in_progress", label: "Iniciar serviço", pendente: "Atualizando..." },
  in_progress: { status: "completed", label: "Concluir", pendente: "Concluindo..." },
};

export function TecnicoAcoes({ serviceId, status, emergencia = false }) {
  if (status === "pending") {
    return (
      <ActionForm action={aceitarChamado}>
        <input type="hidden" name="service_id" value={serviceId} />
        <SubmitButton variant={emergencia ? "amber" : "primary"} pendingText="Aceitando...">
          Aceitar
        </SubmitButton>
      </ActionForm>
    );
  }

  const passo = PROXIMO[status];
  if (!passo) return null;

  return (
    <ActionForm action={avancarStatus}>
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="status" value={passo.status} />
      <SubmitButton pendingText={passo.pendente}>{passo.label}</SubmitButton>
    </ActionForm>
  );
}
