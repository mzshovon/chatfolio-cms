import { cn } from "@/lib/cn";

type LogoProps = {
  className?: string;
  variant?: "brand" | "default";
};

export function Logo({ className, variant = "brand" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full font-serif text-sm font-bold",
          variant === "brand"
            ? "bg-brand-accent text-brand-bg"
            : "bg-accent text-accent-foreground"
        )}
      >
        C
      </div>
      <span
        className={cn(
          "text-sm font-semibold",
          variant === "brand" ? "text-brand-fg" : "text-foreground"
        )}
      >
        Chatfolio CMS
      </span>
    </div>
  );
}
