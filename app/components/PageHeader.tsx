import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

type PageHeaderVariant = "default" | "compact";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  id?: string;
  className?: string;
  variant?: PageHeaderVariant;
};

const headerVariants: Record<
  PageHeaderVariant,
  { title: string; subtitle: string }
> = {
  default: {
    title: "text-5xl font-bold font-serif text-gradient leading-[1.15]",
    subtitle: "text-lg text-muted-foreground max-w-2xl",
  },
  compact: {
    title:
      "text-4xl sm:text-5xl font-bold font-serif text-gradient leading-[1.15]",
    subtitle: "text-sm sm:text-base text-muted-foreground max-w-2xl",
  },
};

export function PageHeader({
  title,
  subtitle,
  id,
  className,
  variant = "default",
}: PageHeaderProps) {
  const styles = headerVariants[variant];

  return (
    <header id={id} className={cn("text-center space-y-4 pb-2", className)}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </header>
  );
}
