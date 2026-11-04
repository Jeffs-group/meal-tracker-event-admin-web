import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Paperclip,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import {
  verifyPhotoMagicBytes,
  verifyPhotoDimensions,
} from "@/validations/publicRegistration.validation";
import { PHOTO_CONSTRAINTS } from "@/constants/publicRegistration";
import { publicApi } from "@/api/public.api";

export interface PhotoData {
  dataUrl: string;
  fileName: string;
  fileSize: number;
  dimensions: string;
  mimeType: string;
  file?: File;
  photoKey?: string;
  photoDimensions?: string;
}

export interface PhotoUploadFieldProps {
  value?: PhotoData | null;
  onChange: (data: PhotoData | null) => void;
  error?: string;
  required?: boolean;
}

export const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  value,
  onChange,
  error,
  required = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayError = error || internalError;

  const processFile = async (file: File) => {
    setInternalError(null);

    // 1. Check size (max 5 MB)
    if (file.size > PHOTO_CONSTRAINTS.MAX_BYTES) {
      setInternalError(
        `File size is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Maximum allowed size is 5 MB.`,
      );
      return;
    }

    setIsProcessing(true);

    try {
      // 2. Check Magic Bytes
      const magicCheck = await verifyPhotoMagicBytes(file);
      if (!magicCheck.valid) {
        setInternalError(
          magicCheck.error ||
            "Unsupported image format. Upload genuine JPG or PNG.",
        );
        setIsProcessing(false);
        return;
      }

      // 3. Read data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          setInternalError(
            "Failed to read image data. Please try another file.",
          );
          setIsProcessing(false);
          return;
        }

        // 4. Decode dimensions (min 600 x 600 px)
        const dimCheck = await verifyPhotoDimensions(
          dataUrl,
          PHOTO_CONSTRAINTS.MIN_PX,
        );
        if (!dimCheck.valid) {
          setInternalError(
            dimCheck.error || "Image resolution must be at least 600×600 px.",
          );
          setIsProcessing(false);
          return;
        }

        const dimensions = `${dimCheck.width} × ${dimCheck.height} px`;

        // 5. Upload photo to backend to obtain photoKey and backend photoDimensions
        let uploadedKey: string | undefined;
        let uploadedDimensions: string | undefined;
        try {
          const uploadRes = await publicApi.uploadPhoto(file);
          uploadedKey = uploadRes.photoKey;
          uploadedDimensions = uploadRes.dimensions;
        } catch (uploadErr) {
          console.warn(
            "Direct photo upload warning, will retry on form submit:",
            uploadErr,
          );
        }

        onChange({
          dataUrl,
          fileName: file.name,
          fileSize: file.size,
          dimensions,
          mimeType: magicCheck.detectedType || file.type || "image/jpeg",
          file,
          photoKey: uploadedKey,
          photoDimensions: uploadedDimensions || dimensions,
        });
        setIsProcessing(false);
      };

      reader.onerror = () => {
        setInternalError("Error reading image file.");
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch {
      setInternalError(
        "Failed to inspect photo. Please select a different image.",
      );
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setInternalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label
          htmlFor="photo-upload-input"
          className="block text-xs font-bold uppercase tracking-wider text-slate-700"
        >
          Identification Portrait Photo{" "}
          {required && (
            <span className="text-rose-500 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <span className="text-[11px] font-medium text-slate-400">
          JPG or PNG (Max 5 MB · Min 600×600 px)
        </span>
      </div>

      <input
        ref={fileInputRef}
        id="photo-upload-input"
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={handleFileChange}
        className="sr-only"
        aria-describedby={displayError ? "photo-error" : undefined}
      />

      {/* Uploaded State Preview */}
      {value ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 transition-all">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Thumbnail */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-emerald-300 bg-white shadow-xs">
              <img
                src={value.dataUrl}
                alt="Selected portrait preview"
                className="h-full w-full object-cover"
              />
              <span className="absolute top-1 right-1 rounded-full bg-emerald-600 p-0.5 text-white shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Metadata Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Identification Portrait Ready</span>
              </div>

              <p
                className="mt-1 font-mono text-xs font-semibold text-slate-800 truncate"
                title={value.fileName}
              >
                {value.fileName}
              </p>

              <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-0.5 text-[11px] text-slate-500 font-mono">
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="h-3 w-3 text-slate-400" />
                  <span>{(value.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Camera className="h-3 w-3 text-slate-400" />
                  <span>{value.dimensions}</span>
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3 text-slate-500" />
                  <span>Replace Photo</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Trash2 className="h-3 w-3 text-rose-600" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Dropzone State */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none",
            isDragging
              ? "border-[#C9A227] bg-[#FAF4E6]/50 ring-2 ring-[#C9A227]/20"
              : displayError
                ? "border-rose-300 bg-rose-50/40 hover:bg-rose-50/70"
                : "border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400",
          )}
        >
          {isProcessing ? (
            <div className="py-2 flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#C9A227]" />
              <p className="text-xs font-semibold text-slate-700">
                Verifying portrait resolution & headers...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#C9A227] border border-slate-200 shadow-2xs">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                <span className="text-[#9B7415] underline decoration-[#ECD59A] underline-offset-2">
                  Click to upload
                </span>{" "}
                or drag and drop your photo
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Clear front-facing portrait without sunglasses or head coverings
                (minimum 600×600 px required for turnstile accreditation badge).
              </p>
            </>
          )}
        </div>
      )}

      {displayError && (
        <p
          id="photo-error"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600"
          role="alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{displayError}</span>
        </p>
      )}
    </div>
  );
};

export default PhotoUploadField;
