import type {
  TenantSummary,
  UserRole,
  VehicleReportFuelItem,
  VehicleReportItem,
  VehicleReportMaintenanceItem
} from "@fleet/shared-types";

import { fetchWithTimeout } from "./http";
import { formatMaintenanceType } from "./maintenance";
import { resolveMediaUrl } from "./media";
import { planLabel } from "./plans";
import { buildReportPerformanceInsights } from "./report-performance";

type PdfFont = "F1" | "F2";

type PdfTextOptions = {
  font?: PdfFont;
  size?: number;
  color?: [number, number, number];
  align?: "left" | "center" | "right";
  maxWidth?: number;
};

type PdfRectOptions = {
  fill?: [number, number, number];
  stroke?: [number, number, number];
  lineWidth?: number;
};

type PdfPage = {
  commands: string[];
  imageNames: string[];
};

type PdfImage = {
  name: string;
  width: number;
  height: number;
  ascii85Data: string;
};

type VehicleReportPdfInput = {
  tenant: TenantSummary | null;
  report: VehicleReportItem;
  from: string;
  to: string;
  operator?: {
    fullName?: string | null;
    email?: string | null;
    role?: UserRole | null;
  };
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN_X = 28;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const FONTS = {
  regular: "F1" as const,
  bold: "F2" as const
};

const COLORS = {
  text: [0.12, 0.12, 0.12] as [number, number, number],
  muted: [0.45, 0.45, 0.45] as [number, number, number],
  grid: [0.3, 0.3, 0.3] as [number, number, number],
  lightGrid: [0.72, 0.74, 0.78] as [number, number, number],
  lightFill: [0.96, 0.96, 0.96] as [number, number, number],
  gold: [0.92, 0.76, 0.24] as [number, number, number],
  blueBadge: [0.17, 0.42, 0.62] as [number, number, number],
  iconFill: [0.19, 0.18, 0.14] as [number, number, number]
};

const TABLE_ROW_HEIGHT = 22;
const TABLE_HEADER_HEIGHT = 24;
const SECTION_BAR_HEIGHT = 20;
const TITLE_TO_TABLE_GAP = 4;
const INTER_SECTION_GAP = 4;
const TABLE_BOTTOM_GAP = 10;

const WIN_1252_MAP = new Map<string, number>([
  ["€", 0x80],
  ["‚", 0x82],
  ["ƒ", 0x83],
  ["„", 0x84],
  ["…", 0x85],
  ["†", 0x86],
  ["‡", 0x87],
  ["ˆ", 0x88],
  ["‰", 0x89],
  ["Š", 0x8a],
  ["‹", 0x8b],
  ["Œ", 0x8c],
  ["Ž", 0x8e],
  ["‘", 0x91],
  ["’", 0x92],
  ["“", 0x93],
  ["”", 0x94],
  ["•", 0x95],
  ["–", 0x96],
  ["—", 0x97],
  ["˜", 0x98],
  ["™", 0x99],
  ["š", 0x9a],
  ["›", 0x9b],
  ["œ", 0x9c],
  ["ž", 0x9e],
  ["Ÿ", 0x9f]
]);

function toPdfHex(value: string) {
  const bytes: number[] = [];

  for (const char of value) {
    const codePoint = char.codePointAt(0) ?? 0x20;

    if (codePoint >= 0x20 && codePoint <= 0x7e) {
      bytes.push(codePoint);
      continue;
    }

    if (codePoint >= 0xa0 && codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    bytes.push(WIN_1252_MAP.get(char) ?? 0x3f);
  }

  return bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join("");
}

function colorToPdf(color: [number, number, number]) {
  return color.map((value) => value.toFixed(3)).join(" ");
}

function sanitizeText(value?: string | number | null) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function estimateTextWidth(text: string, size: number) {
  return text.length * size * 0.52;
}

function ellipsize(text: string, maxWidth: number, size: number) {
  if (estimateTextWidth(text, size) <= maxWidth) {
    return text;
  }

  let value = text;
  while (value.length > 1 && estimateTextWidth(`${value}...`, size) > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}...`;
}

function drawText(page: PdfPage, x: number, y: number, text: string, options: PdfTextOptions = {}) {
  const font = options.font ?? FONTS.regular;
  const size = options.size ?? 11;
  const color = options.color ?? COLORS.text;
  const maxWidth = options.maxWidth ?? CONTENT_WIDTH;
  const value = ellipsize(sanitizeText(text), maxWidth, size);
  const width = estimateTextWidth(value, size);
  let drawX = x;

  if (options.align === "center") {
    drawX = x - width / 2;
  } else if (options.align === "right") {
    drawX = x - width;
  }

  page.commands.push("BT");
  page.commands.push(`${colorToPdf(color)} rg`);
  page.commands.push(`/${font} ${size} Tf`);
  page.commands.push(`${drawX.toFixed(2)} ${y.toFixed(2)} Td`);
  page.commands.push(`<${toPdfHex(value)}> Tj`);
  page.commands.push("ET");
}

function drawRect(page: PdfPage, x: number, y: number, width: number, height: number, options: PdfRectOptions = {}) {
  const commands: string[] = [];
  if (options.lineWidth) {
    commands.push(`${options.lineWidth.toFixed(2)} w`);
  }
  if (options.fill) {
    commands.push(`${colorToPdf(options.fill)} rg`);
  }
  if (options.stroke) {
    commands.push(`${colorToPdf(options.stroke)} RG`);
  }
  commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re`);

  if (options.fill && options.stroke) {
    commands.push("B");
  } else if (options.fill) {
    commands.push("f");
  } else {
    commands.push("S");
  }

  page.commands.push(...commands);
}

function formatDate(value?: string) {
  const text = sanitizeText(value);
  if (!text) {
    return "-";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-");
    return `${day}/${month}/${year}`;
  }
  return text;
}

function formatDateTime(value: Date) {
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatMoney(value?: number) {
  if (typeof value !== "number") {
    return "R$ 0.00";
  }
  return `R$ ${value.toFixed(2)}`;
}

function formatKm(value?: number) {
  if (typeof value !== "number") {
    return "-";
  }
  return value.toLocaleString("pt-BR");
}

function formatConsumption(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${value.toFixed(2)} km/l`;
}

function formatRoleLabel(role?: UserRole | null) {
  if (!role) {
    return "-";
  }

  if (role === "ADMIN") {
    return "Administrador";
  }
  if (role === "COMPANY") {
    return "Empresa";
  }
  if (role === "INDIVIDUAL") {
    return "Pessoa física";
  }
  return "Motorista";
}

function formatPlanBadge(tenant: TenantSummary | null, role?: UserRole | null) {
  if (!tenant) {
    return "-";
  }

  if (tenant.accountType === "INDIVIDUAL") {
    return `${planLabel(tenant.planCode)} • ${tenant.vehicleLimit ? `${tenant.vehicleLimit} veículos` : "Ilimitado"}`;
  }

  if (role === "DRIVER") {
    return "Perfil Motorista";
  }

  return tenant.planCode ? planLabel(tenant.planCode) : "Plano Empresa";
}

function getVisibleModules(role?: UserRole | null) {
  if (role === "DRIVER") {
    return "Painel, Abastecimentos, Manutenções";
  }
  return "Painel, Veículos, Motoristas, Abastecimentos, Manutenções, Relatórios, Planos";
}

function createPage() {
  return { commands: [], imageNames: [] } satisfies PdfPage;
}

function paintPageBackground(page: PdfPage) {
  drawRect(page, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, {
    fill: [1, 1, 1]
  });
}

function buildPdf(pages: PdfPage[], images: PdfImage[] = []) {
  const imageObjectStartId = 3 + pages.length * 2;
  const imageIdByName = new Map<string, number>();

  images.forEach((image, index) => {
    imageIdByName.set(image.name, imageObjectStartId + index);
  });

  const fontRegularId = imageObjectStartId + images.length;
  const fontBoldId = fontRegularId + 1;
  const objectsById: string[] = [];

  objectsById[1] = "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj";
  objectsById[2] = `2 0 obj<< /Type /Pages /Kids [${pages.map((_, index) => `${index + 3} 0 R`).join(" ")}] /Count ${pages.length} >>endobj`;

  pages.forEach((page, index) => {
    const pageObjectId = index + 3;
    const contentObjectId = pages.length + index + 3;
    const content = page.commands.join("\n");
    const pageImageNames = Array.from(new Set(page.imageNames)).filter((name) => imageIdByName.has(name));
    const xObjectEntries =
      pageImageNames.length > 0
        ? ` /XObject << ${pageImageNames
            .map((name) => `/${name} ${imageIdByName.get(name)} 0 R`)
            .join(" ")} >>`
        : "";

    objectsById[pageObjectId] =
      `${pageObjectId} 0 obj<< /Type /Page /Parent 2 0 R ` +
      `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >>${xObjectEntries} >> ` +
      `/Contents ${contentObjectId} 0 R >>endobj`;
    objectsById[contentObjectId] =
      `${contentObjectId} 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream\nendobj`;
  });

  images.forEach((image) => {
    const imageObjectId = imageIdByName.get(image.name);
    if (!imageObjectId) {
      return;
    }
    objectsById[imageObjectId] =
      `${imageObjectId} 0 obj<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCII85Decode /DCTDecode] /Length ${image.ascii85Data.length} >>stream\n` +
      `${image.ascii85Data}\nendstream\nendobj`;
  });

  objectsById[fontRegularId] =
    `${fontRegularId} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>endobj`;
  objectsById[fontBoldId] =
    `${fontBoldId} 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>endobj`;

  const objects = objectsById.filter(Boolean);
  const parts = ["%PDF-1.4\n"];
  const offsets: number[] = [0];
  let offset = parts[0].length;

  objects.forEach((object) => {
    offsets.push(offset);
    parts.push(`${object}\n`);
    offset += object.length + 1;
  });

  const xrefOffset = offset;
  const xrefEntries = offsets
    .map((entry, index) =>
      index === 0 ? "0000000000 65535 f \n" : `${entry.toString().padStart(10, "0")} 00000 n \n`
    )
    .join("");

  parts.push(`xref\n0 ${offsets.length}\n${xrefEntries}`);
  parts.push(`trailer<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: "application/pdf" });
}

