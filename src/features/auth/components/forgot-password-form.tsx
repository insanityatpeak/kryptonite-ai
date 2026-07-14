"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
  email: z.email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "0.75rem",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
  fontFamily: "'Inter', sans-serif",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: FormValues) => {
    await authClient.forgetPassword(
      {
        email: values.email,
        redirectTo: "/reset-password",
      },
      {
        onSuccess: () => setSent(true),
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    );
  };

  const isPending = form.formState.isSubmitting;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "1.5rem",
        padding: "2.5rem",
        boxShadow:
          "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      <h1
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: "italic",
          fontSize: "2rem",
          color: "#fff",
          letterSpacing: "-0.02em",
          textAlign: "center",
          marginBottom: 6,
        }}
      >
        Forgot password?
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        {sent
          ? "If an account exists for that email, we've sent a reset link."
          : "Enter your email and we'll send you a link to reset it."}
      </p>

      {!sent && (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <style>{`.auth-input:focus{border-color:rgba(59,130,246,0.6)!important;box-shadow:0 0 0 3px rgba(59,130,246,0.1)!important;}`}</style>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="auth-input"
              style={inputStyle}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              border: "none",
              borderRadius: "0.75rem",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              boxShadow: "0 0 30px rgba(59,130,246,0.3)",
              transition: "opacity 0.2s",
            }}
          >
            {isPending ? "Sending..." : "Send reset link →"}
          </button>
        </form>
      )}

      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          marginTop: "1.5rem",
        }}
      >
        <Link
          href="/login"
          style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
