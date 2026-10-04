import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-copper text-white hover:bg-copper-light",
  amber: "bg-amber text-workbench hover:brightness-95",
  outline: "border border-cream/25 text-cream hover:bg-workbench-soft hover:border-cream/40",
  ghost: "text-cream hover:bg-workbench-soft",
  danger: "bg-danger text-white hover:brightness-95",
};

export function Button({ variant = "primary", className, as: Tag = "button", ...props }) {
  return (
    <Tag
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5",
        "font-display text-sm font-semibold",
        "transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
