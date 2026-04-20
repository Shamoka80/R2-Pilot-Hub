import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PARTICIPANT_GROUP_OPTIONS = [
  "Facility Group",
  "Consultant Group",
  "Certification Review Group",
  "Program Observer Group",
] as const;
const PARTICIPANT_SCENARIO_OPTIONS = [
  "First-Time Seeker",
  "Active Certified",
  "Lapsed / Not Renewed",
  "Failed / Revoked / Suspended / Remediation-Focused",
] as const;
const PARTICIPANT_WAVE_OPTIONS = ["Wave 1", "Wave 2", "Wave 3"] as const;

const PARTICIPANT_GROUP_SET = new Set(PARTICIPANT_GROUP_OPTIONS);
const PARTICIPANT_SCENARIO_SET = new Set(PARTICIPANT_SCENARIO_OPTIONS);
const PARTICIPANT_WAVE_SET = new Set(PARTICIPANT_WAVE_OPTIONS);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: adminProfile, error: adminProfileError } = await adminClient
      .from("profiles")
      .select("id, role, email")
      .eq("id", user.id)
      .single();

    if (adminProfileError || !adminProfile || adminProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();

    const application_id = body.application_id;
    const applicant_name = (body.applicant_name || "").trim();
    const applicant_email = (body.applicant_email || "").trim().toLowerCase();
    const group_name = (body.group_name || "").trim();
    const scenario_name = (body.scenario_name || "").trim();
    const wave_name = (body.wave_name || "").trim();

    if (!application_id || !applicant_email || !group_name || !scenario_name || !wave_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!PARTICIPANT_GROUP_SET.has(group_name as (typeof PARTICIPANT_GROUP_OPTIONS)[number])) {
      return new Response(
        JSON.stringify({ error: "Invalid group_name value" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!PARTICIPANT_SCENARIO_SET.has(scenario_name as (typeof PARTICIPANT_SCENARIO_OPTIONS)[number])) {
      return new Response(
        JSON.stringify({ error: "Invalid scenario_name value" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!PARTICIPANT_WAVE_SET.has(wave_name as (typeof PARTICIPANT_WAVE_OPTIONS)[number])) {
      return new Response(
        JSON.stringify({ error: "Invalid wave_name value" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let participantUserId: string | null = null;

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, email")
      .eq("email", applicant_email)
      .maybeSingle();

    if (existingProfile?.id) {
      participantUserId = existingProfile.id;
    } else {
      const temporaryPassword = `${crypto.randomUUID().slice(0, 12)}aA1!`;

      const { data: createdUser, error: createUserError } =
        await adminClient.auth.admin.createUser({
          email: applicant_email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: applicant_name || null,
          },
        });

      if (createUserError || !createdUser?.user?.id) {
        return new Response(
          JSON.stringify({ error: createUserError?.message || "Failed to create auth user" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      participantUserId = createdUser.user.id;
    }

    if (!participantUserId) {
      return new Response(
        JSON.stringify({ error: "Failed to resolve participant user id" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: profileUpsertError } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: participantUserId,
          email: applicant_email,
          full_name: applicant_name || null,
          role: "participant",
        },
        { onConflict: "id" }
      );

    if (profileUpsertError) {
      return new Response(
        JSON.stringify({ error: profileUpsertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: participantUpsertError } = await adminClient
      .from("participants")
      .upsert(
        {
          user_id: participantUserId,
          application_id,
          group_name,
          scenario_name,
          wave_name,
          onboard_status: "invited",
          is_active: true,
          approved_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (participantUpsertError) {
      return new Response(
        JSON.stringify({ error: participantUpsertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: adminActionError } = await adminClient
      .from("admin_actions")
      .insert([
        {
          admin_user_id: user.id,
          action_type: "create_participant",
          target_table: "participants",
          target_id: participantUserId,
          action_notes: `Created or updated participant from application ${application_id}`,
        },
      ]);

    if (adminActionError) {
      return new Response(
        JSON.stringify({ error: adminActionError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        participant_user_id: participantUserId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
