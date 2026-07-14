"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, MailIcon, UnlinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/),
  prompt: z.string().min(1, "Prompt is required"),
  maxResults: z.number().min(1).max(20),
});

export type GmailSearchFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: GmailSearchFormValues) => void;
  defaultValues?: Partial<GmailSearchFormValues>;
}

const DEFAULTS: GmailSearchFormValues = {
  variableName: "gmailSearch",
  prompt: "",
  maxResults: 5,
};

type GoogleStatus = { connected: boolean; email: string | null } | null;

function useGoogleStatus(open: boolean) {
  const [status, setStatus] = useState<GoogleStatus>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/google/status");
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void refresh();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, loading, refresh };
}

export const GmailSearchDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<GmailSearchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...DEFAULTS, ...defaultValues },
  });
  const { status, loading, refresh } = useGoogleStatus(open);

  useEffect(() => {
    if (open) form.reset({ ...DEFAULTS, ...defaultValues });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchVar = form.watch("variableName") || "gmailSearch";

  const handleConnect = () => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/api/integrations/google/connect?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleDisconnect = async () => {
    await fetch("/api/integrations/google/disconnect", { method: "POST" });
    void refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MailIcon className="size-4" /> Gmail Search
          </DialogTitle>
          <DialogDescription>
            Connect your real Gmail account, then describe what you&apos;re
            looking for in plain language.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-3 flex items-center justify-between gap-3">
          {loading ? (
            <span className="text-sm text-muted-foreground">
              Checking connection…
            </span>
          ) : status?.connected ? (
            <>
              <span className="flex items-center gap-2 text-sm">
                <CheckCircle2Icon className="size-4 text-emerald-500" />
                Connected as <span className="font-medium">{status.email}</span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleDisconnect}
              >
                <UnlinkIcon className="size-3.5" /> Disconnect
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">
                No Google account connected yet.
              </span>
              <Button type="button" size="sm" onClick={handleConnect}>
                Connect Google Account
              </Button>
            </>
          )}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSubmit(v);
              onOpenChange(false);
            })}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="gmailSearch" {...field} />
                  </FormControl>
                  <FormDescription>
                    Access as {`{{${watchVar}.text}}`},{" "}
                    {`{{${watchVar}.emails}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you want to find?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Find the last email from Adani"
                      className="text-sm h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is translated into a real Gmail search and run against
                    your inbox.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxResults"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max results</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={!status?.connected}>
                Save
              </Button>
            </DialogFooter>
            {!status?.connected && (
              <p className="text-xs text-amber-600 text-right">
                Connect your Google account before saving.
              </p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
