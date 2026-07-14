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

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*/),
  text: z.string().min(1),
  style: z.string().optional(),
  model: z.string().optional(),
});
export type SummarizerFormValues = z.infer<typeof schema>;
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: SummarizerFormValues) => void;
  defaultValues?: Partial<SummarizerFormValues>;
}

export const SummarizerDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<SummarizerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      variableName: "",
      text: "",
      style: "concise",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      ...defaultValues,
    },
  });
  useEffect(() => {
    if (open)
      form.reset({
        variableName: "",
        text: "",
        style: "concise",
        model: "meta-llama/llama-3.3-70b-instruct:free",
        ...defaultValues,
      });
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Summarization Chain</DialogTitle>
          <DialogDescription>Summarize text using AI</DialogDescription>
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
                    <Input placeholder="mySummary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary Style</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="concise">
                        Concise (1-2 sentences)
                      </SelectItem>
                      <SelectItem value="detailed">
                        Detailed (paragraph)
                      </SelectItem>
                      <SelectItem value="bullet-points">
                        Bullet Points
                      </SelectItem>
                      <SelectItem value="executive">
                        Executive Summary
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text to Summarize</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="{{prevStep.content}}"
                      className="font-mono text-sm h-28"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Supports {`{{variables}}`}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
