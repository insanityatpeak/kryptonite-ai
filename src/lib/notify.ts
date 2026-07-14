/**
 * Sends workflow notification emails via Resend.
 */

const RESEND_API = "https://api.resend.com/emails";

export async function sendWorkflowEmail({
  to,
  workflowName,
  executionId,
  status,
  error,
  appUrl,
}: {
  to: string;
  workflowName: string;
  executionId: string;
  status: "started" | "success" | "failed";
  error?: string;
  appUrl?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[notify] RESEND_API_KEY not set, skipping email");
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "noreply@example.com";
  const base =
    appUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${base}/executions/${executionId}`;

  const subjects: Record<typeof status, string> = {
    started: `Workflow "${workflowName}" is running`,
    success: `Workflow "${workflowName}" completed successfully`,
    failed: `Workflow "${workflowName}" failed`,
  };

  const bodies: Record<typeof status, string> = {
    started: `Hi,\n\nYour Kryptonite workflow "${workflowName}" has started running.\n\nYou can safely close the tab - we'll email you as soon as it finishes.\n\nWatch it live:\n${link}\n\n- Kryptonite`,
    success: `Hi,\n\nGreat news! Your Kryptonite workflow "${workflowName}" completed successfully.\n\nView the full results here:\n${link}\n\n- Kryptonite`,
    failed: `Hi,\n\nYour Kryptonite workflow "${workflowName}" encountered an error and stopped.\n\n${error ? `Error: ${error}\n\n` : ""}View the execution details:\n${link}\n\n- Kryptonite`,
  };

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: subjects[status],
        text: bodies[status],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[notify] Resend API error ${res.status}: ${body}`);
    } else if (process.env.NODE_ENV !== "production") {
      console.log(`[notify] Sent ${status} email to ${to}`);
    }
  } catch (e) {
    console.error(
      "[notify] Failed to send workflow email:",
      e instanceof Error ? e.message : e,
    );
  }
}

/**
 * Sends a password reset email via Resend, used by Better Auth's
 * emailAndPassword.sendResetPassword callback.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[notify] RESEND_API_KEY not set, skipping password reset email",
    );
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "noreply@kryptonite.ai";

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Reset your Kryptonite password",
        text: `Hi,\n\nWe received a request to reset your Kryptonite password. Click the link below to choose a new one. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\n- Kryptonite`,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[notify] Resend API error ${res.status}: ${body}`);
    } else if (process.env.NODE_ENV !== "production") {
      console.log(`[notify] Sent password reset email to ${to}`);
    }
  } catch (e) {
    console.error(
      "[notify] Failed to send password reset email:",
      e instanceof Error ? e.message : e,
    );
  }
}
