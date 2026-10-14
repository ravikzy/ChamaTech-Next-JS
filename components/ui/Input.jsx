import { cn } from "@/lib/utils";

export function Input({ label, id, className, ...props }) {
  return (
    <label htmlFor={id} className="block">
      {label && (
        <span className="block text-sm text-cream/75 font-medium mb-1.5">
          {label}
        </span>
      )}
      <input
        id={id}
        className={cn(
          "w-full rounded-control border border-cream/20 bg-workbench px-3 py-2.5 text-cream",
          "placeholder:text-cream/75 focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus/60",
          className
        )}
        {...props}
      />
    </label>
  );
}
