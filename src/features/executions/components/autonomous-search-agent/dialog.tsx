"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangleIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { OUTPUT_FORMATS, SEARCH_INTEGRATIONS } from "./integrations";

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/),
  prompt: z.string().min(1, "Prompt is required"),
  integrations: z.array(z.string()),
  integrationKeys: z.record(z.string(), z.string()),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  outputFormat: z.string(),
  allowAgentActions: z.boolean(),
});

export type AutonomousSearchAgentFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: AutonomousSearchAgentFormValues) => void;
  defaultValues?: Partial<AutonomousSearchAgentFormValues>;
}

const DEFAULTS: AutonomousSearchAgentFormValues = {
  variableName: "searchAgent",
  prompt: "",
  integrations: [],
  integrationKeys: {},
  dateFrom: "",
  dateTo: "",
  outputFormat: "summary",
  allowAgentActions: false,
};

export const AutonomousSearchAgentDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<AutonomousSearchAgentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ...DEFAULTS, ...defaultValues },
  });

  useEffect(() => {
    if (open) form.reset({ ...DEFAULTS, ...defaultValues });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = form.watch("integrations") ?? [];
  const watchVar = form.watch("variableName") || "searchAgent";

  const toggleIntegration = (id: string, checked: boolean) => {
    const current = form.getValues("integrations") ?? [];
    form.setValue(
      "integrations",
      checked ? [...current, id] : current.filter((i) => i !== id),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Autonomous Search Agent</DialogTitle>
          <DialogDescription>
            Describe what you need in plain language — the agent decides which
            connected apps to search and how to combine the results.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSubmit(v);
              onOpenChange(false);
            })}
            className="space-y-5 mt-2"
          >
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="searchAgent" {...field} />
                  </FormControl>
                  <FormDescription>
                    Access as {`{{${watchVar}.text}}`}, {`{{${watchVar}.json}}`}
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
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Go through my emails and find anything important."
                      className="text-sm h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    e.g. &quot;Find all invoices from the last 2 years&quot; or
                    &quot;Find customers that haven&apos;t received a reply in
                    30 days&quot;
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Connected Integrations</FormLabel>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Select which apps the agent is allowed to consider, and drop in
                the key for each — no separate credential setup needed.
              </p>
              <div className="space-y-2.5 rounded-lg border p-3">
                {SEARCH_INTEGRATIONS.map((integration) => {
                  const checked = selected.includes(integration.id);
                  return (
                    <div key={integration.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`int-${integration.id}`}
                          checked={checked}
                          onCheckedChange={(c) =>
                            toggleIntegration(integration.id, c === true)
                          }
                        />
                        <label
                          htmlFor={`int-${integration.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {integration.label}
                        </label>
                      </div>
                      {checked && (
                        <Input
                          type="password"
                          placeholder={`${integration.label} API key / token`}
                          className="ml-6 h-8 text-xs"
                          value={
                            form.watch(
                              `integrationKeys.${integration.id}` as const,
                            ) ?? ""
                          }
                          onChange={(e) =>
                            form.setValue("integrationKeys", {
                              ...form.getValues("integrationKeys"),
                              [integration.id]: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dateFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Date from (optional)
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Date to (optional)
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="outputFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Output Format</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OUTPUT_FORMATS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowAgentActions"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Allow Agent Actions</FormLabel>
                    <FormDescription>
                      Let the agent draft emails, create tasks, update CRM
                      records, and trigger downstream actions.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <AlertTriangleIcon className="size-4 shrink-0 mt-0.5" />
              <span>
                This agent reasons over your prompt and produces a structured
                plan and summary. It does not yet have live read access to
                Gmail/WhatsApp/Slack/etc. — keys you enter are passed to the run
                but no data is pulled from those accounts in this build.
              </span>
            </div>

            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
