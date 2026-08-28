import { cn } from "@/lib/cn";
import Image from "next/image";

type WordmarkProps = {
  className?: string;
  imageClassName?: string;
};

// The real multi-color "Chatfolio" logo (public/logo-wordmark.png, traced
// from public/Logo.svg with its background flood-filled to transparent —
// see git history for the one-off script). It's baked-color art, not
// currentColor, so it's always wrapped in this light chip rather than
// dropped directly onto a surface — that keeps the dark "folio" half
// readable regardless of whether the surface behind it is the app's
// always-dark brand chrome or a surface that flips with the theme.
export function Wordmark({ className, imageClassName }: WordmarkProps) {
  return (
    <div className={cn("inline-flex w-fit items-center rounded-[8px] bg-brand-fg px-2.5 py-1.5", className)}>
      <Image
        src="/logo-wordmark.png"
        alt="Chatfolio"
        width={728}
        height={172}
        className={cn("h-5 w-auto", imageClassName)}
      />
    </div>
  );
}
