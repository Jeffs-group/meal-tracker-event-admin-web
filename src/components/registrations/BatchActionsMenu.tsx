import React from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, XCircle } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  ExportDropdown,
  type ExportFileFormat,
} from "@/components/common/ExportDropdown";

export interface BatchActionsMenuProps {
  selectedCount: number;
  onApproveSelected?: () => void;
  onRejectSelected?: () => void;
  onExportSelected?: (format: ExportFileFormat) => void;
  onClearSelection?: () => void;
  isLoading?: boolean;
}

export const BatchActionsMenu: React.FC<BatchActionsMenuProps> = ({
  selectedCount,
  onApproveSelected,
  onRejectSelected,
  onExportSelected,
  onClearSelection,
  isLoading = false,
}) => {
  const { can, getMissingPermissionTooltip } = usePermissions();
  const canEdit = can("registrations", "edit");
  const canView = can("registrations", "view");

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#111111] px-5 py-3 text-white shadow-2xl animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2 pr-3 border-r border-[#282828] text-xs">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A227] text-black font-bold text-[11px]">
          {selectedCount}
        </span>
        <span className="font-semibold text-slate-200">Selected</span>
      </div>

      <div className="flex items-center gap-2">
        {onApproveSelected && (
          <Button
            size="xs"
            variant="primary"
            onClick={onApproveSelected}
            disabled={isLoading || !canEdit}
            title={
              !canEdit
                ? getMissingPermissionTooltip("registrations", "edit")
                : undefined
            }
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            Approve All
          </Button>
        )}

        {onRejectSelected && (
          <Button
            size="xs"
            variant="destructive"
            onClick={onRejectSelected}
            disabled={isLoading || !canEdit}
            title={
              !canEdit
                ? getMissingPermissionTooltip("registrations", "edit")
                : undefined
            }
            leftIcon={<XCircle className="h-3.5 w-3.5" />}
          >
            Reject All
          </Button>
        )}

        {onExportSelected && canView && (
          <ExportDropdown
            size="xs"
            variant="dark"
            label="Export"
            direction="up"
            align="right"
            disabled={isLoading}
            onExport={onExportSelected}
          />
        )}

        {onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs text-slate-400 hover:text-white px-2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default BatchActionsMenu;
