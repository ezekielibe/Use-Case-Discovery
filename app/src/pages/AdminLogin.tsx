import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, Input, MessageBar, MessageBarBody, Title2 } from "@fluentui/react-components";
import { adminSession, api, errorMessage } from "../api/client";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [facilitator, setFacilitator] = useState(adminSession.facilitator);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.login(passcode, facilitator);
      adminSession.set(res.token, res.facilitator);
      navigate("/admin");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel stack" style={{ maxWidth: 420, margin: "0 auto" }} onSubmit={onSubmit}>
      <Title2>Facilitator sign-in</Title2>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      <Field label="Your name" required hint="Shown next to your scores">
        <Input value={facilitator} onChange={(_, d) => setFacilitator(d.value)} maxLength={60} />
      </Field>
      <Field label="Passcode" required>
        <Input type="password" value={passcode} onChange={(_, d) => setPasscode(d.value)} autoComplete="current-password" />
      </Field>
      <Button appearance="primary" type="submit" disabled={busy || !facilitator.trim() || !passcode}>
        {busy ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
