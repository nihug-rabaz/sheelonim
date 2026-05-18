import type { BrandLogo, LogoSize } from "@/lib/domain/types";
import { LOGO_SIZE_CLASSES } from "@/lib/brand-logos";
import { cn } from "@/lib/utils";

export function QuestionnaireLogoBar({
  logos,
  size,
  className,
}: {
  logos: BrandLogo[];
  size: LogoSize;
  className?: string;
}) {
  if (!logos.length) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 sm:gap-6",
        className
      )}
    >
      {logos.map((logo) => (
        <img
          key={logo.id}
          src={logo.url}
          alt={logo.alt ?? ""}
          className={LOGO_SIZE_CLASSES[size]}
        />
      ))}
    </div>
  );
}
