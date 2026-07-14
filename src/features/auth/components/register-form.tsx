"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

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

export function RegisterForm() {
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    await authClient.signUp.email(
      {
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: "/workflows",
      },
      {
        onSuccess: () => router.push("/workflows"),
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
        Create account
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        Start building AI agent workflows free
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}.auth-input:focus{border-color:rgba(59,130,246,0.6)!important;box-shadow:0 0 0 3px rgba(59,130,246,0.1)!important;}`}</style>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              placeholder="Your name"
              className="auth-input"
              style={inputStyle}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div>
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
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              className="auth-input"
              style={inputStyle}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="auth-input"
              style={inputStyle}
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p style={{ fontSize: 12, color: "#f87171", marginTop: 5 }}>
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
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
            transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 50px rgba(59,130,246,0.5)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 30px rgba(59,130,246,0.3)";
          }}
        >
          {isPending ? "Creating account..." : "Create account →"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          marginTop: "1.5rem",
        }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          style={{ color: "#93c5fd", textDecoration: "none", fontWeight: 600 }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
