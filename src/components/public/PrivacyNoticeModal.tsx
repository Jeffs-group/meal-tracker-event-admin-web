import React from "react";
import { DialogShell } from "@/components/common/DialogShell";
import { Button } from "@/components/ui/Button";
import { ShieldCheck } from "lucide-react";
import { PRIVACY_NOTICE_TEXT } from "@/constants/publicRegistration";

export interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <DialogShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Accreditation & Data Privacy Notice"
      subtitle="Jeffs Group Tournament Operations & Dining Logistics Policy"
      icon={<ShieldCheck className="h-5 w-5 text-[#C9A227]" />}
      footer={
        <div className="flex justify-end w-full">
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="bg-[#C9A227] hover:bg-[#B58E1E] text-white px-5"
          >
            I Understand
          </Button>
        </div>
      }
    >
      <div className="space-y-3 py-2 text-xs text-slate-700 leading-relaxed">
        {PRIVACY_NOTICE_TEXT.split("\n").map((line, idx) => (
          <p
            key={idx}
            className={idx === 0 ? "font-bold text-slate-900 mb-2" : ""}
          >
            {line}
          </p>
        ))}
      </div>
    </DialogShell>
  );
};

export default PrivacyNoticeModal;
