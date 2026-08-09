"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



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
const paymentTypes = ["UPI", "Cash", "Half UPI + Half Cash"] as const;



export default function RegistrationForm() {


  const [loading, setLoading] = useState(false);



  const [formData, setFormData] = useState({

    full_name: "",
    phone: "",
    email: "",
    emergency_contact: "",
    gender: "",
    membership_plan: "Monthly",
    monthly_fee: "",
    payment_type: "UPI" as (typeof paymentTypes)[number],
    join_date: "",
    next_due_date: "",
    notes: "",

  });





  function handleChange(
    e:
      React.ChangeEvent<
        HTMLInputElement |
        HTMLTextAreaElement
      >
  ) {

    setFormData({

      ...formData,

      [e.target.name]:
        e.target.value,

    });

  }






  async function handleSubmit(
    e: React.FormEvent
  ) {

    e.preventDefault();

    setLoading(true);


    try {


      const response =
        await fetch(
          "/api/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(formData),

          }
        );



      const data =
        await response.json();




      if (!response.ok) {

        toast.error(
          data.error ||
          "Registration failed"
        );

        return;

      }



      toast.success(
        "Registration successful"
      );



      setFormData({

        full_name: "",
        phone: "",
        email: "",
        emergency_contact: "",
        gender: "",
        membership_plan: "Monthly",
        monthly_fee: "",
        payment_type: "UPI",
        join_date: "",
        next_due_date: "",
        notes: "",

      });


    }
    catch {

      toast.error(
        "Something went wrong"
      );

    }
    finally {

      setLoading(false);

    }

  }






  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >




      <div className="grid gap-5 md:grid-cols-2">


        <Field label="Full Name">

          <InputBox
            name="full_name"
            placeholder="Enter your name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />

        </Field>





        <Field label="Phone Number">

          <InputBox
            name="phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

        </Field>





        <Field label="Email Address">

          <InputBox
            name="email"
            type="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
          />

        </Field>





        <Field label="Emergency Contact">

          <InputBox
            name="emergency_contact"
            placeholder="Emergency number"
            value={formData.emergency_contact}
            onChange={handleChange}
          />

        </Field>


      </div>






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

          <SelectTrigger
            className="
              h-14
              w-full
              rounded-xl
              border-slate-200
              bg-white
              px-4
              text-base
              text-slate-900
              shadow-sm
              focus:ring-4
              focus:ring-blue-500/10
            "
          >

            <SelectValue
              placeholder="Select gender"
            />

          </SelectTrigger>



          <SelectContent>

            {
              genders.map(item => (

                <SelectItem
                  key={item}
                  value={item}
                >
                  {item}
                </SelectItem>

              ))
            }

          </SelectContent>


        </Select>


      </Field>








      <Field label="Membership Plan">


        <Select

          value={formData.membership_plan}

          onValueChange={(value) =>

            setFormData({
              ...formData,
              membership_plan:
                value ?? "",
            })

          }

        >

          <SelectTrigger
            className="
              h-14
              w-full
              rounded-xl
              border-slate-200
              bg-white
              px-4
              text-base
              text-slate-900
              shadow-sm
              focus:ring-4
              focus:ring-blue-500/10
            "
          >

            <SelectValue />

          </SelectTrigger>



          <SelectContent>

            {
              plans.map(item => (

                <SelectItem
                  key={item}
                  value={item}
                >
                  {item}
                </SelectItem>

              ))
            }

          </SelectContent>


        </Select>


      </Field>








      <Field label="Monthly Fee">


        <InputBox

          name="monthly_fee"

          type="number"

          placeholder="1500"

          value={formData.monthly_fee}

          onChange={handleChange}

          required

        />


      </Field>







      <Field label="Payment Type">
        <Select
          value={formData.payment_type}
          onValueChange={(value) => setFormData({ ...formData, payment_type: value as (typeof paymentTypes)[number] })}
        >
          <SelectTrigger className="h-14 w-full rounded-xl border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm focus:ring-4 focus:ring-blue-500/10"><SelectValue placeholder="Select payment type" /></SelectTrigger>
          <SelectContent>{paymentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
      </Field>

      <div className="grid gap-5 md:grid-cols-2">


        <Field label="Joining Date">

          <InputBox

            name="join_date"

            type="date"

            value={formData.join_date}

            onChange={handleChange}

            required

          />

        </Field>





        <Field label="Next Due Date">

          <InputBox

            name="next_due_date"

            type="date"

            value={formData.next_due_date}

            onChange={handleChange}

            required

          />

        </Field>


      </div>








      <Field label="Additional Notes">


        <Textarea

          name="notes"

          value={formData.notes}

          onChange={handleChange}

          placeholder="Any additional information"

          className="
            min-h-[100px]
            rounded-xl
            border-slate-200
            bg-white
            text-slate-900
            placeholder:text-slate-400
            focus:ring-4
            focus:ring-blue-500/10
          "

        />


      </Field>








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

        {
          loading
            ?
            "Submitting..."
            :
            "Register"
        }

      </Button>


    </form>

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
          font-semibold
          text-slate-700
        "
      >
        {label}
      </Label>


      {children}


    </div>

  );

}







function InputBox(
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
        shadow-sm
        transition
        focus:border-blue-500
        focus:ring-4
        focus:ring-blue-500/10
      "

    />

  );

}
