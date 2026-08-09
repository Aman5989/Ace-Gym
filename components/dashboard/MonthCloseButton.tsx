"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MonthCloseButton({ paymentCount, total }: { paymentCount: number; total: number }) {
  const [busy, setBusy] = useState(false);

  async function closeMonth() {
    if (!window.confirm(`Verify ${paymentCount} payment${paymentCount === 1 ? "" : "s"} totaling ₹${total.toLocaleString("en-IN")} and start a new collection period? Payment records will be preserved.`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/collection-period", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to close collection period");
      toast.success("Collection period verified and closed");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to close collection period");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={closeMonth} disabled={busy} variant="outline" className="h-11 rounded-xl border-amber-300/20 bg-amber-300/10 px-4 text-amber-100 hover:bg-amber-300/20">
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
      {busy ? "Closing…" : "Verify & Close Month"}
      {!busy && paymentCount > 0 ? <CheckCircle2 className="ml-2 h-4 w-4 text-emerald-300" /> : null}
    </Button>
  );
}
