import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPhoneBR(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function whatsappHref(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  const phone = digits.length === 10 || digits.length === 11
    ? `55${digits}`
    : /^55\d{10,11}$/.test(digits)
      ? digits
      : null;
  return phone ? `https://wa.me/${phone}` : null;
}

export function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

export function formatDateBR(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export const STATUS_LABELS = {
  pending: "Aguardando técnico",
  accepted: "Aceito",
  en_route: "A caminho",
  in_progress: "Em atendimento",
  completed: "Concluído",
  cancelled: "Cancelado",
  disputed: "Em disputa",
};
