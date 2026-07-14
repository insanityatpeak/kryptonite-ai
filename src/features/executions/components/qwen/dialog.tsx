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
import { Textarea } from "@/components/ui/textarea";
import {
  RETRY_ON_FAIL_DEFAULTS,
  RetryOnFailFields,
} from "../shared/retry-on-fail-fields";
import { MODEL } from "./constants";

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Must be a valid identifier"),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, "User prompt is required"),
  retryOnFail: z.boolean().optional(),
  maxRetries: z.number().optional(),
});

export type QwenFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: QwenFormValues) => void;
  defaultValues?: Partial<QwenFormValues>;
}

export const QwenDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<QwenFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: "",
      systemPrompt: "",
      userPrompt: "",
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
        ...RETRY_ON_FAIL_DEFAULTS,
        ...defaultValues,
      });
  }, [open, defaultValues, form]);

  const watchVar = form.watch("variableName") || "myQwen";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Qwen AI Configuration</DialogTitle>
          <DialogDescription>
            Powered by OpenRouter · <code className="text-xs">{MODEL}</code>
          </DialogDescription>
        </DialogHeader>
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
                    <Input placeholder="myQwen" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference as {`{{${watchVar}.text}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful assistant."
                      className="min-h-[80px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Sets the AI behavior. Supports Handlebars variables.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize: {{myData.text}}"
                      className="min-h-[120px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The prompt to send. Supports Handlebars variables.
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