function drawBrandCard(page: PdfPage, tenant: TenantSummary | null) {
  drawRect(page, PAGE_WIDTH / 2 - 14, PAGE_HEIGHT - 70, 28, 28, {
    fill: COLORS.iconFill,
    stroke: COLORS.lightGrid,
    lineWidth: 0.4
  });
  drawText(page, PAGE_WIDTH / 2, PAGE_HEIGHT - 60, "T", {
    font: FONTS.bold,
    size: 11,
    color: COLORS.gold,
    align: "center",
    maxWidth: 20
  });
  drawText(page, PAGE_WIDTH / 2, PAGE_HEIGHT - 84, "FLEET PLATFORM", {
    font: FONTS.bold,
    size: 10,
    color: COLORS.gold,
    align: "center",
    maxWidth: 160
  });
  drawRect(page, PAGE_WIDTH / 2 - 18, PAGE_HEIGHT - 101, 36, 14, { fill: COLORS.blueBadge });
  drawText(page, PAGE_WIDTH / 2, PAGE_HEIGHT - 96.5, "BETA", {
    font: FONTS.bold,
    size: 7,
    color: [1, 1, 1],
    align: "center",
    maxWidth: 28
  });
  drawText(page, PAGE_WIDTH / 2, PAGE_HEIGHT - 119, tenant?.name ?? "Fleet Platform", {
    font: FONTS.bold,
    size: 11,
    align: "center",
    maxWidth: 220
  });
  drawText(page, PAGE_WIDTH / 2, PAGE_HEIGHT - 138, tenant?.accountType === "INDIVIDUAL" ? "Pessoa física" : "Empresa", {
    size: 10,
    color: COLORS.muted,
    align: "center",
    maxWidth: 120
  });
}

