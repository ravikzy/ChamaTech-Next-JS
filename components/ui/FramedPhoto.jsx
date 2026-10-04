import { cn } from "@/lib/utils";


export function FramedPhoto({ src, alt, floatingCard, className }) {
  return (
    <div className={cn("relative", className)}>
      <div className="rounded-2xl overflow-hidden border border-cream/10 shadow-2xl shadow-black/50">
        <img src={src} alt={alt} className="block w-full h-full object-cover" />
      </div>
      {floatingCard && (
        <div className="absolute -bottom-5 -left-5 bg-paper border border-cream/10 rounded-xl shadow-xl px-4 py-3 max-w-[220px]">
          {floatingCard}
        </div>
      )}
    </div>
  );
}
