import { jsPDF } from "jspdf";

import { Member } from "@/types/member";

const NAVY = "#111827";
const SLATE = "#475569";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const AMBER = "#f59e0b";
const PALE = "#fff7ed";

const rules = [
  "Fee is non-refundable under any circumstances.",
  "All members are permitted one workout visit per day.",
  "Proper athletic footwear is required inside the gym premises. Slippers and sandals are not permitted.",
  "Any member found defacing or damaging gym premises or property will be subject to disciplinary action.",
  "The gym organization is not responsible for lost or stolen articles.",
  "Members must follow all gym rules and regulations and maintain proper cleanliness.",
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function setColor(pdf: jsPDF, hex: string, type: "text" | "fill" | "draw") {
  const { r, g, b } = hexToRgb(hex);
  if (type === "text") pdf.setTextColor(r, g, b);
  if (type === "fill") pdf.setFillColor(r, g, b);
  if (type === "draw") pdf.setDrawColor(r, g, b);
}

function labelValue(pdf: jsPDF, label: string, value: string, x: number, y: number, width: number) {
  setColor(pdf, MUTED, "text");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.text(label.toUpperCase(), x, y);
  setColor(pdf, NAVY, "text");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const lines = pdf.splitTextToSize(value || "—", width);
  pdf.text(lines, x, y + 13);
}

export function downloadMemberPdf(member: Member) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  setColor(pdf, NAVY, "fill");
  pdf.rect(0, 0, pageWidth, 47, "F");
  setColor(pdf, AMBER, "fill");
  pdf.rect(0, 44, pageWidth, 3, "F");

  setColor(pdf, "#ffffff", "text");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(23);
  pdf.text("ACE GYM", margin, 20);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(203, 213, 225);
  pdf.text("MEMBERSHIP REGISTRATION", margin, 30);
  pdf.setFontSize(8);
  pdf.text("Member profile and membership terms", margin, 38);

  setColor(pdf, "#ffffff", "text");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("MEMBER ID", pageWidth - margin, 18, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(member.id.slice(0, 8).toUpperCase(), pageWidth - margin, 27, { align: "right" });
  pdf.setFontSize(8);
  pdf.setTextColor(203, 213, 225);
  pdf.text(`Issued ${formatDate(new Date().toISOString().slice(0, 10))}`, pageWidth - margin, 37, { align: "right" });

  let y = 64;
  setColor(pdf, NAVY, "text");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.text(member.full_name, margin, y);
  y += 8;
  setColor(pdf, MUTED, "text");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("Registered member", margin, y);

  y += 16;
  setColor(pdf, BORDER, "draw");
  pdf.setLineWidth(0.35);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 16;

  setColor(pdf, NAVY, "text");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Personal information", margin, y);
  y += 12;
  labelValue(pdf, "Phone", member.phone, margin, y, 50);
  labelValue(pdf, "Email", member.email || "Not provided", margin + 62, y, 62);
  labelValue(pdf, "Gender", member.gender || "Not provided", margin + 132, y, 45);
  y += 30;
  labelValue(pdf, "Emergency contact", member.emergency_contact || "Not provided", margin, y, 75);
  y += 28;

  setColor(pdf, NAVY, "text");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("Membership details", margin, y);
  y += 9;

  setColor(pdf, PALE, "fill");
  pdf.roundedRect(margin, y, contentWidth, 36, 3, 3, "F");
  setColor(pdf, AMBER, "draw");
  pdf.setLineWidth(1.2);
  pdf.line(margin, y + 5, margin, y + 31);
  labelValue(pdf, "Plan", member.membership_plan, margin + 9, y + 11, 48);
  labelValue(pdf, "Monthly fee", formatCurrency(member.monthly_fee), margin + 79, y + 11, 48);
  labelValue(pdf, "Join date", formatDate(member.join_date), margin + 149, y + 11, 38);
  y += 52;
  labelValue(pdf, "Next due date", formatDate(member.next_due_date), margin, y, 55);
  if (member.notes) labelValue(pdf, "Notes", member.notes, margin + 79, y, 95);
  y += 31;

  if (y > pageHeight - 105) {
    pdf.addPage();
    y = 22;
  }

  setColor(pdf, NAVY, "text");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Member acknowledgement and gym rules", margin, y);
  y += 7;
  setColor(pdf, MUTED, "text");
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text("Please read the following terms carefully. These conditions apply to all memberships.", margin, y);
  y += 8;

  setColor(pdf, "#f8fafc", "fill");
  pdf.roundedRect(margin, y, contentWidth, 67, 2, 2, "F");
  y += 8;
  rules.forEach((rule, index) => {
    setColor(pdf, AMBER, "fill");
    pdf.circle(margin + 5, y - 1.5, 1.4, "F");
    setColor(pdf, SLATE, "text");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.6);
    const lines = pdf.splitTextToSize(`${index + 1}. ${rule}`, contentWidth - 16);
    pdf.text(lines, margin + 11, y);
    y += lines.length * 4.1 + 3.1;
  });

  const footerY = pageHeight - 14;
  setColor(pdf, BORDER, "draw");
  pdf.setLineWidth(0.3);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  setColor(pdf, MUTED, "text");
  pdf.setFontSize(7);
  pdf.text("ACE GYM  •  Member document", margin, footerY);
  pdf.text("Keep this document for your records", pageWidth - margin, footerY, { align: "right" });

  const safeName = member.full_name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "member";
  pdf.save(`ace-gym-${safeName}-membership.pdf`);
}
