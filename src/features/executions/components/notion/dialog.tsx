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

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Must be a valid identifier"),
  apiKey: z.string().min(1, "Notion API key is required"),
  databaseId: z.string().min(1, "Database ID is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
});

export type NotionFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NotionFormValues) => void;
  defaultValues?: Partial<NotionFormValues>;
}

export const NotionDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<NotionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: "",
      apiKey: "",
      databaseId: "",
      title: "",
      content: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open)
      form.reset({
        variableName: "",
        apiKey: "",
        databaseId: "",
        title: "",
        content: "",
        ...defaultValues,
      });
  }, [open, defaultValues, form]);

  const watchVar = form.watch("variableName") || "myNotion";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notion Configuration</DialogTitle>
          <DialogDescription>
            Create a page in a Notion database.
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
                    <Input placeholder="myNotion" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference as {`{{${watchVar}.pageId}}`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Integration Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="secret_..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    From{" "}
                    <span className="font-mono">notion.so/my-integrations</span>{" "}
                    → New integration → Configuration tab → copy the
                    &quot;Internal Integration Secret&quot;.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="databaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="space-y-1.5">
                    <span className="block">
                      The 32-character ID from your Notion database URL. Must be
                      a database, not a regular page — to create one: open
                      Notion → New page → type{" "}
                      <span className="font-mono">/database</span> → select
                      &quot;Database - Full page&quot; → copy the ID from the
                      URL after the last dash.
                    </span>
                    <span className="block">
                      Then connect it: open your database → click the{" "}
                      <span className="font-mono">···</span> menu → Connections
                      → search for and add your integration. Without this step,
                      Notion will reject requests even with a valid token.
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Page Title</FormLabel>
                  <FormControl>
                    <Input placeholder="{{myAI.text}}" {...field} />
                  </FormControl>
                  <FormDescription>
                    Supports Handlebars variables
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Page content here..."
                      className="font-mono text-sm"
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
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
