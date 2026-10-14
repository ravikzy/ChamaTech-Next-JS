import { cn } from "@/lib/utils";

export function Card({ className, children, as: Tag = "div", ...props }) {
  return (
    <Tag
      className={cn(
        "bg-paper text-ink rounded-card border border-cream/10 shadow-card relative overflow-hidden",
        "p-5",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function ProtocolBadge({ protocol }) {
  return (
    <span className="protocol-tag inline-flex items-center gap-1.5 text-xs bg-workbench text-copper-light border border-copper/25 px-2.5 py-1 rounded-full">
      {protocol}
    </span>
  );
}
