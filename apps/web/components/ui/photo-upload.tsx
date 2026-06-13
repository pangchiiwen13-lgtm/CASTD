"use client";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  value?: string;           // current URL
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: "square" | "portrait";
  className?: string;
}

export function PhotoUpload({ value, onChange, label = "Upload photo", aspectRatio = "square", className }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange(json.url);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed border-[#EBEBEB] hover:border-[#FFD200] transition-colors bg-[#F8F7F4] flex items-center justify-center group",
          aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
          uploading && "opacity-60 pointer-events-none"
        )}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-semibold">Change photo</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-white border border-[#EBEBEB] flex items-center justify-center text-lg">
              {uploading ? "..." : "+"}
            </div>
            <span className="text-xs text-[#7A7A7A]">{uploading ? "Uploading..." : label}</span>
          </div>
        )}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// Multi-photo upload (up to maxPhotos)
interface MultiPhotoUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  maxPhotos?: number;
  className?: string;
}

export function MultiPhotoUpload({ values, onChange, maxPhotos = 5, className }: MultiPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (values.length >= maxPhotos) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange([...values, json.url]);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(idx: number) {
    onChange(values.filter((_, i) => i !== idx));
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {values.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#EBEBEB] group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              x
            </button>
          </div>
        ))}
        {values.length < maxPhotos && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-[#EBEBEB] hover:border-[#FFD200] transition-colors bg-[#F8F7F4] flex items-center justify-center text-[#7A7A7A] text-xs flex-col gap-1"
          >
            <span className="text-lg">{uploading ? "..." : "+"}</span>
            <span>{uploading ? "Uploading" : "Add photo"}</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-[#7A7A7A]">{values.length}/{maxPhotos} photos. JPG or PNG, max 8MB each.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
