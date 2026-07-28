"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { IconUpload, IconX } from "@tabler/icons-react";

interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface FileUploaderProps {
  onFilesChange: (files: UploadedFile[]) => void;
  existing?: UploadedFile[];
  accept?: string;
  maxFiles?: number;
  className?: string;
}

export function FileUploader({ onFilesChange, existing = [], accept = ".jpg,.jpeg,.png,.gif,.webp,.pdf", maxFiles = 5, className }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existing);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < selected.length; i++) {
      if (files.length + newFiles.length >= maxFiles) break;

      const formData = new FormData();
      formData.append("file", selected[i]);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.fileUrl) newFiles.push(data);
      } catch {
        // skip failed uploads
      }
    }

    const updated = [...files, ...newFiles];
    setFiles(updated);
    onFilesChange(updated);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative group rounded-xl border border-border p-2 bg-white">
              {f.fileType.startsWith("image/") ? (
                <img src={f.fileUrl} alt={f.fileName} className="w-full h-20 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-20 flex items-center justify-center rounded-lg bg-neutral-50 text-neutral-400 text-xs font-medium">
                  PDF
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconX size={12} />
              </button>
              <p className="text-[10px] text-neutral-500 truncate mt-1">{f.fileName}</p>
            </div>
          ))}
        </div>
      )}

      {files.length < maxFiles && (
        <label className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer transition-colors",
          "hover:border-brand/50 hover:bg-brand/5",
          uploading && "opacity-50 pointer-events-none"
        )}>
          <IconUpload size={24} className="text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-500 font-secondary">
            {uploading ? "Uploading..." : "Drop files or click to upload"}
          </p>
          <p className="text-xs text-neutral-400 mt-1">JPG, PNG, GIF, PDF (max 10MB)</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
