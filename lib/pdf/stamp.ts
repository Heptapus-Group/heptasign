import fs from "fs/promises";
import path from "path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import { generateCode128Png } from "@/lib/barcode/barcode";
import { generateQrPng } from "@/lib/qr/qr";

type StampInput = {
  originalPdf: Buffer;
  documentCode: string;
  signerName: string;
  signerRole: string;
  signedAt: Date;
  verificationUrl: string;
};

const approvalText =
  "Bu belge Heptapus İmza Sistemi üzerinden onaylanmış ve doğrulanabilir hale getirilmiştir.";

const brandColor = rgb(0.06, 0.28, 0.26);
const textColor = rgb(0.12, 0.16, 0.2);
const mutedColor = rgb(0.38, 0.44, 0.5);

async function readFont(name: string) {
  return fs.readFile(path.join(process.cwd(), "node_modules", "dejavu-fonts-ttf", "ttf", name));
}

async function readLogo() {
  const candidates = [
    path.join(process.cwd(), "public", "logo.png"),
    path.join(process.cwd(), "logo.png")
  ];

  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate);
    } catch {
      // Try the next location.
    }
  }

  return null;
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number) {
  const words = text.split(/(\s+)/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = `${line}${word}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line.trim()) lines.push(line.trimEnd());
    line = "";

    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      line = word.trimStart();
      continue;
    }

    let chunk = "";
    for (const char of word) {
      const next = `${chunk}${char}`;
      if (font.widthOfTextAtSize(next, size) > maxWidth && chunk) {
        lines.push(chunk);
        chunk = char;
      } else {
        chunk = next;
      }
    }
    line = chunk;
  }

  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

function drawWrappedText(args: {
  page: ReturnType<PDFDocument["getPages"]>[number];
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  size: number;
  lineHeight: number;
  color: ReturnType<typeof rgb>;
}) {
  const lines = wrapText(args.text, args.font, args.size, args.maxWidth);
  lines.forEach((line, index) => {
    args.page.drawText(line, {
      x: args.x,
      y: args.y - index * args.lineHeight,
      font: args.font,
      size: args.size,
      color: args.color
    });
  });
  return args.y - lines.length * args.lineHeight;
}

function stampPageQr(args: {
  page: ReturnType<PDFDocument["getPages"]>[number];
  qrImage: Awaited<ReturnType<PDFDocument["embedPng"]>>;
  logoImage: Awaited<ReturnType<PDFDocument["embedPng"]>> | null;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
}) {
  const { page, qrImage, logoImage, font } = args;
  const { width, height } = page.getSize();
  const qrSize = 54;
  const margin = 18;
  const x = width - qrSize - margin;
  const y = height - qrSize - margin;

  page.drawRectangle({
    x: x - 4,
    y: y - 18,
    width: qrSize + 8,
    height: qrSize + 22,
    color: rgb(1, 1, 1),
    opacity: 0.94
  });

  page.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });
  if (logoImage) {
    const logoSize = qrSize * 0.16;
    const logoX = x + qrSize / 2 - logoSize / 2;
    const logoY = y + qrSize / 2 - logoSize / 2;
    page.drawRectangle({
      x: logoX - 1.5,
      y: logoY - 1.5,
      width: logoSize + 3,
      height: logoSize + 3,
      color: rgb(1, 1, 1),
      opacity: 0.98
    });
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: logoSize,
      height: logoSize
    });
  }
  page.drawText("Doğrula", {
    x: x + 12,
    y: y - 11,
    font,
    size: 6.5,
    color: brandColor
  });
}

export async function stampSignedPdf(input: StampInput) {
  const pdf = await PDFDocument.load(input.originalPdf);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await readFont("DejaVuSans.ttf"));
  const bold = await pdf.embedFont(await readFont("DejaVuSans-Bold.ttf"));
  const qrImage = await pdf.embedPng(await generateQrPng(input.verificationUrl));
  const logoBytes = await readLogo();
  const logoImage = logoBytes ? await pdf.embedPng(logoBytes) : null;
  const barcodeImage = await pdf.embedPng(await generateCode128Png(input.documentCode));

  for (const existingPage of pdf.getPages()) {
    stampPageQr({ page: existingPage, qrImage, logoImage, font });
  }

  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 42;
  const contentWidth = width - margin * 2;
  const titleY = height - 70;

  page.drawRectangle({
    x: 0,
    y: height - 124,
    width,
    height: 124,
    color: rgb(0.95, 0.98, 0.97)
  });
  page.drawRectangle({
    x: 0,
    y: height - 126,
    width,
    height: 2,
    color: brandColor
  });

  if (logoImage) {
    page.drawImage(logoImage, {
      x: width - margin - 48,
      y: height - 100,
      width: 48,
      height: 48
    });
  }

  page.drawText("HEPTAPUS İMZA SİSTEMİ", {
    x: margin,
    y: titleY,
    font: bold,
    size: 18,
    color: brandColor
  });
  page.drawText("Onay ve doğrulama kaydı", {
    x: margin,
    y: titleY - 22,
    font,
    size: 10,
    color: mutedColor
  });

  drawWrappedText({
    page,
    text: approvalText,
    x: margin,
    y: height - 158,
    font,
    size: 10.5,
    lineHeight: 15,
    maxWidth: contentWidth,
    color: textColor
  });

  const panelTop = height - 220;
  const panelHeight = 176;
  page.drawRectangle({
    x: margin,
    y: panelTop - panelHeight,
    width: contentWidth,
    height: panelHeight,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.86, 0.9, 0.94),
    borderWidth: 1
  });

  const rows = [
    ["Belge Kodu", input.documentCode],
    ["İmzalayan", input.signerName],
    ["Unvan / Rol", input.signerRole],
    ["İmza Tarihi", input.signedAt.toISOString()]
  ];
  const labelX = margin + 20;
  const valueX = margin + 150;
  let y = panelTop - 34;

  for (const [label, value] of rows) {
    page.drawText(label, { x: labelX, y, font: bold, size: 9.5, color: mutedColor });
    page.drawText(value, {
      x: valueX,
      y,
      font,
      size: 10,
      color: textColor,
      maxWidth: width - valueX - margin - 20
    });
    y -= 28;
  }

  page.drawText("Doğrulama Bağlantısı", { x: labelX, y, font: bold, size: 9.5, color: mutedColor });
  drawWrappedText({
    page,
    text: input.verificationUrl,
    x: valueX,
    y,
    maxWidth: width - valueX - margin - 20,
    font,
    size: 8.5,
    lineHeight: 11,
    color: textColor
  });

  const qrX = margin + 22;
  const qrY = 155;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: 128,
    height: 128
  });
  if (logoImage) {
    const logoSize = 20;
    const logoX = qrX + 64 - logoSize / 2;
    const logoY = qrY + 64 - logoSize / 2;
    page.drawRectangle({
      x: logoX - 3,
      y: logoY - 3,
      width: logoSize + 6,
      height: logoSize + 6,
      color: rgb(1, 1, 1),
      opacity: 0.98
    });
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: logoSize,
      height: logoSize
    });
  }

  page.drawText("QR kodu okutarak doğrulayın", {
    x: qrX,
    y: qrY - 18,
    font,
    size: 8.5,
    color: mutedColor
  });

  page.drawImage(barcodeImage, {
    x: 220,
    y: 184,
    width: width - 262,
    height: 70
  });

  page.drawText(input.documentCode, {
    x: 220,
    y: 168,
    font: bold,
    size: 11,
    color: textColor
  });

  page.drawText("Bu sayfa belgeye eklenen iç onay kaydıdır. Hukuki nitelikli elektronik imza yerine geçmez.", {
    x: margin,
    y: 74,
    font,
    size: 8.5,
    color: mutedColor,
    maxWidth: contentWidth
  });

  return Buffer.from(await pdf.save());
}
