"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const RETRY_ON_FAIL_DEFAULTS = { retryOnFail: false, maxRetries: 3 };

// Renders inside any node dialog's <Form> — relies on the surrounding zod
// schema including optional `retryOnFail`/`maxRetries` fields.
export function RetryOnFailFields() {
  const form = useFormContext();
  const retryOnFail = form.watch("retryOnFail");

  return (
    <>
      <FormField
        control={form.control}
        name="retryOnFail"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Retry on fail</FormLabel>
              <FormDescription>
                Automatically retry this node if it errors — useful for flaky
                APIs or rate limits.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
      {retryOnFail && (
        <FormField
          control={form.control}
          name="maxRetries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max retries</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={field.value ?? 3}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </>
  );
}
