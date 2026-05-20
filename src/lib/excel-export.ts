import type { Alignment } from "exceljs";

const RTL_CELL: Partial<Alignment> = {
  horizontal: "right",
  vertical: "middle",
  readingOrder: "rtl",
};

interface RtlSheetOptions {
  sheetName: string;
  headers: string[];
  rows: string[][];
  columnWidth?: number;
}

function applyRtlAlignment(row: {
  eachCell: (cb: (cell: { alignment: Partial<Alignment> }) => void) => void;
}): void {
  row.eachCell((cell) => {
    cell.alignment = RTL_CELL;
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\u0590-\u05FF\s-]/g, "").trim();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadRtlExcel(
  filename: string,
  sheet: RtlSheetOptions
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheet.sheetName, {
    views: [{ rightToLeft: true }],
  });

  const headerRow = worksheet.addRow(sheet.headers);
  headerRow.font = { bold: true };
  applyRtlAlignment(headerRow);

  for (const values of sheet.rows) {
    const dataRow = worksheet.addRow(values);
    applyRtlAlignment(dataRow);
  }

  const width = sheet.columnWidth ?? 22;
  worksheet.columns.forEach((column) => {
    column.width = width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const safeName = sanitizeFilename(filename) || "export";
  downloadBlob(blob, `${safeName}.xlsx`);
}
