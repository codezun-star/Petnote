import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Appends a query parameter to an internal path that may already carry one. */
function withParam(path: string, name: string, value: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}${name}=${encodeURIComponent(value)}`;
}

/**
 * Exchanges the OAuth / email-confirmation code for a session cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // Set only by the email-change action, so the two failure modes below can say
  // something true about that flow instead of a generic "link expired".
  const flow = searchParams.get("flow");
  const nextParam = searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (!code) {
    // A secure email change confirms from both addresses. The first link comes
    // back here with a message and no code, because the change hasn't been
    // applied yet — that's progress, not a broken link.
    if (flow === "email-change" && searchParams.get("message")) {
      return NextResponse.redirect(`${origin}${withParam(next, "notice", "email-change-pending")}`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("That sign-in link is missing its code. Please try again.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // The code verifier is a cookie in the browser that started the flow, so
    // opening the final link somewhere else (a phone, most often) fails the
    // exchange even though the change itself went through server-side. Saying
    // "expired" there would send people looking for a problem that isn't one.
    if (flow === "email-change") {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(
          "We couldn't sign you in from that link. If you opened every confirmation link we sent, your email address has already changed — log in with the new one.",
        )}`,
      );
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("That sign-in link has expired. Please request a new one.")}`,
    );
  }

  return NextResponse.redirect(`${origin}${flow === "email-change" ? withParam(next, "notice", "email-change-done") : next}`);
}
