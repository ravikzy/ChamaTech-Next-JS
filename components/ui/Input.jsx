import { cn } from "@/lib/utils";

export function Input({ label, id, className, ...props }) {
  return (
    <label htmlFor={id} className="block">
      {label && (
        <span className="block text-xs uppercase tracking-wide text-cream/50 font-display font-semibold mb-1.5">
          {label}
        </span>
      )}
      <input
        id={id}
        className={cn(
          "w-full rounded-lg border border-cream/15 bg-workbench px-3 py-2.5 text-cream",
          "placeholder:text-cream/25 focus:outline-none focus:ring-2 focus:ring-copper focus:border-copper/50",
          className
        )}
        {...props}
      />
    </label>
  );
}
