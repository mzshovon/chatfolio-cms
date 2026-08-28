import { Wordmark } from "@/components/ui/wordmark";

const TAGS = ["Portfolios", "AI Chat", "Recruiters"];

export function BrandPanel({ quote }: { quote: string }) {
  return (
    <div className="hidden w-[320px] shrink-0 flex-col justify-between bg-brand-bg p-10 text-brand-fg md:flex">
      <Wordmark className="px-3 py-2" imageClassName="h-6" />

      <div>
        <p className="font-serif text-2xl italic leading-snug text-brand-accent">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-brand-border px-3 py-1 text-[11px] text-brand-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-brand-muted">© {new Date().getFullYear()} Chatfolio</p>
    </div>
  );
}
