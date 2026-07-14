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
  accessToken: z.string().min(1, "Access token is required"),
  personUrn: z.string().min(1, "Person URN is required"),
  variableName: z
    .string()
    .min(1, "Variable name is required")
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Must be a valid identifier"),
  text: z.string().min(1, "Post text is required"),
});

export type LinkedinFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LinkedinFormValues) => void;
  defaultValues?: Partial<LinkedinFormValues>;
}

export const LinkedinDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const form = useForm<LinkedinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accessToken: "",
      personUrn: "",
      variableName: "",
      text: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open)
      form.reset({
        accessToken: "",
        personUrn: "",
        variableName: "",
        text: "",
        ...defaultValues,
      });
  }, [open, defaultValues, form]);

  const watchVar = form.watch("variableName") || "myLinkedin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LinkedIn</DialogTitle>
          <DialogDescription>
            Enter the LinkedIn API details for this node, then configure the
            post.
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
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="off"
                      placeholder="AQV..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Token with permission to create posts.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personUrn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person URN</FormLabel>
                  <FormControl>
                    <Input placeholder="urn:li:person:..." {...field} />
                  </FormControl>
                  <FormDescription>Your LinkedIn author URN.</FormDescription>
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
                    <Input placeholder="myLinkedin" {...field} />
                  </FormControl>
                  <FormDescription>
                    Reference as {`{{${watchVar}.postId}}`}
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
                  <FormLabel>Post Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Excited to share... {{myAI.text}}"
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
