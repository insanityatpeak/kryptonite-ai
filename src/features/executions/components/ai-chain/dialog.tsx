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

const MODELS = [
  { id: "openai/gpt-oss-20b:free", label: "GPT-OSS 20B (Free)" },
  { id: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B (Free)" },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B (Free)",
  },
  { id: "qwen/qwen3-next-80b-a3b-instruct:free", label: "Qwen3 80B (Free)" },
];

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*/),
  prompt: z.string().min(1),
  model: z.string().optional(),
  retryOnFail: z.boolean().optional(),
  maxRetries: z.number().optional(),
});
export type AiChainFormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: AiChainFormValues) => void;
  defaultValues?: Partial<AiChainFormValues>;
}

export const AiChainDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<AiChainFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      variableName: "",
      prompt: "",
      model: MODELS[0].id,
      ...RETRY_ON_FAIL_DEFAULTS,
      ...defaultValues,
    },
  });
  useEffect(() => {
    if (open)
      form.reset({
        variableName: "",
        prompt: "",
        model: MODELS[0].id,
        ...RETRY_ON_FAIL_DEFAULTS,
        ...defaultValues,
      });
  }, [open]);
  const watchVar = form.watch("variableName") || "chain";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Basic LLM Chain</DialogTitle>
          <DialogDescription>
            Simple prompt → LLM → text output
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
                    <Input placeholder="myChain" {...field} />
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
                      {MODELS.map((m) => (
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
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize: {{data.text}}"
                      className="font-mono text-sm h-28"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Supports {`{{variables}}`}</FormDescription>
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
