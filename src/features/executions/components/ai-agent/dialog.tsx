"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  RETRY_ON_FAIL_DEFAULTS,
  RetryOnFailFields,
} from "../shared/retry-on-fail-fields";

const FREE_MODELS = [
  { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B (Free)" },
  { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B (Free)" },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B (Free)",
  },
  { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (Free)" },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", label: "Qwen3 80B (Free)" },
];

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
  retryOnFail: z.boolean().optional(),
  maxRetries: z.number().optional(),
});

export type AiAgentFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: AiAgentFormValues) => void;
  defaultValues?: Partial<AiAgentFormValues>;
}

export const AiAgentDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<AiAgentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      variableName: "",
      systemPrompt: "",
      userPrompt: "",
      model: FREE_MODELS[0].id,
      ...RETRY_ON_FAIL_DEFAULTS,
      ...defaultValues,
    },
  });
  useEffect(() => {
    if (open)
      form.reset({
        variableName: "",
        systemPrompt: "",
        userPrompt: "",
        model: FREE_MODELS[0].id,
        ...RETRY_ON_FAIL_DEFAULTS,
        ...defaultValues,
      });
  }, [open]);
  const watchVar = form.watch("variableName") || "agent";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Agent</DialogTitle>
          <DialogDescription>
            Autonomous AI that completes tasks using reasoning
          </DialogDescription>
        </DialogHeader>
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
                    <Input placeholder="myAgent" {...field} />
                  </FormControl>
                  <FormDescription>
                    Access as {`{{${watchVar}.text}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREE_MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful AI agent..."
                      className="font-mono text-sm h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task / Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="{{previousStep.text}}"
                      className="font-mono text-sm h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Supports Handlebars variables
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <RetryOnFailFields />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
