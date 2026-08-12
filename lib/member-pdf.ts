import { jsPDF } from "jspdf";
import { Member } from "@/types/member";

export interface RenewalPdfData {
  paymentId?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  membershipPlan: string;
  nextDueDate: string;
}

async function loadAssetDataUrl(path: string) {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const INK = "#111827";
const MUTED = "#374151";
const BORDER = "#1f2937";
const LIGHT = "#f3f4f6";
const rules = [
  "Fee is non-refundable in any condition.",
  "All members are allowed only one time a day for workout.",
  "Proper athletic footwear is only acceptable in Gym premise. No slippers or sandals are allowed.",
  "Anyone found defaming or damaging Gym premise or property will be subjected to disciplinary action.",
  "Gym organization is not responsible for loss or stolen articles.",
  "Member should follow all Gym rules & regulations and maintain proper cleanliness.",
];

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function money(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function membershipIdSuffix(member: Member) {
  const namePart = member.full_name.replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase().padEnd(4, "X");
  const phoneDigits = (member.phone ?? "").replace(/\D/g, "");
  return `${namePart}${phoneDigits.slice(-2).padStart(2, "0")}`;
}

/** Draws ACE々 text while keeping the special symbol in the custom font. */
function drawAceText(pdf: jsPDF, customFont: string, x: number, y: number, suffix: string, size = 8) {
  pdf.setTextColor(INK);
  pdf.setFontSize(size);
  pdf.setFont("helvetica", "normal");
  pdf.text("ACE", x, y);
  const aceWidth = pdf.getTextWidth("ACE");
  pdf.setFont(customFont, "normal");
  pdf.text("々", x + aceWidth, y);
  const symbolWidth = pdf.getTextWidth("々");
  pdf.setFont("helvetica", "normal");
  pdf.text(suffix, x + aceWidth + symbolWidth, y);
}

function line(pdf: jsPDF, x1: number, y: number, x2: number) {
  pdf.setDrawColor(BORDER);
  pdf.setLineWidth(0.3);
  pdf.line(x1, y, x2, y);
}

function labelLine(pdf: jsPDF, label: string, value: string, x: number, y: number, width: number) {
  pdf.setTextColor(INK);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(label, x, y);
  const valueX = x + pdf.getTextWidth(label) + 2;
  line(pdf, valueX, y + 1.5, x + width);
  if (value) {
    pdf.setFont("helvetica", "bold");
    pdf.text(value, valueX + 1, y - 0.5);
  }
}

function sectionTitle(pdf: jsPDF, title: string, x: number, y: number, width: number) {
  pdf.setFillColor(LIGHT);
  pdf.rect(x, y, width, 8, "F");
  pdf.setDrawColor(BORDER);
  pdf.rect(x, y, width, 8, "S");
  pdf.setTextColor(INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(title, x + 4, y + 5.5);
}

function checkbox(pdf: jsPDF, label: string, x: number, y: number, checked: boolean) {
  pdf.setFillColor(INK);
  pdf.rect(x, y - 5, 32, 8, "F");
  pdf.setTextColor("#ffffff");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(label, x + 3, y + 1);
  pdf.setDrawColor(BORDER);
  pdf.setFillColor("#ffffff");
  pdf.rect(x + 35, y - 5, 8, 8, "FD");
  if (checked) {
    // Draw the tick as vector strokes instead of a Unicode glyph. Helvetica
    // does not reliably contain ✓, which can render as an apostrophe-like mark.
    pdf.setDrawColor("#991b1b");
    pdf.setLineWidth(0.9);
    pdf.line(x + 36.5, y - 1.2, x + 38.5, y + 1);
    pdf.line(x + 38.5, y + 1, x + 41.5, y - 2.8);
  }
}

async function preparePdf() {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const headerFigure = await loadAssetDataUrl("/assets/ace-gym-header-figure.png");
  const wordmark = await loadAssetDataUrl("/assets/ace-gym-wordmark.png");
  const aceFontDataUrl = await loadAssetDataUrl("/assets/AceSymbol.ttf");

  let aceFont = "helvetica";
  if (aceFontDataUrl) {
    try {
      const base64 = aceFontDataUrl.split(",")[1];
      pdf.addFileToVFS("AceSymbol.ttf", base64);
      pdf.addFont("AceSymbol.ttf", "AceSymbol", "normal");
      aceFont = "AceSymbol";
    } catch {
      aceFont = "helvetica";
    }
  }

  return { pdf, headerFigure, wordmark, aceFont };
}

function drawCommonDocument(
  pdf: jsPDF,
  headerFigure: string | null,
  wordmark: string | null,
  aceFont: string,
  member: Member,
  details: { renewal: boolean; amount: number; paymentDate: string; nextDueDate: string; membershipPlan: string; paymentMethod: string },
) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const content = width - margin * 2;
  let y = 9;

  pdf.setDrawColor(BORDER);
  pdf.setLineWidth(0.7);
  pdf.rect(margin, margin, content, height - margin * 2, "S");

  if (headerFigure) pdf.addImage(headerFigure, "PNG", width / 2 - 10, y + 3, 20, 18, undefined, "FAST");

  drawAceText(pdf, aceFont, margin + 8, y + 8, "Shubham", 10);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("7717728536", margin + 8, y + 14);
  pdf.setFontSize(9);
  pdf.text("For Men & Women", width - margin - 8, y + 8, { align: "right" });

  if (wordmark) pdf.addImage(wordmark, "PNG", width / 2 - 31, y + 24, 62, 12, undefined, "FAST");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("BUILT not BORN", width / 2, y + 39, { align: "center" });

  y += 50;
  line(pdf, margin + 1, y, width - margin - 1);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text("Membership ID:", margin + 8, y + 10);
  drawAceText(pdf, aceFont, margin + 33, y + 10, membershipIdSuffix(member), 7);
  checkbox(pdf, "Admission", margin + 92, y + 10, !details.renewal);
  checkbox(pdf, "Renewal", margin + 138, y + 10, details.renewal);
  y += 20;

  sectionTitle(pdf, "Personal Information", margin + 2, y, content - 4);
  y += 16;
  labelLine(pdf, "Name:", member.full_name, margin + 7, y, content - 14);
  labelLine(pdf, "Father's Name:", member.father_name ?? "", margin + 7, y + 10, content - 14);
  labelLine(pdf, "Address:", member.address ?? "", margin + 7, y + 20, content - 14);
  labelLine(pdf, "Contact No.:", member.phone, margin + 7, y + 30, 100);
  labelLine(pdf, "Age:", "", margin + 115, y + 30, 65);
  labelLine(pdf, "Sex:", member.gender ?? "", margin + 7, y + 40, 62);
  labelLine(pdf, "Height:", "", margin + 75, y + 40, 62);
  labelLine(pdf, "Weight:", "", margin + 143, y + 40, 47);
  y += 49;

  sectionTitle(pdf, "Gym Information", margin + 2, y, content - 4);
  y += 16;
  labelLine(pdf, "Timing:", member.timing ?? "", margin + 7, y, 75);
  labelLine(pdf, details.renewal ? "Renewal Date:" : "Start Date:", formatDate(details.paymentDate), margin + 104, y, 76);
  labelLine(pdf, "Total Amount:", money(details.amount), margin + 7, y + 11, 75);
  labelLine(pdf, "End Date:", formatDate(details.nextDueDate), margin + 104, y + 11, 76);
  labelLine(pdf, "Dues Amount:", "", margin + 7, y + 22, 75);
  labelLine(pdf, "Package For:", details.membershipPlan, margin + 104, y + 22, 76);
  labelLine(pdf, "Payment Type:", details.paymentMethod || member.payment_type || "UPI", margin + 7, y + 33, 95);
  pdf.setTextColor(MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("1 Month / 3 Month / 6 Month / 12 Month", margin + 105, y + 33);
  y += 48;

  sectionTitle(pdf, "Rules & Regulations", margin + 2, y, content - 4);
  y += 13;
  pdf.setTextColor(INK);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.4);
  for (const rule of rules) {
    pdf.text("•", margin + 8, y);
    const lines = pdf.splitTextToSize(rule, content - 22);
    pdf.text(lines, margin + 14, y);
    y += lines.length * 4.2 + 2.2;
  }

  y = Math.min(y + 5, height - 30);
  line(pdf, margin + 7, y, width - margin - 7);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("Member Signature", margin + 10, y + 13);
  pdf.text("Director", width - margin - 20, y + 13, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(MUTED);
  pdf.text(`Generated on: ${formatDate(new Date().toISOString().slice(0, 10))}`, margin + 1, height - 6);
  pdf.text("Keep this membership form for your records", width - margin - 1, height - 6, { align: "right" });
}

export async function createMemberPdf(member: Member) {
  const { pdf, headerFigure, wordmark, aceFont } = await preparePdf();
  drawCommonDocument(pdf, headerFigure, wordmark, aceFont, member, {
    renewal: false,
    amount: member.monthly_fee,
    paymentDate: member.join_date,
    nextDueDate: member.next_due_date,
    membershipPlan: member.membership_plan,
    paymentMethod: member.payment_type ?? "UPI",
  });
  return pdf;
}

export async function createRenewalPdf(member: Member, renewal: RenewalPdfData) {
  const { pdf, headerFigure, wordmark, aceFont } = await preparePdf();
  drawCommonDocument(pdf, headerFigure, wordmark, aceFont, member, {
    renewal: true,
    amount: renewal.amount,
    paymentDate: renewal.paymentDate,
    nextDueDate: renewal.nextDueDate,
    membershipPlan: renewal.membershipPlan,
    paymentMethod: renewal.paymentMethod,
  });
  return pdf;
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "member";
}

export async function downloadMemberPdf(member: Member) {
  const pdf = await createMemberPdf(member);
  pdf.save(`ace-gym-${safeFileName(member.full_name)}-membership.pdf`);
}

export async function downloadRenewalPdf(member: Member, renewal: RenewalPdfData) {
  const pdf = await createRenewalPdf(member, renewal);
  pdf.save(`ace-gym-${safeFileName(member.full_name)}-renewal.pdf`);
}

export async function printMemberPdf(member: Member) {
  const pdf = await createMemberPdf(member);
  printPdf(pdf);
}

export async function printRenewalPdf(member: Member, renewal: RenewalPdfData) {
  const pdf = await createRenewalPdf(member, renewal);
  printPdf(pdf);
}

function printPdf(pdf: jsPDF) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) throw new Error("Please allow pop-ups to print the PDF");

  const dataUri = pdf.output("datauristring");
  printWindow.document.write(`<!doctype html><html><head><title>ACE々GYM PDF</title></head><body style="margin:0;overflow:hidden"><iframe id="pdf-frame" title="ACE々GYM PDF" style="border:0;width:100vw;height:100vh" src="${dataUri}"></iframe></body></html>`);
  printWindow.document.close();
  printWindow.focus();

  const print = () => {
    printWindow.focus();
    printWindow.print();
  };
  window.setTimeout(print, 900);
}
