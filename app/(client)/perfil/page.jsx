import { requireRole } from "@/lib/session";
import { query } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { ActionForm, SubmitButton } from "@/components/ui/ActionForm";
import { salvarPerfilCliente } from "@/app/actions/cliente";

export default async function PerfilCliente() {
  const session = await requireRole("client");

  const [{ rows: u }, { rows: c }] = await Promise.all([
    query(`select phone from "user" where id = $1`, [session.user.id]),
    query(`select address from clients where user_id = $1`, [session.user.id]),
  ]);

  return (
    <div className="max-w-xl">
      <Card>
        <div className="mb-5">
          <p className="font-display text-sm">{session.user.name}</p>
          <p className="text-xs text-ink/50">{session.user.email}</p>
        </div>

        <ActionForm action={salvarPerfilCliente} className="space-y-4">
          <PhoneInput id="phone" name="phone" label="Telefone" defaultValue={u[0]?.phone ?? ""} required />
          <Input
            id="address"
            name="address"
            label="Endereço"
            defaultValue={c[0]?.address ?? ""}
            maxLength={300}
            placeholder="Rua, número, bairro"
          />
          <SubmitButton pendingText="Salvando...">Salvar perfil</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
