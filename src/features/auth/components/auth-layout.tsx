import Link from "next/link";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="auth-page"
      style={{
        background: "#000",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "30%",
          right: "30%",
          height: "40%",
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 100% 80% at 50% 100%, rgba(139,92,246,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Grid texture */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.018,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          marginBottom: "2.5rem",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            boxShadow: "0 0 30px rgba(59,130,246,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            width="20"
            height="20"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" />
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="2" y1="7" x2="22" y2="17" />
            <line x1="22" y1="7" x2="2" y2="17" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontSize: 24,
            color: "#fff",
            letterSpacing: "0.04em",
          }}
        >
          KRYPTONITE
        </span>
      </Link>

      {/* Card */}
      <div style={{ position: "relative", width: "100%", maxWidth: 420 }}>
        {children}
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: "2rem",
          fontSize: 12,
          color: "rgba(255,255,255,0.2)",
          position: "relative",
        }}
      >
        © 2026 Kryptonite by Runtime Error
      </p>
    </div>
  );
};
