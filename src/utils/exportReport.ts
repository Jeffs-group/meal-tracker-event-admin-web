/**
 * Unified CSV & Excel (.xlsx) Report Export Pipeline
 * Features:
 * - RFC 4180 quoting and CSV-injection mitigation
 * - UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
 * - Dynamic lazy-loading of exceljs to keep initial bundle size lean
 * - Dual-sheet Excel files (Data + Filters & Audit Metadata)
 * - Standardized naming: meal-tracker_<slug>_season-2026_<YYYY-MM-DD>.<ext>
 */

export interface ExportColumn<T> {
  header: string;
  key: string;
  width?: number;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Escapes values against CSV formula injection (=, +, -, @, \t)
 */
export function sanitizeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (/^[=+\-@\t]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Generates and triggers download for CSV with UTF-8 BOM
 */
export function exportReportToCsv<T>(
  slug: string,
  rows: T[],
  columns: ExportColumn<T>[],
): void {
  if (!rows || rows.length === 0) return;

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `meal-tracker_${slug}_season-2026_${todayStr}.csv`;

  const headerLine = columns
    .map((c) => `"${c.header.replace(/"/g, '""')}"`)
    .join(",");

  const rowLines = rows.map((row) =>
    columns
      .map((col) => {
        const raw = col.accessor(row);
        const sanitized = sanitizeCsvCell(raw);
        return `"${sanitized.replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  const csvContent = "\uFEFF" + [headerLine, ...rowLines].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerBrowserDownload(blob, filename);
}

/**
 * Dynamically lazy-loads exceljs and generates a styled Excel (.xlsx) workbook
 */
export async function exportReportToExcel<T>(
  slug: string,
  sheetTitle: string,
  rows: T[],
  columns: ExportColumn<T>[],
  appliedFilters: Record<string, string | number | undefined | null>,
): Promise<void> {
  if (!rows || rows.length === 0) return;

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `meal-tracker_${slug}_season-2026_${todayStr}.xlsx`;

  // Dynamic import of exceljs
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jeffs Group Meal Tracker";
  workbook.created = new Date();

  // Sheet 1: Main Data
  const worksheet = workbook.addWorksheet(sheetTitle.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Setup columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || Math.max(col.header.length + 5, 14),
  }));

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = {
    bold: true,
    color: { argb: "FF111827" },
    size: 11,
    name: "Inter",
  };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" }, // Slate-100
  };
  headerRow.height = 24;
  headerRow.alignment = { vertical: "middle" };

  // Add Data Rows
  rows.forEach((row) => {
    const rowValues: Record<string, unknown> = {};
    columns.forEach((col) => {
      const val = col.accessor(row);
      rowValues[col.key] = val === null || val === undefined ? "" : val;
    });
    const addedRow = worksheet.addRow(rowValues);
    addedRow.font = { size: 10, name: "Inter" };
    addedRow.height = 20;
    addedRow.alignment = { vertical: "middle" };
  });

  // Sheet 2: Filters & Audit Trail
  const filterSheet = workbook.addWorksheet("Filters & Audit");
  filterSheet.columns = [
    { header: "Parameter", key: "param", width: 25 },
    { header: "Applied Value", key: "value", width: 45 },
  ];

  const filterHeaderRow = filterSheet.getRow(1);
  filterHeaderRow.font = {
    bold: true,
    color: { argb: "FF111827" },
    size: 11,
    name: "Inter",
  };
  filterHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
  };

  filterSheet.addRow({ param: "Report Dataset", value: sheetTitle });
  filterSheet.addRow({ param: "Total Exported Records", value: rows.length });
  filterSheet.addRow({
    param: "Generated Timestamp (IST)",
    value: new Date().toISOString(),
  });
  filterSheet.addRow({ param: "Tournament Season", value: "Season 2026" });

  Object.entries(appliedFilters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      filterSheet.addRow({ param: key, value: String(val) });
    }
  });

  // Generate buffer and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBrowserDownload(blob, filename);
}

function escapePdfText(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

/**
 * Generates and triggers download for standard formatted PDF document
 */
export function exportReportToPdf<T>(
  slug: string,
  title: string,
  rows: T[],
  columns: ExportColumn<T>[],
  appliedFilters: Record<string, string | number | undefined | null> = {},
): void {
  if (!rows || rows.length === 0) return;

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `meal-tracker_${slug}_season-2026_${todayStr}.pdf`;

  const isLandscape = columns.length > 4;
  const pageWidth = isLandscape ? 841.89 : 595.28;
  const pageHeight = isLandscape ? 595.28 : 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  const colWidth = contentWidth / columns.length;
  const rowHeight = 18;
  const rowsPerPage = isLandscape ? 22 : 32;

  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pageObjectIds: number[] = [];
  const contentStreams: string[] = [];

  for (let p = 0; p < pageCount; p++) {
    const pageRows = rows.slice(p * rowsPerPage, (p + 1) * rowsPerPage);
    let stream = "";

    // Page Header / Title on first page
    let startY = pageHeight - margin - 20;
    if (p === 0) {
      const safeTitle = escapePdfText(title);
      stream += `BT /F2 14 Tf ${margin} ${startY} Td (${safeTitle}) Tj ET\n`;
      startY -= 14;
      const filterSummary = Object.entries(appliedFilters)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      const sub = escapePdfText(
        `Generated: ${todayStr} | Season 2026 | Records: ${rows.length}${filterSummary ? ` | ${filterSummary}` : ""}`,
      );
      stream += `BT /F1 8.5 Tf ${margin} ${startY} Td (${sub}) Tj ET\n`;
      startY -= 18;
    } else {
      startY = pageHeight - margin;
    }

    // Table Header background
    const tableHeaderY = startY - rowHeight;
    stream += `0.93 0.95 0.98 rg ${margin} ${tableHeaderY} ${contentWidth} ${rowHeight} re f\n`;
    stream += `0.80 0.84 0.90 RG 0.5 w ${margin} ${tableHeaderY} ${contentWidth} ${rowHeight} re s\n`;

    // Table Header text
    columns.forEach((col, idx) => {
      const cellX = margin + idx * colWidth + 4;
      const cellY = tableHeaderY + 5;
      const safeHeader = escapePdfText(col.header.slice(0, 22));
      stream += `BT /F2 8.5 Tf ${cellX.toFixed(1)} ${cellY.toFixed(1)} Td (${safeHeader}) Tj ET\n`;
    });

    // Table Rows
    pageRows.forEach((row, rIdx) => {
      const rowY = tableHeaderY - (rIdx + 1) * rowHeight;
      // Zebra fill
      if (rIdx % 2 === 1) {
        stream += `0.98 0.98 0.99 rg ${margin} ${rowY} ${contentWidth} ${rowHeight} re f\n`;
      }
      stream += `0.88 0.90 0.92 RG 0.4 w ${margin} ${rowY} ${contentWidth} ${rowHeight} re s\n`;

      columns.forEach((col, cIdx) => {
        const cellX = margin + cIdx * colWidth + 4;
        const cellY = rowY + 5;
        const rawVal = col.accessor(row);
        const cellText = escapePdfText(
          String(rawVal ?? "").slice(0, Math.floor(colWidth / 6)),
        );
        stream += `BT /F1 8 Tf ${cellX.toFixed(1)} ${cellY.toFixed(1)} Td (${cellText}) Tj ET\n`;
      });
    });

    // Page Footer
    const footerText = escapePdfText(
      `Jeffs Group Meal Tracker • Page ${p + 1} of ${pageCount}`,
    );
    stream += `BT /F1 8 Tf ${margin} 20 Td (${footerText}) Tj ET\n`;

    contentStreams.push(stream);
  }

  // Build standard PDF 1.4 document
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  const totalStatic = 4;
  for (let i = 0; i < pageCount; i++) {
    pageObjectIds.push(totalStatic + i * 2 + 1);
  }

  // Object 1: Catalog
  offsets.push(pdf.length);
  pdf += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

  // Object 2: Pages
  offsets.push(pdf.length);
  pdf += `2 0 obj\n<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>\nendobj\n`;

  // Object 3: Helvetica
  offsets.push(pdf.length);
  pdf +=
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  // Object 4: Helvetica-Bold
  offsets.push(pdf.length);
  pdf +=
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";

  // Page and Content objects
  for (let i = 0; i < pageCount; i++) {
    const pageId = pageObjectIds[i] ?? 5 + i * 2;
    const contentId = pageId + 1;
    const stream = contentStreams[i] ?? "";

    // Page
    offsets.push(pdf.length);
    pdf += `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>\nendobj\n`;

    // Content Stream
    offsets.push(pdf.length);
    const byteLength = new TextEncoder().encode(stream).length;
    pdf += `${contentId} 0 obj\n<< /Length ${byteLength} >>\nstream\n${stream}\nendstream\nendobj\n`;
  }

  // Xref
  const startXref = pdf.length;
  pdf += `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  triggerBrowserDownload(blob, filename);
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.setAttribute("download", filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
