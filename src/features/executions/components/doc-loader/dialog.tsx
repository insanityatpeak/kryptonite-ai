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

const schema = z.object({
  variableName: z
    .string()
    .min(1)
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*/),
  url: z.string().min(1),
});
export type DocLoaderFormValues = z.infer<typeof schema>;
interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: DocLoaderFormValues) => void;
  defaultValues?: Partial<DocLoaderFormValues>;
}

export const DocLoaderDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<DocLoaderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { variableName: "", url: "", ...defaultValues },
  });
  useEffect(() => {
    if (open) form.reset({ variableName: "", url: "", ...defaultValues });
  }, [open]);
  const watchVar = form.watch("variableName") || "doc";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Document Loader</DialogTitle>
          <DialogDescription>
            Load content from a URL or web page
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
                    <Input placeholder="myDoc" {...field} />
                  </FormControl>
                  <FormDescription>
                    Access as {`{{${watchVar}.content}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL to Load</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/document"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Supports {`{{variables}}`} for dynamic URLs
                  </FormDescription>
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