function drawImage(page: PdfPage, imageName: string, x: number, y: number, width: number, height: number) {
  page.commands.push("q");
  page.commands.push(`${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm`);
  page.commands.push(`/${imageName} Do`);
  page.commands.push("Q");
  page.imageNames.push(imageName);
}

function bytesToAscii85(bytes: Uint8Array) {
  let result = "";

  for (let index = 0; index < bytes.length; index += 4) {
    const remaining = Math.min(4, bytes.length - index);
    let value = 0;

    for (let offset = 0; offset < 4; offset += 1) {
      value = (value << 8) | (offset < remaining ? bytes[index + offset] : 0);
    }

    if (remaining === 4 && value === 0) {
      result += "z";
      continue;
    }

    const encoded = new Array<number>(5);
    for (let position = 4; position >= 0; position -= 1) {
      encoded[position] = (value % 85) + 33;
      value = Math.floor(value / 85);
    }

    const safeLength = remaining + 1;
    for (let position = 0; position < safeLength; position += 1) {
      result += String.fromCharCode(encoded[position]);
    }
  }

  return `${result}~>`;
}

function dataUrlToBytes(dataUrl: string) {
  const dataSeparator = dataUrl.indexOf(",");
  if (dataSeparator === -1) {
    return new Uint8Array();
  }
  const base64 = dataUrl.slice(dataSeparator + 1);
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    image.src = source;
  });
}

