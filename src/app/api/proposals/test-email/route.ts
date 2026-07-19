import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendProposalEmail } from "@/lib/email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: "Test email requires Supabase configuration." },
        { status: 503 }
      );
    }

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
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const { error: sendError } = await sendProposalEmail({
      to: user.email,
      clientName: "Estimator (Test)",
      proposalNumber: "SCH-TEST-0000",
      projectName: "Email Branding Verification",
      portalUrl: `${siteUrl}/portal/test-preview`,
      total: 12345.67,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });

    if (sendError) {
      console.error("Test email Resend error:", sendError);
      return NextResponse.json(
        { error: "Email delivery failed", detail: (sendError as Error).message },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, sentTo: user.email });
  } catch (err) {
    console.error("Unexpected error in /api/proposals/test-email:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
