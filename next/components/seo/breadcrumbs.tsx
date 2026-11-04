import { Link } from "next-view-transitions";
import { IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; href: string };

/**
 * Visible breadcrumb trail. Pair with <BreadcrumbSchema> using the same items
 * so the structured data always matches what users can see.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 font-secondary text-sm text-neutral-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.href}-${index}`} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="font-medium text-primary">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link
                    href={item.href}
                    className="rounded-sm transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {item.name}
                  </Link>
                  <IconChevronRight
                    size={14}
                    aria-hidden="true"
                    className="text-neutral-400"
                  />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
