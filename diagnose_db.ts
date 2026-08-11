import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role to bypass RLS

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  const trainerId = "3aacfad2-0801-4876-91ee-4aa0e984b19b";
  const adminId = "da97192c-f5b6-4c41-8f90-ddb6cd728df7";

  console.log("--- Checking Trainer Profile ---");
  const { data: trainer, error: tErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", trainerId)
    .maybeSingle();
  
  if (tErr) console.error("Trainer Error:", tErr);
  else console.log("Trainer Data:", JSON.stringify(trainer, null, 2));

  console.log("\n--- Checking Admin Profile ---");
  const { data: admin, error: aErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", adminId)
    .maybeSingle();

  if (aErr) console.error("Admin Error:", aErr);
  else console.log("Admin Data:", JSON.stringify(admin, null, 2));

  console.log("\n--- Checking User Roles ---");
  const { data: roles, error: rErr } = await supabase
    .from("user_roles")
    .select("*");
  
  if (rErr) console.error("Roles Error:", rErr);
  else console.log("All Roles:", JSON.stringify(roles, null, 2));
}

diagnose();
