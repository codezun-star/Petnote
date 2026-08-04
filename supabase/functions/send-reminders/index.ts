// Petnote — daily vaccine & deworming reminder emails.
//
// Invoked once a day by pg_cron (see 20260804000500_reminders.sql). Pulls every
// item coming due in the next 7 days that hasn't been emailed yet, groups them
// per owner so one person gets one email covering all their pets, sends via
// Resend, and only marks records as sent for the emails that actually went out.
//
// Deploy with:  supabase functions deploy send-reminders --no-verify-jwt
// Secrets:      supabase secrets set RESEND_API_KEY=... REMINDER_FROM_EMAIL=... SITE_URL=...

import { createClient } from "jsr:@supabase/supabase-js@2";

type DueReminder = {
  record_id: string;
  record_kind: "vaccine" | "deworming";
  label: string;
  next_due_date: string;
  pet_id: string;
  pet_name: string;
  owner_id: string;
  owner_email: string;
  owner_name: string | null;
};

const DAYS_AHEAD = 7;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("REMINDER_FROM_EMAIL") ?? "Petnote <reminders@petnote.codezun.com>";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://petnote.codezun.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function describeTiming(isoDate: string): string {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dueUtc = new Date(`${isoDate}T00:00:00Z`).getTime();
  const days = Math.round((dueUtc - todayUtc) / 86_400_000);

  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function buildEmail(ownerName: string | null, items: DueReminder[]): { subject: string; html: string; text: string } {
  const overdue = items.filter((item) => item.next_due_date < new Date().toISOString().slice(0, 10));
  const greeting = ownerName ? `Hi ${ownerName},` : "Hi there,";

  const subject =
    overdue.length > 0
      ? `Overdue: ${items.length} health item${items.length === 1 ? "" : "s"} for your pet${items.length === 1 ? "" : "s"}`
      : `Coming up: ${items.length} health item${items.length === 1 ? "" : "s"} for your pet${items.length === 1 ? "" : "s"}`;

  const rows = items
    .map((item) => {
      const isOverdue = item.next_due_date < new Date().toISOString().slice(0, 10);
      const badgeColor = isOverdue ? "#c8402c" : "#f39a3d";
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #d3e3f0;">
            <div style="font-size:15px;font-weight:600;color:#0f2033;">
              ${escapeHtml(item.pet_name)} — ${escapeHtml(item.label)}
            </div>
            <div style="font-size:13px;color:#5b7185;margin-top:4px;">
              ${item.record_kind === "vaccine" ? "Vaccine" : "Deworming"} · ${escapeHtml(formatDate(item.next_due_date))}
            </div>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #d3e3f0;text-align:right;white-space:nowrap;">
            <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${badgeColor};color:#ffffff;font-size:12px;font-weight:600;">
              ${escapeHtml(describeTiming(item.next_due_date))}
            </span>
          </td>
        </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#ecf6fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;">
      <tr>
        <td style="background:#17375c;padding:20px 28px;">
          <div style="color:#ffffff;font-size:19px;font-weight:700;letter-spacing:-0.01em;">Petnote</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <p style="margin:0 0 6px;font-size:15px;color:#0f2033;">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 20px;font-size:15px;color:#5b7185;line-height:1.5;">
            Here's what's on your pet health calendar for the next ${DAYS_AHEAD} days.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          <a href="${SITE_URL}/dashboard"
             style="display:inline-block;margin-top:24px;padding:12px 22px;background:#17375c;color:#ffffff;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
            Open your dashboard
          </a>
          <p style="margin:24px 0 0;font-size:12px;color:#5b7185;line-height:1.5;">
            You're receiving this because reminders are enabled on your Petnote account.
            You can turn them off any time in
            <a href="${SITE_URL}/dashboard/settings" style="color:#17375c;">Settings</a>.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    greeting,
    "",
    `Here's what's on your pet health calendar for the next ${DAYS_AHEAD} days.`,
    "",
    ...items.map(
      (item) =>
        `- ${item.pet_name} — ${item.label} (${item.record_kind}) · ${formatDate(item.next_due_date)} · ${describeTiming(item.next_due_date)}`,
    ),
    "",
    `Open your dashboard: ${SITE_URL}/dashboard`,
  ].join("\n");

  return { subject, html, text };
}

Deno.serve(async () => {
  if (!RESEND_API_KEY) {
    return Response.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("get_due_reminders", { days_ahead: DAYS_AHEAD });

  if (error) {
    console.error("Failed to load due reminders", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const reminders = (data ?? []) as DueReminder[];
  if (reminders.length === 0) {
    return Response.json({ ownersNotified: 0, remindersSent: 0 });
  }

  // One email per owner, however many pets and items it covers.
  const byOwner = new Map<string, DueReminder[]>();
  for (const reminder of reminders) {
    const bucket = byOwner.get(reminder.owner_id);
    if (bucket) bucket.push(reminder);
    else byOwner.set(reminder.owner_id, [reminder]);
  }

  const sentVaccineIds: string[] = [];
  const sentDewormingIds: string[] = [];
  let ownersNotified = 0;

  for (const items of byOwner.values()) {
    items.sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
    const { subject, html, text } = buildEmail(items[0].owner_name, items);

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM_EMAIL, to: [items[0].owner_email], subject, html, text }),
      });

      if (!response.ok) {
        console.error(`Resend rejected the email for owner ${items[0].owner_id}`, await response.text());
        continue;
      }

      ownersNotified += 1;
      // Only stamp records whose email actually left the building, so a failed
      // send is retried on tomorrow's run instead of being silently dropped.
      for (const item of items) {
        if (item.record_kind === "vaccine") sentVaccineIds.push(item.record_id);
        else sentDewormingIds.push(item.record_id);
      }
    } catch (sendError) {
      console.error(`Failed to send reminder email for owner ${items[0].owner_id}`, sendError);
    }
  }

  if (sentVaccineIds.length > 0 || sentDewormingIds.length > 0) {
    const { error: markError } = await supabase.rpc("mark_reminders_sent", {
      vaccine_ids: sentVaccineIds,
      deworming_ids: sentDewormingIds,
    });
    if (markError) console.error("Failed to mark reminders as sent", markError);
  }

  return Response.json({
    ownersNotified,
    remindersSent: sentVaccineIds.length + sentDewormingIds.length,
  });
});
