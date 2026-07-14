"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, UnlinkIcon } from "lucide-react";
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

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Must be a valid identifier"),
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  range: z.string().min(1, "Range is required"),
  values: z.string().min(1, "Values are required"),
});

export type GoogleSheetsFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoogleSheetsFormValues) => void;
  defaultValues?: Partial<GoogleSheetsFormValues>;
}

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

export const GoogleSheetsDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<GoogleSheetsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: "",
      spreadsheetId: "",
      range: "Sheet1!A1",
      values: "",
      ...defaultValues,
    },
  });
  const { status, loading, refresh } = useGoogleStatus(open);

  useEffect(() => {
    if (open)
      form.reset({
        variableName: "",
        spreadsheetId: "",
        range: "Sheet1!A1",
        values: "",
        ...defaultValues,
      });
  }, [open, defaultValues, form]);

  const watchVar = form.watch("variableName") || "mySheets";

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Google Sheets Configuration</DialogTitle>
          <DialogDescription>Append data to a Google Sheet.</DialogDescription>
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
            className="space-y-6 mt-4"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="mySheets" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference as {`{{${watchVar}.updatedRows}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="spreadsheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spreadsheet ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>From the spreadsheet URL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Range</FormLabel>
                  <FormControl>
                    <Input placeholder="Sheet1!A1" {...field} />
                  </FormControl>
                  <FormDescription>
                    A1 notation range to append to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="values"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Values (JSON array)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={'[["{{myAI.text}}", "{{myData.date}}"]]'}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    2D JSON array of values. Supports Handlebars.
                  </FormDescription>
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
            {status?.connected && (
              <p className="text-xs text-muted-foreground text-right">
                If you get a permission error, disconnect and reconnect to grant
                Sheets access.
              </p>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
