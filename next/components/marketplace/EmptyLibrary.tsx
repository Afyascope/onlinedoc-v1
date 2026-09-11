import { IconBooks } from "@tabler/icons-react";

export function EmptyLibrary() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
      <IconBooks size={48} stroke={1.5} />
      <p className="mt-4 text-sm font-medium text-neutral-500">Your library is empty</p>
      <p className="mt-1 text-xs text-neutral-400">Purchase digital products to see them here.</p>
      <a
        href="/products"
        className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
      >
        Browse Products
      </a>
    </div>
  );
}
