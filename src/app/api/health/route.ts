import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function checkWhatsApp() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId)
    return { status: "missing", detail: "Token or Phone ID not set" };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await res.json()) as {
      id?: string;
      error?: { message: string };
    };
    if (data.id) return { status: "ok", detail: `Phone ID ${phoneId} valid` };
    return { status: "error", detail: data.error?.message ?? "Unknown error" };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

async function checkInstagram() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId)
    return { status: "missing", detail: "Token or User ID not set" };
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${userId}?fields=id,name&access_token=${token}`,
    );
    const data = (await res.json()) as {
      id?: string;
      name?: string;
      error?: { message: string };
    };
    if (data.id)
      return { status: "ok", detail: `Account: ${data.name ?? data.id}` };
    return { status: "error", detail: data.error?.message ?? "Unknown error" };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

async function checkTwitter() {
  const key = process.env.TWITTER_API_KEY;
  const keySecret = process.env.TWITTER_API_KEY_SECRET;
  const token = process.env.TWITTER_ACCESS_TOKEN;
  const tokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  if (!key || !keySecret || !token || !tokenSecret)
    return { status: "missing", detail: "Missing Twitter credentials" };
  return {
    status: "ok",
    detail: "Credentials present (OAuth1 — tested at send time)",
  };
}

async function checkTwilio() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !auth || !from)
    return { status: "missing", detail: "Missing Twilio credentials" };
  try {
    const creds = Buffer.from(`${sid}:${auth}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`,
      {
        headers: { Authorization: `Basic ${creds}` },
      },
    );
    const data = (await res.json()) as {
      status?: string;
      friendly_name?: string;
      error?: unknown;
    };
    if (data.status === "active")
      return { status: "ok", detail: `Account: ${data.friendly_name}` };
    return {
      status: "error",
      detail: JSON.stringify(data.error ?? data.status),
    };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

async function checkResend() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key) return { status: "missing", detail: "RESEND_API_KEY not set" };
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = (await res.json()) as {
      data?: Array<{ name: string; status: string }>;
    };
    const domains = data.data ?? [];
    const verified = domains
      .filter((d) => d.status === "verified")
      .map((d) => d.name);
    return {
      status: verified.length > 0 ? "ok" : "warning",
      detail:
        verified.length > 0
          ? `Verified domains: ${verified.join(", ")}`
          : `No verified domains — using ${from ?? "onboarding@resend.dev"} (limited recipients)`,
    };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

export async function GET() {
  const [whatsapp, instagram, twitter, twilio, email] = await Promise.all([
    checkWhatsApp(),
    checkInstagram(),
    checkTwitter(),
    checkTwilio(),
    checkResend(),
  ]);

  return NextResponse.json({
    whatsapp,
    instagram,
    twitter,
    sms: twilio,
    email,
    telegram: process.env.TELEGRAM_BOT_TOKEN
      ? { status: "ok", detail: "Token present" }
      : { status: "missing", detail: "TELEGRAM_BOT_TOKEN not set" },
    linkedin: process.env.LINKEDIN_ACCESS_TOKEN
      ? { status: "ok", detail: "Token present" }
      : { status: "missing", detail: "LINKEDIN_ACCESS_TOKEN not set" },
    slack: process.env.SLACK_WEBHOOK_URL
      ? { status: "ok", detail: "Webhook set" }
      : { status: "missing", detail: "SLACK_WEBHOOK_URL not set" },
    discord: process.env.DISCORD_WEBHOOK_URL
      ? { status: "ok", detail: "Webhook set" }
      : { status: "missing", detail: "DISCORD_WEBHOOK_URL not set" },
  });
}
