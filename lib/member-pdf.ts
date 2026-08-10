import { jsPDF } from "jspdf";
import { Member } from "@/types/member";

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
function drawAcePrefix(pdf: jsPDF, x: number, y: number, suffix: string, size = 8) {
  pdf.setTextColor(INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(size);
  pdf.text("ACE", x, y);
  const aceWidth = pdf.getTextWidth("ACE");
  const markX = x + aceWidth + 1;
  const scale = size / 10;
  pdf.setDrawColor(INK);
  pdf.setLineWidth(Math.max(0.35, size * 0.075));
  pdf.lines(
    [[3.8 * scale, -2.8 * scale], [2.2 * scale, 2.4 * scale], [-2.5 * scale, 1.8 * scale]],
    markX,
    y - 5.8 * scale,
    1,
    "S",
    false,
  );
  pdf.lines(
    [[2.7 * scale, -1.9 * scale], [1.8 * scale, 1.8 * scale], [-2.1 * scale, 1.5 * scale]],
    markX + 0.8 * scale,
    y - 1.1 * scale,
    1,
    "S",
    false,
  );
  pdf.text(suffix, markX + 5.6 * scale, y);
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
    pdf.setTextColor("#991b1b");
    pdf.setFontSize(14);
    pdf.text("✓", x + 35.5, y + 1.5);
  }
}

export async function downloadMemberPdf(member: Member) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const headerFigure = await loadAssetDataUrl("/assets/ace-gym-header-figure.png");
  const wordmark = await loadAssetDataUrl("/assets/ace-gym-wordmark.png");
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const content = width - margin * 2;
  let y = 9;

  pdf.setDrawColor(BORDER);
  pdf.setLineWidth(0.7);
  pdf.rect(margin, margin, content, height - margin * 2, "S");

  if (headerFigure) {
    pdf.addImage(headerFigure, "PNG", width / 2 - 10, y + 3, 20, 18, undefined, "FAST");
  }
  pdf.setTextColor(INK);
  drawAcePrefix(pdf, margin + 8, y + 8, "Shubham", 10);
  pdf.setFontSize(8);
  pdf.text("7717728536", margin + 8, y + 14);

  pdf.setFontSize(9);
  pdf.text("For Men & Women", width - margin - 8, y + 8, { align: "right" });
  if (wordmark) {
    pdf.addImage(wordmark, "PNG", width / 2 - 31, y + 24, 62, 12, undefined, "FAST");
  }
  pdf.setFontSize(10);
  pdf.text("BUILT not BORN", width / 2, y + 39, { align: "center" });
  y += 50;
  line(pdf, margin + 1, y, width - margin - 1);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text("Membership ID:", margin + 8, y + 10);
  drawAcePrefix(pdf, margin + 33, y + 10, membershipIdSuffix(member), 7);
  checkbox(pdf, "Admission", margin + 92, y + 10, false);
  checkbox(pdf, "Renewal", margin + 138, y + 10, false);
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
  labelLine(pdf, "Start Date:", formatDate(member.join_date), margin + 104, y, 76);
  labelLine(pdf, "Total Amount:", money(member.monthly_fee), margin + 7, y + 11, 75);
  labelLine(pdf, "End Date:", formatDate(member.next_due_date), margin + 104, y + 11, 76);
  labelLine(pdf, "Dues Amount:", "", margin + 7, y + 22, 75);
  labelLine(pdf, "Package For:", member.membership_plan, margin + 104, y + 22, 76);
  labelLine(pdf, "Payment Type:", member.payment_type ?? "UPI", margin + 7, y + 33, 95);
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
  pdf.text(`Generated on: ${formatDate(new Date().toISOString().slice(0, 10))}`, margin + 10, y + 22);
  pdf.text("Keep this membership form for your records", width - margin - 7, height - 14, { align: "right" });

  const safeName = member.full_name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "member";
  pdf.save(`ace-gym-${safeName}-membership.pdf`);
}
