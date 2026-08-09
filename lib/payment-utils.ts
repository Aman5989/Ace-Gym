import { PaymentMethod } from "@/types/payment";

const PLAN_MONTHS: Record<string, number> = {
  Monthly: 1,
  Quarterly: 3,
  "Half Yearly": 6,
  Yearly: 12,
};

export const paymentMethods: PaymentMethod[] = [
  "UPI",
  "Cash",
  "Half UPI + Half Cash",
  "Card",
  "Bank Transfer",
];

export function getPlanMonths(plan: string) {
  return PLAN_MONTHS[plan] ?? 1;
}

export function toDateInputValue(value: Date | string) {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function advanceDueDate(currentDueDate: string, plan: string, paymentDate: string) {
  const dueDate = new Date(`${currentDueDate}T00:00:00`);
  const paidOn = new Date(`${paymentDate}T00:00:00`);
  const nextDue = new Date(Math.max(dueDate.getTime(), paidOn.getTime()));
  nextDue.setMonth(nextDue.getMonth() + getPlanMonths(plan));
  return toDateInputValue(nextDue);
}

export function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
