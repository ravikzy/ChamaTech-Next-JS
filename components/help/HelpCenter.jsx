"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function HelpCenter({ groups, supportEmail }) {
  const [term, setTerm] = useState("");
  const filteredGroups = useMemo(() => {
    const normalized = term.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return groups;
    return groups
      .map((group) => ({
        ...group,
        questions: group.questions.filter(({ question, answer }) =>
          `${question} ${answer}`.toLocaleLowerCase("pt-BR").includes(normalized)
        ),
      }))
      .filter((group) => group.questions.length > 0);
  }, [groups, term]);

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="busca-ajuda" className="block text-sm font-medium mb-2">Buscar uma resposta</label>
        <Input
          id="busca-ajuda"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Ex.: cancelar chamado, senha, pagamento"
        />
        <p className="text-sm text-cream/75 mt-2" aria-live="polite">
          {term ? `${filteredGroups.reduce((total, group) => total + group.questions.length, 0)} respostas encontradas` : "Escolha uma pergunta para ver a resposta."}
        </p>
      </div>

      <div className="space-y-8">
        {filteredGroups.map((group) => (
          <section key={group.id} id={group.id} aria-labelledby={`${group.id}-titulo`}>
            <h2 id={`${group.id}-titulo`} className="font-display text-xl font-semibold mb-3">{group.title}</h2>
            <div className="divide-y divide-cream/15 border-y border-cream/15">
              {group.questions.map((item) => (
                <details id={item.id} key={item.id} className="py-4 scroll-mt-24">
                  <summary className="cursor-pointer font-semibold rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                    {item.question}
                  </summary>
                  <p className="text-sm text-cream/75 mt-3 max-w-3xl">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        {filteredGroups.length === 0 && (
          <Card>
            <p className="font-semibold">Nenhuma resposta encontrada</p>
            <p className="text-sm text-cream/75 mt-1">Tente outros termos ou escreva para o suporte.</p>
          </Card>
        )}
      </div>

      <Card className="max-w-3xl">
        <h2 className="font-display text-lg font-semibold">Não achou sua dúvida?</h2>
        {supportEmail ? (
          <p className="text-sm text-cream/75 mt-2">
            Fale com a equipe pelo e-mail <a className="text-copper-light underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </p>
        ) : (
          <p className="text-sm text-cream/75 mt-2">O contato de suporte ainda não foi configurado. A equipe responsável deve definir a variável SUPPORT_EMAIL.</p>
        )}
      </Card>
    </div>
  );
}
