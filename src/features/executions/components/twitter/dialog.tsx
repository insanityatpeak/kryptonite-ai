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
  apiKey: z.string().min(1, "API key is required"),
  apiKeySecret: z.string().min(1, "API key secret is required"),
  accessToken: z.string().min(1, "Access token is required"),
  accessTokenSecret: z.string().min(1, "Access token secret is required"),
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Must be a valid identifier"),
  text: z
    .string()
    .min(1, "Tweet text is required")
    .max(280, "Tweets cannot exceed 280 characters"),
});

export type TwitterFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TwitterFormValues) => void;
  defaultValues?: Partial<TwitterFormValues>;
}

export const TwitterDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<TwitterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
      apiKeySecret: "",
      accessToken: "",
      accessTokenSecret: "",
      variableName: "",
      text: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open)
      form.reset({
        apiKey: "",
        apiKeySecret: "",
        accessToken: "",
        accessTokenSecret: "",
        variableName: "",
        text: "",
        ...defaultValues,
      });
  }, [open, defaultValues, form]);

  const watchVar = form.watch("variableName") || "myTwitter";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Twitter / X</DialogTitle>
          <DialogDescription>
            Enter the X API credentials for this node, then configure the post.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => {
              onSubmit(v);
              onOpenChange(false);
            })}
            className="space-y-4 mt-4"
          >
            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              Create an app with read and write permissions in the X Developer
              Portal.
            </div>
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder="Consumer key"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKeySecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key Secret</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder="Consumer secret"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder="Access token"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessTokenSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token Secret</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder="Access token secret"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="variableName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input placeholder="myTwitter" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference as {`{{${watchVar}.tweetId}}`}
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
                  <FormLabel>Tweet Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hello world! {{myAI.text}}"
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Supports Handlebars variables. Max 280 chars.
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