async function loadImageForCanvas(source: string) {
  const safeSource = sanitizeText(source);
  if (!safeSource) {
    throw new Error("Imagem não informada.");
  }

  if (safeSource.startsWith("data:") || safeSource.startsWith("blob:")) {
    return loadImage(safeSource);
  }

  try {
    const response = await fetchWithTimeout(safeSource, {
      credentials: "include"
    });
    if (!response.ok) {
      throw new Error("Falha ao baixar imagem.");
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await loadImage(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return loadImage(safeSource);
  }
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const maxRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + maxRadius, y);
  context.lineTo(x + width - maxRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + maxRadius);
  context.lineTo(x + width, y + height - maxRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - maxRadius, y + height);
  context.lineTo(x + maxRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - maxRadius);
  context.lineTo(x, y + maxRadius);
  context.quadraticCurveTo(x, y, x + maxRadius, y);
  context.closePath();
}

function drawCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    font: string;
    color: string;
    maxWidth: number;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
  }
) {
  context.font = options.font;
  context.fillStyle = options.color;
  context.textAlign = options.align ?? "left";
  context.textBaseline = options.baseline ?? "alphabetic";

  let value = sanitizeText(text) || "-";
  while (value.length > 1 && context.measureText(`${value}...`).width > options.maxWidth) {
    value = value.slice(0, -1);
  }
  if (context.measureText(value).width > options.maxWidth) {
    value = `${value}...`;
  }

  context.fillText(value, x, y);
}

