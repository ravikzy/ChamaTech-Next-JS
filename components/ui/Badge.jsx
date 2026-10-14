import { cn, STATUS_LABELS } from "@/lib/utils";

const TONES = {
  pending: "bg-cream/10 text-cream border-cream/30",
  accepted: "bg-circuit/20 text-circuit border-circuit/40",
  en_route: "bg-amber/20 text-amber border-amber/40",
  in_progress: "bg-copper/20 text-copper-light border-copper/40",
  completed: "bg-circuit/30 text-circuit border-circuit/50",
  cancelled: "bg-danger/20 text-danger border-danger/40",
  disputed: "bg-danger/30 text-danger border-danger/50",
};

export function Badge({ tone = "pending", children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status];
  if (!label) return null;
  return <Badge tone={status}>{label}</Badge>;
}
