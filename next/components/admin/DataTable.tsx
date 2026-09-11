"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  IconSearch, IconChevronLeft, IconChevronRight,
  IconArrowsSort, IconSortAscending, IconSortDescending,
} from "@tabler/icons-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  search?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  onSearch?: (query: string) => void;
  pageSize?: number;
  total?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, keyField = "id",
  search = false, searchPlaceholder = "Search...", searchFields,
  onSearch,
  pageSize = 25, total, page = 1, onPageChange,
  emptyMessage = "No data found",
  emptyIcon, loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (onSearch) onSearch(value);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = data;
    if (searchQuery && searchFields) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        searchFields.some((field) =>
          String(row[field] ?? "").toLowerCase().includes(q)
        )
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [data, searchQuery, searchFields, sortKey, sortDir]);

  const totalPages = total ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="space-y-4">
      {(search || onPageChange) && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {search && (
            <div className="relative flex-1 max-w-xs">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase tracking-wide",
                    col.sortable && "cursor-pointer select-none hover:text-primary transition-colors",
                    col.className,
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key
                        ? sortDir === "asc"
                          ? <IconSortAscending size={14} className="text-brand" />
                          : <IconSortDescending size={14} className="text-brand" />
                        : <IconArrowsSort size={14} className="text-neutral-300" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-neutral-400">
                  <div className="h-6 w-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                    {emptyIcon}
                    <p className="mt-3 text-sm text-neutral-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row[keyField]} className="border-b border-border last:border-0 hover:bg-neutral-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={cn("py-3 px-4", col.className)}>
                      {col.render ? col.render(row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-border hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <IconChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-border hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
