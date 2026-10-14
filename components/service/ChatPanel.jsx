"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateBR } from "@/lib/utils";

export function ChatPanel({ serviceId, userId, readOnly = false }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async (signal) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/messages`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar a conversa.");
      setMessages(data.messages);
      setError("");
    } catch (cause) {
      if (cause.name !== "AbortError") setError(cause.message || "Não foi possível carregar a conversa.");
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    const timer = window.setInterval(() => refresh(), 15000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refresh]);

  async function enviar(event) {
    event.preventDefault();
    if (sending || !text.trim()) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/services/${serviceId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar a mensagem.");
      setMessages((current) => [...current, data.message].slice(-100));
      setText("");
    } catch (cause) {
      setError(cause.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Conversa do chamado</h2>
          <p className="text-xs text-ink/75 mt-1">As mensagens são visíveis às partes e à equipe administrativa.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => refresh()} disabled={loading}>Atualizar</Button>
      </div>

      <div className="mt-4 max-h-96 overflow-y-auto rounded-control border border-cream/10 bg-workbench p-3" aria-label="Mensagens" aria-live="polite">
        {loading && messages.length === 0 ? <p className="text-sm text-ink/75">Carregando conversa...</p> : null}
        {!loading && messages.length === 0 && <p className="text-sm text-ink/75">Ainda não há mensagens neste chamado.</p>}
        <ol className="space-y-3">
          {messages.map((message) => (
            <li key={message.id} className={`max-w-[90%] rounded-control px-3 py-2 ${message.sender_id === userId ? "ml-auto bg-copper/20" : "bg-paper-soft"}`}>
              <p className="text-xs text-ink/75">{message.sender_id === userId ? "Você" : message.sender_name} · {formatDateBR(message.sent_at)}</p>
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">{message.message}</p>
            </li>
          ))}
        </ol>
      </div>

      {error && <p role="alert" className="text-sm text-danger mt-3">{error}</p>}
      {!readOnly && (
        <form method="post" onSubmit={enviar} className="mt-4 space-y-2">
          <label htmlFor={`mensagem-${serviceId}`} className="block text-sm font-medium">Sua mensagem</label>
          <textarea id={`mensagem-${serviceId}`} value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={3}
            className="w-full rounded-control border border-cream/20 bg-workbench px-3 py-2.5 text-sm text-cream focus-visible:ring-2 focus-visible:ring-focus"
            placeholder="Escreva uma mensagem (até 2000 caracteres)" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-ink/75">{text.length}/2000 caracteres</span>
            <Button type="submit" disabled={sending || !text.trim()}>{sending ? "Enviando..." : "Enviar mensagem"}</Button>
          </div>
        </form>
      )}
      {readOnly && <p className="text-xs text-ink/75 mt-3">Somente leitura para administradores.</p>}
    </Card>
  );
}
