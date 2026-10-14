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
    query(`select phone, email_notifications from "user" where id = $1`, [session.user.id]),
    query(`select address from clients where user_id = $1`, [session.user.id]),
  ]);

  return (
    <div className="max-w-xl">
      <Card>
        <div className="mb-5">
          <p className="font-display text-sm">{session.user.name}</p>
          <p className="text-xs text-ink/75">{session.user.email}</p>
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
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="email_notifications" defaultChecked={u[0]?.email_notifications !== false} className="mt-1 accent-[var(--color-copper)]" />
            <span>Receber por e-mail atualizações importantes sobre meus chamados</span>
          </label>
          <SubmitButton pendingText="Salvando...">Salvar perfil</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
