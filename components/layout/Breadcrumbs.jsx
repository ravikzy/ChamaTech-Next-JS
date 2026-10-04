import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";


export function Breadcrumbs({ items = [], backHref }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {backHref && (
        <Link
          href={backHref}
          className="flex items-center gap-1 text-xs text-cream/60 hover:text-cream border border-cream/15 rounded-full px-2.5 py-1"
        >
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
      )}
      <nav className="protocol-tag flex items-center gap-1.5 text-xs text-cream/50">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-cream">
                {item.label}
              </Link>
            ) : (
              <span className="text-copper-light">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
