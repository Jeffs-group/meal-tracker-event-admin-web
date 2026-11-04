import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { QrCodeSvg } from "@/components/ui/QrCodeSvg";
import { encodeQrCode } from "@/utils/qrCodeGenerator";
import { Copy, Check, Download, Link as LinkIcon, Shield } from "lucide-react";
import type { League } from "@/constants/leagues";

export interface ShareRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  team?: {
    id: string;
    name: string;
    code: string;
    league: League;
  };
}

export const ShareRegistrationModal: React.FC<ShareRegistrationModalProps> = ({
  isOpen,
  onClose,
  team,
}) => {
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Build full absolute URL
  const origin = window.location.origin;
  const registrationUrl = team
    ? `${origin}/register?league=${encodeURIComponent(team.league)}&team=${encodeURIComponent(team.code)}`
    : `${origin}/register`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQrPng = () => {
    try {
      const qr = encodeQrCode(registrationUrl);
      const pngData = qr.toDataUrl(12, 4);
      if (!pngData) return;

      const downloadLink = document.createElement("a");
      const filename = team
        ? `registration-qr-${team.code.toLowerCase()}.png`
        : "registration-qr-public.png";

      downloadLink.download = filename;
      downloadLink.href = pngData;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Failed to generate QR PNG:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        team
          ? `Share Registration Link — ${team.name}`
          : "Share Public Registration Form"
      }
      subtitle={
        team
          ? `Distribute this shareable link or print the QR code for ${team.name} players & coaching staff.`
          : "Provide this open link or QR code to allow participants to self-register for the tournament."
      }
      maxWidth="md"
    >
      <div className="space-y-5 py-2">
        {/* Team Banner if scoped */}
        {team && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[#ECD59A] bg-[#FAF4E6] p-3 text-xs">
            <Shield className="h-4 w-4 text-[#C9A227] shrink-0" />
            <div>
              <span className="font-bold text-slate-900">{team.name}</span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="font-mono font-semibold text-[#9B7415]">
                {team.code}
              </span>
              <span className="text-slate-400 mx-1.5">•</span>
              <span className="font-medium text-slate-600">
                {team.league} League
              </span>
            </div>
          </div>
        )}

        {/* Copyable Link Box */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Registration URL
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LinkIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                readOnly
                value={registrationUrl}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs font-mono text-slate-800 select-all focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A227] hover:bg-[#B58E1E] px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-6">
          <div
            ref={qrContainerRef}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs"
          >
            <QrCodeSvg value={registrationUrl} size={180} />
          </div>

          <p className="mt-3 text-[11px] font-medium text-slate-400 text-center">
            Scan with any standard smartphone camera to open the meal
            registration portal.
          </p>

          <button
            type="button"
            onClick={handleDownloadQrPng}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Download High-Res QR (PNG)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareRegistrationModal;
