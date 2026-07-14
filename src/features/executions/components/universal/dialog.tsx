"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
  APP_CATALOG,
  APP_CATEGORIES,
  type AppPreset,
  getApp,
} from "@/lib/app-catalog";

const formSchema = z
  .object({
    variableName: z
      .string()
      .min(1)
      .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, "Must be a valid identifier"),
    appId: z.string().min(1, "App is required"),
    operationId: z.string().min(1, "Operation is required"),
    apiKey: z.string().optional(),
    bearerToken: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .passthrough();

export type UniversalFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UniversalFormValues) => void;
  defaultValues?: Partial<UniversalFormValues>;
}

export const UniversalDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedApp, setSelectedApp] = useState<AppPreset | null>(null);

  const form = useForm<UniversalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: "",
      appId: "",
      operationId: "",
      apiKey: "",
      bearerToken: "",
      username: "",
      password: "",
      ...defaultValues,
    },
  });

  const watchApp = form.watch("appId");
  const watchOp = form.watch("operationId");

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: "",
        appId: "",
        operationId: "",
        apiKey: "",
        bearerToken: "",
        username: "",
        password: "",
        ...defaultValues,
      });
      if (defaultValues.appId)
        setSelectedApp(getApp(defaultValues.appId) || null);
    }
  }, [open]);

  useEffect(() => {
    if (watchApp) {
      const app = getApp(watchApp);
      setSelectedApp(app || null);
      if (!defaultValues.operationId) form.setValue("operationId", "");
    }
  }, [watchApp]);

  const filteredApps = APP_CATALOG.filter((a) => {
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const currentOperation = selectedApp?.operations.find(
    (o) => o.id === watchOp,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Universal App Integration</DialogTitle>
          <DialogDescription>
            Connect to any of 70+ apps with 400+ operations
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
                    <Input placeholder="myApp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Select App</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Search apps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {APP_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-md h-48 overflow-y-auto">
                {filteredApps.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No apps found
                  </div>
                ) : (
                  filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${watchApp === app.id ? "bg-primary/10 border-l-2 border-primary" : ""}`}
                      onClick={() => form.setValue("appId", app.id)}
                    >
                      <span className="text-lg">{app.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{app.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {app.category} · {app.operations.length} operations
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {selectedApp && (
              <FormField
                control={form.control}
                name="operationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operation</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedApp.operations.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            <span className="font-medium">{op.name}</span>
                            <span className="text-muted-foreground ml-2">
                              — {op.description}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedApp && (
              <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Authentication
                </div>
                {(selectedApp.authType === "bearer" ||
                  selectedApp.authType === "apiKey") && (
                  <FormField
                    control={form.control}
                    name={
                      selectedApp.authType === "bearer"
                        ? "bearerToken"
                        : "apiKey"
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedApp.authType === "bearer"
                            ? "Bearer Token"
                            : `API Key${selectedApp.authHeader ? ` (${selectedApp.authHeader})` : ""}`}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your key..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {selectedApp.authType === "basic" && (
                  <>
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username / Email</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password / API Key</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            )}

            {currentOperation && currentOperation.fields.length > 0 && (
              <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Operation Fields
                </div>
                {currentOperation.fields.map((field) => (
                  <FormField
                    key={field.key}
                    control={form.control}
                    name={field.key as keyof UniversalFormValues}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel>
                          {field.label}
                          {field.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          {field.type === "textarea" ? (
                            <Textarea
                              placeholder={
                                field.placeholder ||
                                `Enter ${field.label.toLowerCase()}...`
                              }
                              className="font-mono text-sm"
                              {...formField}
                              value={String(formField.value ?? "")}
                            />
                          ) : (
                            <Input
                              type={
                                field.type === "password"
                                  ? "password"
                                  : field.type === "number"
                                    ? "number"
                                    : "text"
                              }
                              placeholder={
                                field.placeholder ||
                                `Enter ${field.label.toLowerCase()}...`
                              }
                              {...formField}
                              value={String(formField.value ?? "")}
                            />
                          )}
                        </FormControl>
                        <FormDescription className="text-xs">
                          Supports {`{{variables}}`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={!watchApp || !watchOp}>
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
