"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type Resolver, useForm } from "react-hook-form";
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

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*/),
  text: z.string().min(1),
  chunkSize: z.number().optional(),
  overlap: z.number().optional(),
  splitBy: z.string().optional(),
});
export type TextSplitterFormValues = z.infer<typeof schema>;
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: TextSplitterFormValues) => void;
  defaultValues?: Partial<TextSplitterFormValues>;
}

const defaults = (
  dv: Partial<TextSplitterFormValues> = {},
): TextSplitterFormValues => ({
  variableName: dv.variableName ?? "",
  text: dv.text ?? "",
  chunkSize: dv.chunkSize ?? 1000,
  overlap: dv.overlap ?? 200,
  splitBy: dv.splitBy ?? "characters",
});

export const TextSplitterDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<TextSplitterFormValues>({
    resolver: zodResolver(schema) as Resolver<TextSplitterFormValues>,
    defaultValues: defaults(defaultValues),
  });
  useEffect(() => {
    if (open) form.reset(defaults(defaultValues));
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Text Splitter</DialogTitle>
          <DialogDescription>
            Split long text into chunks for AI processing
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
                    <Input placeholder="chunks" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="splitBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Split Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="characters">By Characters</SelectItem>
                      <SelectItem value="paragraphs">By Paragraphs</SelectItem>
                      <SelectItem value="sentences">By Sentences</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="chunkSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chunk Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="overlap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overlap</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Text Input</FormLabel>
                  <FormControl>
                    <Input placeholder="{{myDoc.content}}" {...field} />
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