async function createHeaderImage(input: VehicleReportPdfInput): Promise<PdfImage | null> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const width = 640;
  const height = 760;
  canvas.width = width;
  canvas.height = height;

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#06142f");
  gradient.addColorStop(1, "#0a1734");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#2f2b21";
  drawRoundedRect(context, 225, 118, 190, 190, 56);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.lineWidth = 2;
  drawRoundedRect(context, 225, 118, 190, 190, 56);
  context.stroke();

  const logoUrl = sanitizeText(input.tenant?.photoDataUrl)
    ? resolveMediaUrl(input.tenant?.photoDataUrl)
    : "";
  let logoDrawn = false;
  if (logoUrl) {
    try {
      const logoImage = await loadImageForCanvas(logoUrl);
      context.save();
      drawRoundedRect(context, 239, 132, 162, 162, 44);
      context.clip();
      context.drawImage(logoImage, 239, 132, 162, 162);
      context.restore();
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  if (!logoDrawn) {
    context.fillStyle = "#fbbf24";
    context.font = "700 62px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText((sanitizeText(input.tenant?.name).charAt(0) || "T").toUpperCase(), 320, 212);
  }

  drawCanvasText(context, "FLEET PLATFORM", 320, 400, {
    font: "700 34px Arial",
    color: "#fbbf24",
    maxWidth: 560,
    align: "center"
  });

  context.fillStyle = "rgba(14, 165, 233, 0.32)";
  drawRoundedRect(context, 260, 430, 120, 48, 24);
  context.fill();
  drawCanvasText(context, "BETA", 320, 463, {
    font: "700 24px Arial",
    color: "#ffffff",
    maxWidth: 110,
    align: "center"
  });

  drawCanvasText(context, sanitizeText(input.tenant?.name) || "Conta", 320, 565, {
    font: "700 54px Arial",
    color: "#f8fafc",
    maxWidth: 580,
    align: "center"
  });

  drawCanvasText(
    context,
    input.tenant?.accountType === "INDIVIDUAL" ? "Pessoa física" : "Empresa",
    320,
    650,
    {
      font: "500 48px Arial",
      color: "#cbd5e1",
      maxWidth: 560,
      align: "center"
    }
  );

  drawCanvasText(context, sanitizeText(input.tenant?.documentNumber) || "", 320, 708, {
    font: "500 30px Arial",
    color: "#94a3b8",
    maxWidth: 560,
    align: "center"
  });

  let jpegDataUrl = "";
  try {
    jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
  const imageBytes = dataUrlToBytes(jpegDataUrl);

  return {
    name: "ImHeader",
    width,
    height,
    ascii85Data: bytesToAscii85(imageBytes)
  };
}

function drawIntro(page: PdfPage, input: VehicleReportPdfInput) {
  const summaryTitleY = 636;
  drawSectionTitle(page, "Resumo", summaryTitleY);
  drawTableShell(
    page,
    PAGE_MARGIN_X,
    summaryTitleY - SECTION_BAR_HEIGHT - TITLE_TO_TABLE_GAP,
    ["Abastecimentos", "Manutenções", "KM Rodados", "Média", "Valor"],
    [[
      String(input.report.summary.fuelCount),
      String(input.report.summary.maintenanceCount),
      formatKm(input.report.summary.totalDistanceKm),
      formatConsumption(input.report.summary.averageConsumption),
      formatMoney(input.report.summary.totalCost)
    ]]
  );
}

function drawTrackerHeaderCard(page: PdfPage, input: VehicleReportPdfInput) {
  const top = PAGE_HEIGHT - 24;
  const headerHeight = 170;
  const headerBottom = top - headerHeight;
  const contentLeft = PAGE_MARGIN_X + 10;
  const contentRight = PAGE_WIDTH - PAGE_MARGIN_X - 10;
  const createdAt = formatDateTime(new Date());
  const accountLabel = input.tenant
    ? input.tenant.accountType === "INDIVIDUAL"
      ? "Pessoa física"
      : "Empresa"
    : "-";

  drawRect(page, PAGE_MARGIN_X, headerBottom, CONTENT_WIDTH, headerHeight, {
    fill: [1, 1, 1],
    stroke: [0.82, 0.85, 0.9],
    lineWidth: 0.7
  });

  drawText(page, contentLeft, top - 34, "Fleet Platform", {
    font: FONTS.bold,
    size: 30,
    color: [0.13, 0.34, 0.53],
    maxWidth: 260
  });
  drawText(page, contentLeft, top - 54, input.tenant?.name ?? "Conta", {
    size: 10,
    color: [0.44, 0.44, 0.45],
    maxWidth: 260
  });

  drawText(page, contentRight, top - 30, "Relatório de Operação", {
    font: FONTS.bold,
    size: 14,
    color: [0.42, 0.42, 0.43],
    align: "right",
    maxWidth: 220
  });
  drawText(page, contentRight, top - 50, `Criado em ${createdAt}`, {
    size: 10,
    color: [0.44, 0.44, 0.45],
    align: "right",
    maxWidth: 220
  });

  const barY = headerBottom + 105;
  const segmentWidth = CONTENT_WIDTH / 4;
  drawRect(page, PAGE_MARGIN_X, barY, CONTENT_WIDTH, 2.5, { fill: [0.72, 0.8, 0.88] });
  drawRect(page, PAGE_MARGIN_X, barY, segmentWidth, 2.5, { fill: [0.15, 0.35, 0.53] });
  drawRect(page, PAGE_MARGIN_X + segmentWidth, barY, segmentWidth, 2.5, { fill: [0.35, 0.53, 0.67] });
  drawRect(page, PAGE_MARGIN_X + segmentWidth * 2, barY, segmentWidth, 2.5, { fill: [0.51, 0.66, 0.77] });

  const colWidth = CONTENT_WIDTH / 3;
  const leftX = PAGE_MARGIN_X + 10;
  const middleX = PAGE_MARGIN_X + colWidth + 10;
  const rightX = PAGE_MARGIN_X + colWidth * 2 + 10;
  const headingY = headerBottom + 74;

  drawText(page, leftX, headingY, "Informações do relatório:", {
    font: FONTS.bold,
    size: 10,
    color: [0.45, 0.45, 0.46],
    maxWidth: colWidth - 18
  });
  drawText(page, leftX, headingY - 18, `Empresa: ${input.tenant?.name ?? "-"}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });
  drawText(page, leftX, headingY - 34, `Período: ${formatDate(input.from)} até ${formatDate(input.to)}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });
  drawText(page, leftX, headingY - 50, `Tipo de conta: ${accountLabel}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });

  drawText(page, middleX, headingY, "Informações do veículo:", {
    font: FONTS.bold,
    size: 10,
    color: [0.45, 0.45, 0.46],
    maxWidth: colWidth - 18
  });
  drawText(page, middleX, headingY - 18, `Veículo: ${input.report.vehicle.model}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });
  drawText(page, middleX, headingY - 34, `Placa: ${input.report.vehicle.plate}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });
  drawText(page, middleX, headingY - 50, `KM atual: ${formatKm(input.report.vehicle.currentKm)}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });

  drawText(page, rightX, headingY, "Responsável:", {
    font: FONTS.bold,
    size: 10,
    color: [0.45, 0.45, 0.46],
    maxWidth: colWidth - 18
  });
  drawText(page, rightX, headingY - 18, `Nome: ${sanitizeText(input.operator?.fullName) || "-"}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });
  drawText(page, rightX, headingY - 34, `Perfil: ${formatRoleLabel(input.operator?.role)}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });
  drawText(page, rightX, headingY - 50, `E-mail: ${sanitizeText(input.operator?.email) || "-"}`, {
    size: 9,
    color: [0.4, 0.4, 0.41],
    maxWidth: colWidth - 18
  });
}

