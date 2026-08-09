export type PaymentType = "UPI" | "Cash" | "UPI + Cash" | "Half UPI + Half Cash";

export interface Member {
    id: string;
  
    full_name: string;
  
    phone: string;
  
    gender: string | null;

    timing: "Morning" | "Evening" | null;

    payment_type: PaymentType | null;
  
    join_date: string;

    email: string | null;

    emergency_contact: string | null;


    monthly_fee: number;

    membership_plan: string;
  
    next_due_date: string;
  
    status: "active" | "inactive";
  
    notes: string | null;
  
    created_at: string;
  
    updated_at: string;
  }
  