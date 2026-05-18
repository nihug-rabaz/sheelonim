import Image from "next/image";

export function SystemFooter() {
  return (
    <footer className="mt-auto shrink-0 border-t border-border/60 bg-background/90 px-4 py-5 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4 sm:gap-6">
        <Image
          src="/branding/rabanut.png"
          alt="הרבנות הצבאית"
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
        />
        <p className="max-w-xs text-center text-sm leading-relaxed text-muted-foreground sm:max-w-md">
          פותח על ידי תחום ניהול הידע - הרבנות הצבאית
        </p>
        <Image
          src="/branding/nihug.png"
          alt="תחום ניהול הידע"
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
        />
      </div>
    </footer>
  );
}