function drawTableShell(page: PdfPage, x: number, topY: number, headers: string[], rows: string[][]) {
  const tableWidth = CONTENT_WIDTH;
  const columns = headers.length;
  const columnWidth = tableWidth / columns;
  const headerRowBottom = topY - TABLE_HEADER_HEIGHT;
  const tableHeight = TABLE_HEADER_HEIGHT + rows.length * TABLE_ROW_HEIGHT;

  drawRect(page, x, topY - tableHeight, tableWidth, tableHeight, {
    stroke: [0.72, 0.78, 0.86],
    lineWidth: 0.8
  });

  headers.forEach((header, index) => {
    const cellX = x + index * columnWidth;
    drawRect(page, cellX, headerRowBottom, columnWidth, TABLE_HEADER_HEIGHT, {
      fill: [0.13, 0.34, 0.53],
      stroke: [0.11, 0.28, 0.43],
      lineWidth: 0.7
    });
    drawText(page, cellX + columnWidth / 2, headerRowBottom + 7, header, {
      font: FONTS.bold,
      size: 10,
      color: [1, 1, 1],
      align: "center",
      maxWidth: columnWidth - 8
    });
  });

  rows.forEach((row, rowIndex) => {
    const rowBottom = headerRowBottom - (rowIndex + 1) * TABLE_ROW_HEIGHT;
    row.forEach((cell, columnIndex) => {
      const cellX = x + columnIndex * columnWidth;
      drawRect(page, cellX, rowBottom, columnWidth, TABLE_ROW_HEIGHT, {
        fill: rowIndex % 2 === 0 ? [1, 1, 1] : [0.965, 0.972, 0.984],
        stroke: [0.74, 0.79, 0.86],
        lineWidth: 0.65
      });
      drawText(page, cellX + columnWidth / 2, rowBottom + 6, cell, {
        size: 10,
        color: [0.19, 0.2, 0.23],
        align: "center",
        maxWidth: columnWidth - 10
      });
    });
  });
}

function drawSectionTitle(page: PdfPage, text: string, y: number) {
  drawRect(page, PAGE_MARGIN_X, y - SECTION_BAR_HEIGHT, CONTENT_WIDTH, SECTION_BAR_HEIGHT, {
    fill: [0.13, 0.34, 0.53]
  });
  drawText(page, PAGE_MARGIN_X + 10, y - 14, text, {
    font: FONTS.bold,
    size: 11,
    color: [1, 1, 1],
    maxWidth: 320
  });
}

