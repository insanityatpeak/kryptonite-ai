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

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*/),
  text: z.string().min(1),
  categories: z.string().min(1),
  model: z.string().optional(),
});
export type TextClassifierFormValues = z.infer<typeof schema>;
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: TextClassifierFormValues) => void;
  defaultValues?: Partial<TextClassifierFormValues>;
}

export const TextClassifierDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<TextClassifierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      variableName: "",
      text: "",
      categories: "Positive, Negative, Neutral",
      model: "meta-llama/llama-3.3-70b-instruct:free",
      ...defaultValues,
    },
  });
  useEffect(() => {
    if (open)
      form.reset({
        variableName: "",
        text: "",
        categories: "Positive, Negative, Neutral",
        model: "meta-llama/llama-3.3-70b-instruct:free",
        ...defaultValues,
      });
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Text Classifier</DialogTitle>
          <DialogDescription>
            Classify text into predefined categories using AI
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
                    <Input placeholder="myClassification" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories (comma-separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Positive, Negative, Neutral"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The AI will pick exactly one
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text to Classify</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="{{prevStep.text}}"
                      className="font-mono text-sm h-24"
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
