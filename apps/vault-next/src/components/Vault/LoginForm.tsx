import React, { memo } from "react";
import { Button, Input } from "@pwmnger/ui";
import { Mail, Lock, ShieldCheck, ArrowRight, Key, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  onLogin: (
    email: string,
    password: string,
    twoFactorToken?: string,
  ) => Promise<void>;
  onGoToRegister: () => void;
  error?: string;
  loading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onGoToRegister,
  error,
  loading,
}) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [twoFactorToken, setTwoFactorToken] = React.useState("");
  const [show2FA, setShow2FA] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = async () => {
    try {
      await onLogin(email, password, show2FA ? twoFactorToken : undefined);
    } catch (err: any) {
      if (err.requires2FA) {
        setShow2FA(true);
      }
    }
  };

  return (
    <div className="card-premium animate-fade-in" style={{ padding: "40px", borderRadius: "var(--radius-xl)" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: 700, letterSpacing: "-0.025em" }}>Welcome Back</h2>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-dim)" }}>Enter your credentials to unlock your vault.</p>
      </div>

      {!show2FA ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ position: "relative" }}>
            <Mail size={16} style={{ position: "absolute", left: 14, top: 40, color: "var(--text-dim)" }} />
            <Input
              type="email"
              placeholder="Email address"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                background: "var(--slate-900)", 
                border: "1px solid var(--border-subtle)", 
                color: "#fff", 
                paddingLeft: "40px",
                height: "44px"
              }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Lock
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: 40,
                color: "var(--text-dim)",
              }}
            />

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Master password"
              label="Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                background: "var(--slate-900)",
                border: "1px solid var(--border-subtle)",
                color: "#fff",
                paddingLeft: "40px",
                paddingRight: "40px",
                height: "44px",
              }}
            />

            <div
              onClick={() => setShowPassword((prev) => !prev)}
              style={{
                position: "absolute",
                right: 14,
                top: 40,
                cursor: "pointer",
                color: "var(--text-dim)",
                display: "flex",
                alignItems: "center",
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", marginBottom: 24 }} className="animate-fade-in">
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent-green-glow)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "1px solid var(--accent-green)" }}>
            <ShieldCheck size={24} style={{ color: "var(--accent-green)" }} />
          </div>
          <p style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>Identity Verification</p>
          <p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: 24 }}>Enter your 2FA code or use your security key.</p>

          <Input
            placeholder="000 000"
            label="2FA Code"
            value={twoFactorToken}
            onChange={(e) => setTwoFactorToken(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            style={{ 
              background: "var(--slate-900)", 
              border: "1px solid var(--border-subtle)", 
              color: "#fff", 
              height: "44px",
              textAlign: "center",
              fontSize: "18px",
              letterSpacing: "0.2em"
            }}
          />

          <div style={{ marginTop: 20 }}>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const { getWebAuthnLoginOptions, verifyWebAuthnLogin, startAuthentication } = await import("@pwmnger/app-logic");
                  const options = await getWebAuthnLoginOptions(email);
                  const assertion = await startAuthentication(options);
                  await verifyWebAuthnLogin(assertion);
                  handleSubmit(); 
                } catch (err: any) {
                  console.error(err);
                }
              }}
              style={{ fontSize: "12px", width: "100%", height: "36px", gap: 8 }}
            >
              <Key size={14} /> Use Security Key (YubiKey)
            </Button>
          </div>
        </div>
      )}

      {error && !show2FA && (
        <p style={{ color: "#ef4444", textAlign: "center", marginTop: 20, fontSize: "13px", background: "rgba(239, 68, 68, 0.05)", padding: "8px", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
          {error}
        </p>
      )}
      
      {show2FA && error && error !== "2FA Required" && (
        <p style={{ color: "#ef4444", textAlign: "center", marginTop: 20, fontSize: "13px", background: "rgba(239, 68, 68, 0.05)", padding: "8px", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
          {error}
        </p>
      )}

      <div style={{ marginTop: 32 }}>
        <Button
          onClick={handleSubmit}
          disabled={loading || !email || !password || (show2FA && !twoFactorToken)}
          style={{ 
            width: "100%", 
            height: "44px", 
            background: "var(--accent-green)", 
            color: "#000", 
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            border: "none"
          }}
        >
          {loading ? "Verifying..." : show2FA ? "Confirm Code" : "Continue to Vault"} 
          {!loading && <ArrowRight size={16} />}
        </Button>
      </div>

      <div style={{ marginTop: 32, textAlign: "center", fontSize: "13px", color: "var(--text-dim)" }}>
        Don't have an account?{" "}
        <span
          onClick={onGoToRegister}
          style={{ color: "var(--accent-green)", cursor: "pointer", fontWeight: 600 }}
        >
          Create separate Vault
        </span>
        <div style={{ marginTop: 12 }}>
          <span
            onClick={() => window.location.href = "/unlock?recover=true"}
            style={{ color: "var(--text-muted)", cursor: "pointer", fontSize: "12px", opacity: 0.8 }}
          >
            Lost master password? <span style={{ color: "var(--accent-green)" }}>Use Recovery Kit</span>
          </span>
        </div>
      </div>
    </div>
  );
};