function buildFuelRows(fuelLogs: VehicleReportFuelItem[]) {
  if (!fuelLogs.length) {
    return [["Sem registros", "-", "-", "-", "-"]];
  }

  return fuelLogs.map((item) => [
    formatDate(item.fueledAt),
    formatKm(item.odometerKm),
    formatKm(item.distanceKm),
    formatConsumption(item.averageConsumption),
    formatMoney(item.totalCost)
  ]);
}

function buildMaintenanceRows(maintenanceLogs: VehicleReportMaintenanceItem[]) {
  if (!maintenanceLogs.length) {
    return [["Sem registros", "-", "-", "-", "-"]];
  }

  return maintenanceLogs.map((item) => [
    formatDate(item.performedAt),
    formatKm(item.odometerKm),
    sanitizeText(item.title) || "-",
    formatMaintenanceType(item.maintenanceType),
    formatMoney(item.totalCost)
  ]);
}

function buildPerformanceRows(fuelLogs: VehicleReportFuelItem[]) {
  const insights = buildReportPerformanceInsights(fuelLogs);
  if (!insights.length) {
    return [["Sem dados", "-", "-"]];
  }

  return insights.map((item) => [item.label, item.value, item.detail]);
}

function paginateTableRows(
  pages: PdfPage[],
  startPage: PdfPage,
  startY: number,
  sectionTitle: string,
  headers: string[],
  rows: string[][],
  isFirstSectionOnPage = false
) {
  let page = startPage;
  let currentY = startY;
  let remainingRows = [...rows];
  let pageIsFirst = isFirstSectionOnPage;

  while (remainingRows.length > 0) {
    const headingGap = pageIsFirst ? 0 : INTER_SECTION_GAP;
    const minBottom = 48;
    const availableHeight = currentY - headingGap - minBottom;
    const fixedTableHeight = TABLE_HEADER_HEIGHT;
    const fitRows = Math.max(
      1,
      Math.floor((availableHeight - SECTION_BAR_HEIGHT - TABLE_BOTTOM_GAP - fixedTableHeight) / TABLE_ROW_HEIGHT)
    );
    const chunk = remainingRows.slice(0, fitRows);

    currentY -= headingGap;
    drawSectionTitle(page, sectionTitle, currentY);
    currentY -= SECTION_BAR_HEIGHT + TITLE_TO_TABLE_GAP;
    drawTableShell(page, PAGE_MARGIN_X, currentY, headers, chunk);
    currentY -= TABLE_HEADER_HEIGHT + chunk.length * TABLE_ROW_HEIGHT + TABLE_BOTTOM_GAP;
    remainingRows = remainingRows.slice(chunk.length);

    if (remainingRows.length > 0) {
      page = createPage();
      pages.push(page);
      paintPageBackground(page);
      currentY = PAGE_HEIGHT - 78;
      pageIsFirst = true;
    }
  }

  return { page, currentY };
}

export async function createVehicleReportPdfBlob(input: VehicleReportPdfInput) {
  const pages: PdfPage[] = [];
  const firstPage = createPage();
  pages.push(firstPage);
  paintPageBackground(firstPage);
  drawTrackerHeaderCard(firstPage, input);
  drawIntro(firstPage, input);

  const performanceRows = buildPerformanceRows(input.report.fuelLogs);
  const performanceSection = paginateTableRows(
    pages,
    firstPage,
    554,
    "Desempenho",
    ["Indicador", "Valor", "Detalhe"],
    performanceRows,
    true
  );

  const fuelRows = buildFuelRows(input.report.fuelLogs);
  const fuelSection = paginateTableRows(
    pages,
    performanceSection.page,
    performanceSection.currentY,
    "Abastecimentos",
    ["Data", "KM", "KM Rodados", "Média", "Valor"],
    fuelRows,
    false
  );

  const maintenanceRows = buildMaintenanceRows(input.report.maintenanceLogs);
  paginateTableRows(
    pages,
    fuelSection.page,
    fuelSection.currentY,
    "Manutenções",
    ["Data", "KM", "Serviço", "Tipo", "Valor"],
    maintenanceRows,
    false
  );

  return buildPdf(pages);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (!("download" in HTMLAnchorElement.prototype)) {
    window.location.assign(url);
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
