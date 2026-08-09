"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createClient } from "@/lib/supabase";

import { Member } from "@/types/member";
import { getPlanMonths, toDateInputValue } from "@/lib/payment-utils";

interface Props {
  member?: Member;
  onSuccess?: () => void;
}

const plans = [
  "Monthly",
  "Quarterly",
  "Half Yearly",
  "Yearly",
];

const genders = [
  "Male",
  "Female",
  "Other",
];

const timings = [
  "Morning",
  "Evening",
] as const;
const paymentTypes = [
  "UPI",
  "Cash",
  "Half UPI + Half Cash",
] as const;

function defaultDueDate(plan: string, joinDate: string) {
  const date = new Date(`${joinDate}T00:00:00`);
  date.setMonth(date.getMonth() + getPlanMonths(plan));
  return toDateInputValue(date);
}

export default function MemberForm({
  member,
  onSuccess,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);

  const today = toDateInputValue(new Date());
  const initialPlan = member?.membership_plan ?? "Monthly";
  const initialJoinDate = member?.join_date ?? today;

  const [formData, setFormData] = useState({
    full_name: member?.full_name ?? "",

    phone: member?.phone ?? "",

    email: member?.email ?? "",
    emergency_contact:
      member?.emergency_contact ?? "",

    gender:
      member?.gender ?? "",

    timing:
      member?.timing ?? "Morning",

    payment_type: member?.payment_type ?? "UPI",

    membership_plan: initialPlan,

    monthly_fee:
      member?.monthly_fee?.toString() ?? "",

    join_date: initialJoinDate,

    next_due_date: member?.next_due_date ?? defaultDueDate(initialPlan, initialJoinDate),

    notes:
      member?.notes ?? "",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    setFormData((current) => ({
      ...current,
      [e.target.name]: e.target.value,
      ...( !member && e.target.name === "join_date"
        ? { next_due_date: defaultDueDate(current.membership_plan, e.target.value) }
        : {}),
    }));
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || null,
        emergency_contact: formData.emergency_contact || null,
        gender: formData.gender || null,
        timing: formData.timing,
        payment_type: formData.payment_type,
        membership_plan: formData.membership_plan,
        monthly_fee: Number(formData.monthly_fee),
        join_date: formData.join_date,
        next_due_date: formData.next_due_date,
        notes: formData.notes || null,
      };

      const result = member
        ? await supabase
            .from("members")
            .update(payload)
            .eq("id", member.id)
        : await supabase
            .from("members")
            .insert(payload);

      if (result.error) {
        console.error("MEMBER SAVE ERROR:", result.error);
        toast.error(result.error.message);
        return;
      }

      toast.success(member ? "Member updated" : "Member added");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error("MEMBER SAVE REQUEST FAILED:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save member"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <Section title="Personal Information">
        <div
          className="
            grid
            gap-4
            md:grid-cols-2
          "
        >
          <Field label="Full Name">
            <InputField
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </Field>

          <Field label="Phone">
            <InputField
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone number"
              required
            />
          </Field>

          <Field label="Email">
            <InputField
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
            />
          </Field>

          <Field label="Emergency Contact">
            <InputField
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
              placeholder="Emergency number"
            />
          </Field>

          <Field label="Gender">
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  gender: value ?? "",
                })
              }
            >
              <SelectTrigger className="inputStyle">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>

              <SelectContent>
                {genders.map((item) => (
                  <SelectItem
                    key={item}
                    value={item}
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Training Timing">
            <Select
              value={formData.timing}
              onValueChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  timing: value as (typeof timings)[number],
                }))
              }
            >
              <SelectTrigger className="inputStyle">
                <SelectValue placeholder="Select timing" />
              </SelectTrigger>
              <SelectContent>
                {timings.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Membership Details">
        <div
          className="
            grid
            gap-4
            md:grid-cols-2
          "
        >
          <Field label="Subscription Type">
            <Select
              value={formData.membership_plan || null}
              onValueChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  membership_plan: value ?? "",
                  ...(!member && value ? { next_due_date: defaultDueDate(value, current.join_date) } : {}),
                }))
              }
            >
              <SelectTrigger className="inputStyle">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {plans.map((item) => (
                  <SelectItem
                    key={item}
                    value={item}
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Monthly Fee">
            <InputField
              name="monthly_fee"
              type="number"
              value={formData.monthly_fee}
              onChange={handleChange}
              placeholder="1500"
              required
            />
          </Field>
          <Field label="Payment Type">
            <Select
              value={formData.payment_type}
              onValueChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  payment_type: value as (typeof paymentTypes)[number],
                }))
              }
            >
              <SelectTrigger className="inputStyle"><SelectValue placeholder="Select payment type" /></SelectTrigger>
              <SelectContent>
                {paymentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Membership Timeline">
        <div
          className="
            grid
            gap-4
            md:grid-cols-2
          "
        >
          <Field label="Join Date">
            <InputField
              name="join_date"
              type="date"
              value={formData.join_date}
              onChange={handleChange}
              required
            />
          </Field>

          <Field label="Next Due Date">
            <InputField
              name="next_due_date"
              type="date"
              value={formData.next_due_date}
              onChange={handleChange}
              required
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Notes">
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              className="
                min-h-[100px]
                rounded-xl
                border-slate-200
                bg-white
                resize-none
                focus:ring-4
                focus:ring-blue-500/10
              "
            />
          </Field>
        </div>
      </Section>

      <Button
        type="submit"
        disabled={loading}
        className="
          h-12
          w-full
          rounded-xl
          bg-blue-600
          text-white
          hover:bg-blue-700
        "
      >
        {loading
          ? "Saving..."
          : member
          ? "Update Member"
          : "Add Member"}
      </Button>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <h3
        className="
          mb-4
          text-base
          font-semibold
          text-slate-900
        "
      >
        {title}
      </h3>

      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label
        className="
          text-sm
          font-medium
          text-slate-700
        "
      >
        {label}
      </Label>

      {children}
    </div>
  );
}

function InputField(
  props: React.ComponentProps<typeof Input>
) {
  return (
    <Input
      {...props}
      className="
        h-11
        rounded-xl
        border-slate-200
        bg-white
        text-slate-900
        placeholder:text-slate-400
        focus:border-blue-500
        focus:ring-4
        focus:ring-blue-500/10
      "
    />
  );
}
