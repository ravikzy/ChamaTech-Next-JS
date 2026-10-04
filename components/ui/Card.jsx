import { cn } from "@/lib/utils";

export function Card({ className, children, as: Tag = "div", ...props }) {
  return (
    <Tag
      className={cn(
        "bg-paper text-ink rounded-lg border border-cream/8 relative overflow-hidden",
        "before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-copper/40",
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
