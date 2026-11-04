import React, { useMemo } from "react";
import { encodeQrCode } from "@/utils/qrCodeGenerator";

export interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
  includeMargin?: boolean;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 96,
  className = "",
  fgColor = "#000000",
  bgColor = "#FFFFFF",
  includeMargin = true,
}) => {
  const qr = useMemo(() => encodeQrCode(value || "MEAL_PASS"), [value]);
  const margin = includeMargin ? 4 : 0;
  const { path, viewBox, totalSize } = useMemo(
    () => qr.toSvgPath(6, margin),
    [qr, margin],
  );

  return (
    <svg
      role="img"
      aria-label={`QR Code for ${value}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      shapeRendering="crispEdges"
    >
      <rect x="0" y="0" width={totalSize} height={totalSize} fill={bgColor} />
      <path d={path} fill={fgColor} />
    </svg>
  );
};

export default QrCodeSvg;
