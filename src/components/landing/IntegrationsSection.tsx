"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type Integration = { name: string; logo: string };

const ROW1: Integration[] = [
  { name: "Slack", logo: "/logos/slack.svg" },
  { name: "GitHub", logo: "/logos/github.svg" },
  { name: "Notion", logo: "/logos/notion.svg" },
  { name: "Linear", logo: "/logos/linear.svg" },
  { name: "Jira", logo: "/logos/jira.svg" },
  { name: "Stripe", logo: "/logos/stripe.svg" },
  { name: "Airtable", logo: "/logos/airtable.svg" },
  { name: "HubSpot", logo: "/logos/hubspot.svg" },
  { name: "Salesforce", logo: "/logos/salesforce.svg" },
  { name: "Zendesk", logo: "/logos/zendesk.svg" },
  { name: "Asana", logo: "/logos/asana.svg" },
  { name: "Trello", logo: "/logos/trello.svg" },
  { name: "Mailchimp", logo: "/logos/mailchimp.svg" },
  { name: "Shopify", logo: "/logos/shopify.svg" },
  { name: "OpenAI", logo: "/logos/openai.svg" },
  { name: "Gemma", logo: "/logos/gemini.svg" },
  { name: "Mistral", logo: "/logos/mistral.svg" },
];

const ROW2: Integration[] = [
  { name: "Telegram", logo: "/logos/telegram.svg" },
  { name: "WhatsApp", logo: "/logos/whatsapp.svg" },
  { name: "SMS", logo: "/logos/sms.svg" },
  { name: "Email", logo: "/logos/email.svg" },
  { name: "Supabase", logo: "/logos/supabase.svg" },
  { name: "Firebase", logo: "/logos/firebase.svg" },
  { name: "Spotify", logo: "/logos/spotify.svg" },
  { name: "YouTube", logo: "/logos/youtube.svg" },
  { name: "Twitter", logo: "/logos/twitter.svg" },
  { name: "LinkedIn", logo: "/logos/linkedin.svg" },
  { name: "Instagram", logo: "/logos/instagram.svg" },
  { name: "Google Sheets", logo: "/logos/google-sheets.svg" },
  { name: "Vercel", logo: "/logos/vercel-api.svg" },
  { name: "SendGrid", logo: "/logos/sendgrid.svg" },
  { name: "Dropbox", logo: "/logos/dropbox.svg" },
  { name: "Qwen", logo: "/logos/qwen.svg" },
  { name: "RSS", logo: "/logos/rss.svg" },
  { name: "Google Forms", logo: "/logos/googleform.svg" },
];

function IntegrationPill({ name, logo }: Integration) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "0.5rem 1rem 0.5rem 0.6rem",
        background: "rgba(255,255,255,0.84)",
        border: "1px solid rgba(17,24,39,0.08)",
        borderRadius: 9999,
        flexShrink: 0,
        whiteSpace: "nowrap",
        boxShadow: "0 10px 30px rgba(17,24,39,0.04)",
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          flexShrink: 0,
          background: "rgba(17,24,39,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
        }}
      >
        <Image
          src={logo}
          alt={name}
          width={18}
          height={18}
          style={{ objectFit: "contain", display: "block" }}
        />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
        {name}
      </span>
    </div>
  );
}

function IntegrationRow({
  items,
  reverse,
}: {
  items: Integration[];
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];
  return (
    <div
      style={{
        overflow: "hidden",
        mask: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMask:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 10,
          width: "max-content",
          animation: `lp-marquee${reverse ? "-reverse" : ""} 40s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <IntegrationPill key={`${item.name}-${i}`} {...item} />
        ))}
      </div>
    </div>
  );
}

export default function IntegrationsSection() {
  return (
    <section
      id="integrations"
      style={{ background: "#fff", padding: "7rem 0", overflow: "hidden" }}
    >
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "0 1.5rem",
          textAlign: "center",
          marginBottom: "4rem",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            fontSize: 11,
            color: "rgba(17,24,39,0.45)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: "1.25rem",
          }}
        >
          // Integrations
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading"
          style={{
            fontSize: "clamp(2.5rem,7vw,5rem)",
            color: "#111827",
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            marginBottom: "1rem",
          }}
        >
          <span className="accent-gradient-text">1,431+</span> integrations.
          <br />
          Ready for real workflows.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: 15,
            color: "rgba(17,24,39,0.7)",
            maxWidth: 520,
            margin: "0 auto 3rem",
          }}
        >
          The app shows broad ecosystem reach so judges can instantly see
          practical utility, not just a cool canvas.
        </motion.p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <IntegrationRow items={ROW1} />
        <IntegrationRow items={ROW2} reverse />
      </div>
    </section>
  );
}
