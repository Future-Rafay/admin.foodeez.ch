"use client";

import { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resolveMediaUrl, formatFileSize, MAX_UPLOAD_SIZE_BYTES } from "@/lib/media";
import { ImageIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  onFileSelect: (file: File | null) => void;
  imageFile: File | null;
  previewUrl: string | null;
  onPreviewChange: (preview: string | null) => void;
  maxLength?: number;
  disabled?: boolean;
  uploading?: boolean;
  className?: string;
}

export default function ImageUploadField({
  label = "Image",
  value,
  onChange,
  onFileSelect,
  imageFile,
  previewUrl,
  onPreviewChange,
  maxLength = 255,
  disabled = false,
  uploading = false,
  className,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const displaySrc =
    previewUrl || resolveMediaUrl(value) || null;

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      onFileSelect(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        onPreviewChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onFileSelect, onPreviewChange]
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      handleFile(file);
    }
  }

  function clearSelection() {
    onFileSelect(null);
    onPreviewChange(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="font-medium">{label}</Label>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors cursor-pointer",
          dragActive
            ? "border-foodeez-primary bg-foodeez-primary/5"
            : "border-gray-200 hover:border-foodeez-primary/50 hover:bg-gray-50",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {displaySrc ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4">
            <div className="relative w-32 h-32 rounded-lg overflow-hidden border shadow-sm flex-shrink-0">
              <Image
                src={displaySrc}
                alt="Preview"
                fill
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              {imageFile && (
                <p className="text-sm text-gray-600">
                  {imageFile.name} · {formatFileSize(imageFile.size)}
                </p>
              )}
              {!imageFile && value && (
                <p className="text-xs text-gray-500 truncate max-w-xs">
                  Saved
                </p>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || uploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || uploading}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <ImageIcon className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Drop an image here or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, WebP, GIF · max {formatFileSize(MAX_UPLOAD_SIZE_BYTES)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="media-url" className="text-sm text-gray-600">
          Or paste image URL
        </Label>
        <Input
          id="media-url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (e.target.value.trim()) {
              onFileSelect(null);
              onPreviewChange(null);
            }
          }}
          placeholder="https://..."
          maxLength={maxLength}
          disabled={disabled || uploading}
          className="h-11"
        />
      </div>
    </div>
  );
}
