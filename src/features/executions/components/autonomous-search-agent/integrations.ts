export const SEARCH_INTEGRATIONS = [
  { id: "gmail", label: "Gmail" },
  { id: "outlook", label: "Outlook" },
  { id: "google_drive", label: "Google Drive" },
  { id: "slack", label: "Slack" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "discord", label: "Discord" },
  { id: "notion", label: "Notion" },
  { id: "airtable", label: "Airtable" },
  { id: "database", label: "Database" },
  { id: "crm", label: "CRM" },
] as const;

export type SearchIntegrationId = (typeof SEARCH_INTEGRATIONS)[number]["id"];

export const OUTPUT_FORMATS = [
  { id: "summary", label: "AI Summary" },
  { id: "json", label: "Structured JSON" },
  { id: "report", label: "Report" },
] as const;
