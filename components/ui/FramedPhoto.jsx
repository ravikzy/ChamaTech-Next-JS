import Image from "next/image";
import { cn } from "@/lib/utils";


export function FramedPhoto({ src, alt, floatingCard, className, priority = false }) {
  return (
    <div className={cn("relative", className)}>
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-cream/10 shadow-2xl shadow-black/50">
        <Image src={src} alt={alt} fill priority={priority} sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" />
      </div>
      {floatingCard && (
        <div className="absolute -bottom-5 -left-5 bg-paper border border-cream/10 rounded-xl shadow-xl px-4 py-3 max-w-[220px]">
          {floatingCard}
        </div>
      )}
    </div>
  );
}
