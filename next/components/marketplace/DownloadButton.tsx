import { IconDownload } from "@tabler/icons-react";

interface Props {
  orderItemId: string;
  className?: string;
}

export function DownloadButton({ orderItemId, className = "" }: Props) {
  return (
    <a
      href={`/api/download/${orderItemId}`}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 text-brand font-medium text-sm hover:bg-brand/20 transition-all ${className}`}
    >
      <IconDownload size={16} />
      Download
    </a>
  );
}
