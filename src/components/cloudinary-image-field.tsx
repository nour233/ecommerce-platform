"use client";

import Image from "next/image";
import { ImageUp, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Unsigned upload presets and cloud names are intentionally public client configuration.
// Environment variables can override these values in each deployment.
const DEFAULT_CLOUD_NAME = "tbqkgomc";
const DEFAULT_UPLOAD_PRESET = "commercecraft_uploads";

type CloudinaryImageFieldProps = {
  value: string;
  onChange: (url: string) => void;
  inputClassName: string;
};

export function CloudinaryImageField({ value, onChange, inputClassName }: CloudinaryImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || DEFAULT_UPLOAD_PRESET;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", uploadPreset);
      body.append("folder", "commercecraft");
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
      const payload = await response.json() as { secure_url?: string; error?: { message?: string } };
      if (!response.ok || !payload.secure_url) throw new Error(payload.error?.message ?? "Upload failed. Please try again.");
      onChange(payload.secure_url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void upload(file);
        event.currentTarget.value = "";
      }} />
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-emerald-300 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-70">
        {uploading ? <LoaderCircle className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
        {uploading ? "Uploading image…" : "Upload an image from your computer"}
      </button>
      <p className="text-xs text-slate-500">JPG, PNG, or WebP · maximum 5 MB</p>
      <input required type="url" placeholder="Or paste an image URL" className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)} />
      {error ? <p role="alert" className="text-xs font-medium text-rose-600">{error}</p> : null}
      {value ? <div className="relative h-32 overflow-hidden rounded-md border border-slate-200 bg-slate-50"><Image src={value} alt="Selected image preview" fill sizes="320px" className="object-cover" /></div> : null}
    </div>
  );
}
