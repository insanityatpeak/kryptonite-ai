"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, CopyIcon, WebhookIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*/),
});
export type WebhookTriggerFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: WebhookTriggerFormValues) => void;
  defaultValues?: Partial<WebhookTriggerFormValues>;
}

export const WebhookTriggerDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const params = useParams();
  const workflowId = params?.workflowId as string | undefined;
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = workflowId
    ? `${appUrl}/api/webhooks/trigger/${workflowId}`
    : null;

  const [copied, setCopied] = useState(false);
  const form = useForm<WebhookTriggerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { variableName: "webhookData", ...defaultValues },
  });

  useEffect(() => {
    if (open) form.reset({ variableName: "webhookData", ...defaultValues });
  }, [open]);

  const handleCopy = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WebhookIcon className="size-4" />
            Webhook Trigger
          </DialogTitle>
          <DialogDescription>
            Send a POST request to this URL to trigger the workflow
          </DialogDescription>
        </DialogHeader>

        {webhookUrl && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Your webhook URL
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 min-w-0">
              <code className="flex-1 min-w-0 text-xs font-mono text-foreground truncate">
                {webhookUrl}
              </code>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-emerald-500" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              POST any JSON body — access it via{" "}
              <code className="font-mono bg-muted px-1 rounded text-xs">
                {"{{webhookData.body}}"}
              </code>{" "}
              in downstream nodes
            </p>
          </div>
        )}

        <div className="rounded-lg bg-muted/40 border px-3 py-2.5 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Example curl
          </p>
          <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-all">
            {[
              `curl -X POST ${webhookUrl ?? "<url>"}`,
              `  -H "Content-Type: application/json"`,
              `  -d '{"message": "hello"}'`,
            ].join(" \\\n")}
          </pre>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSubmit(v);
              onOpenChange(false);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable name</FormLabel>
                  <FormControl>
                    <Input placeholder="webhookData" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Access payload as{" "}
                    <code className="font-mono bg-muted px-1 rounded">{`{{${field.value || "webhookData"}.body}}`}</code>
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
