import { createId } from "@paralleldrive/cuid2";
import { type NextRequest, NextResponse } from "next/server";
import { ExecutionStatus } from "@/generated/prisma";
import prisma from "@/lib/db";

export const maxDuration = 15;

function getRunnerUrl() {
  if (process.env.WORKER_URL)
    return `${process.env.WORKER_URL}/api/run-workflow`;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return `${appUrl}/api/run-workflow`;
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId");

    if (!workflowId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required query parameter: workflowId",
        },
        { status: 400 },
      );
    }

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { id: true },
    });
    if (!workflow) {
      return NextResponse.json(
        { success: false, error: "Workflow not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const formData = {
      formId: body.formId,
      formTitle: body.formTitle,
      responseId: body.responseId,
      timestamp: body.timestamp,
      respondentEmail: body.respondentEmail,
      responses: body.responses,
      raw: body,
    };

    const executionId = createId();
    const execution = await prisma.execution.create({
      data: {
        workflowId,
        inngestEventId: executionId,
        status: ExecutionStatus.RUNNING,
      },
    });

    // Must be awaited — on Vercel, an un-awaited fetch can be dropped when the
    // function returns, so the response would lie and say the run started.
    await fetch(getRunnerUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
      },
      body: JSON.stringify({
        workflowId,
        executionId: execution.id,
        initialData: { googleForm: formData },
      }),
    }).catch(() => {});

    return NextResponse.json(
      { success: true, executionId: execution.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Google form webhook error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process Google Form submission" },
      { status: 500 },
    );
  }
}
