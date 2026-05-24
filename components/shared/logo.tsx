/**
 * Estaila brand logo.
 *
 * Variants:
 *  - "full"  → horizontal logotype (icon + "Estaila" wordmark). Default.
 *  - "icon"  → just the isotype mark (square, for tight spots).
 *  - "stack" → vertical lockup (icon above wordmark).
 *
 * Theme-aware: in light mode renders the black-text version, in dark mode
 * the white-text version. The icon itself stays brand green (#00bf63) in both.
 */
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "icon" | "stack";

export function Logo({
  variant = "full",
  className,
  priority = false,
}: {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}) {
  if (variant === "icon") {
    return (
      <Image
        src="/logos/iso-estaila.png"
        alt="Estaila"
        width={80}
        height={80}
        className={cn("h-7 w-7 object-contain", className)}
        priority={priority}
      />
    );
  }

  if (variant === "stack") {
    return (
      <>
        <Image
          src="/logos/bk-estaila.png"
          alt="Estaila"
          width={300}
          height={300}
          className={cn("h-auto w-32 object-contain dark:hidden", className)}
          priority={priority}
        />
        <Image
          src="/logos/wh-estaila.png"
          alt="Estaila"
          width={300}
          height={300}
          className={cn(
            "hidden h-auto w-32 object-contain dark:block",
            className
          )}
          priority={priority}
        />
      </>
    );
  }

  // Default: horizontal full logotype
  return (
    <>
      <Image
        src="/logos/web-black-estaila.png"
        alt="Estaila"
        width={400}
        height={120}
        className={cn("h-7 w-auto object-contain dark:hidden", className)}
        priority={priority}
      />
      <Image
        src="/logos/web-white-estaila.png"
        alt="Estaila"
        width={400}
        height={120}
        className={cn(
          "hidden h-7 w-auto object-contain dark:block",
          className
        )}
        priority={priority}
      />
    </>
  );
}
