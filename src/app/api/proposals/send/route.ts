import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendProposalEmail } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId } = body as { proposalId?: string };

    console.log("Sending proposal email for proposalId:", proposalId);

    if (!proposalId) {
      return NextResponse.json(
        { error: "proposalId is required" },
        { status: 400 }
      );
    }

    // Demo mode: no server-accessible data, email sending requires Supabase.
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          error:
            "Email sending requires Supabase. Running in demo mode — configure NEXT_PUBLIC_SUPABASE_URL and related env vars to enable real email delivery.",
        },
        { status: 503 }
      );
    }

    // Require a valid session via Authorization header and build a single
    // authenticated client reused for all queries (so RLS policies are satisfied).
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/, "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load proposal
    const { data: proposal, error: proposalErr } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();
    if (proposalErr || !proposal) {
      console.error("Proposal lookup error:", proposalErr);
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Load current proposal version
    const { data: version, error: versionErr } = await supabase
      .from("proposal_versions")
      .select("*")
      .eq("id", proposal.current_version_id)
      .single();
    if (versionErr || !version) {
      console.error("Version lookup error:", versionErr);
      return NextResponse.json(
        { error: "Current proposal version not found" },
        { status: 404 }
      );
    }

    // Load project
    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", proposal.project_id)
      .single();
    if (projectErr || !project) {
      console.error("Project lookup error:", projectErr);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Load client
    const { data: clientRecord, error: clientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", project.client_id)
      .single();
    if (clientErr || !clientRecord) {
      console.error("Client lookup error:", clientErr);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!clientRecord.email) {
      return NextResponse.json(
        { error: "Client has no email address on file" },
        { status: 422 }
      );
    }

    // Build portal URL — internal_notes are never included here
    const portalBase =
      process.env.NEXT_PUBLIC_PORTAL_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";
    const portalUrl = `${portalBase}/portal/${proposal.share_token}`;

    // Send email via Resend (server-side only — RESEND_API_KEY never reaches browser)
    const { error: sendError } = await sendProposalEmail({
      to: clientRecord.email,
      clientName: clientRecord.name,
      proposalNumber: proposal.proposal_number,
      projectName: project.name,
      portalUrl,
      total: version.total,
      expirationDate: proposal.expiration_date ?? undefined,
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return NextResponse.json(
        { error: "Email delivery failed", detail: (sendError as Error).message },
        { status: 502 }
      );
    }

    // Update proposal status to Sent
    await supabase
      .from("proposals")
      .update({ status: "Sent" })
      .eq("id", proposalId);

    // Record audit log
    await supabase.from("audit_logs").insert([
      {
        proposal_id: proposalId,
        action: "EMAIL_SENT",
        details: `Proposal email sent to ${clientRecord.email} for ${proposal.proposal_number} (Version ${version.version_number}).`,
      },
    ]);

    return NextResponse.json({
      success: true,
      sentTo: clientRecord.email,
      proposalNumber: proposal.proposal_number,
    });
  } catch (err) {
    console.error("Unexpected error in /api/proposals/send:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
