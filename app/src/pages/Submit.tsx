import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  Text,
  Textarea,
} from "@fluentui/react-components";
import { SendRegular } from "@fluentui/react-icons";
import { api, ApiError, errorMessage } from "../api/client";
import { QualificationCard } from "../components/Qualification";
import type { AppConfig, IdeaInput, Qualification } from "../types";

const EMPTY: IdeaInput = {
  name: "",
  department: "",
  title: "",
  problem: "",
  desiredOutcome: "",
  currentProcess: "",
  frequency: "",
  usersAffected: "",
  dataSources: "",
  audience: "",
  capabilities: [],
  website: "",
};

export default function Submit() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [form, setForm] = useState<IdeaInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Qualification | null>(null);

  useEffect(() => {
    api.config().then(setConfig).catch((err) => setMessage(errorMessage(err)));
  }, []);

  const update = (key: keyof IdeaInput) => (_: unknown, data: { value: string }) =>
    setForm((f) => ({ ...f, [key]: data.value }));

  const toggleCapability = (key: string, checked: boolean) =>
    setForm((f) => ({
      ...f,
      capabilities: checked ? [...f.capabilities, key] : f.capabilities.filter((c) => c !== key),
    }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrors({});
    try {
      const res = await api.submitIdea(form);
      setForm(EMPTY);
      setResult(res.qualification);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setMessage(errorMessage(err));
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <div className="form-shell stack">
        <MessageBar intent="success">
          <MessageBarBody>
            <MessageBarTitle>Thank you!</MessageBarTitle>
            Your idea has been submitted. Here's our initial assessment:
          </MessageBarBody>
        </MessageBar>
        <QualificationCard qualification={result} />
        <Text size={200} className="muted">
          This is an automatic suggestion based on your answers. Facilitators will review and score every idea.
        </Text>
        <div className="row">
          <Button appearance="primary" onClick={() => setResult(null)}>
            Share another idea
          </Button>
          <Button onClick={() => navigate("/ideas")}>Browse & vote</Button>
        </div>
      </div>
    );
  }

  if (!config) {
    return message ? (
      <MessageBar intent="error">
        <MessageBarBody>{message}</MessageBarBody>
      </MessageBar>
    ) : (
      <Spinner label="Loading..." />
    );
  }

  return (
    <form className="form-shell stack" onSubmit={onSubmit} noValidate>
      <div className="page-header">
        <h1>Share a use case idea</h1>
        <Text className="muted">
          Takes about 3 minutes. Fields marked * are required. Your answers help us recommend the right agent platform.
        </Text>
      </div>

      {message && (
        <MessageBar intent="error">
          <MessageBarBody>{message}</MessageBarBody>
        </MessageBar>
      )}

      <section className="form-section">
        <h2>
          <span className="section-num">1</span> About you
        </h2>
        <div className="grid-2">
          <Field label="Your name" validationMessage={errors.name} hint="Optional, shown with your idea">
            <Input value={form.name} onChange={update("name")} maxLength={100} />
          </Field>
          <Field label="Department / Organization" required validationMessage={errors.department}>
            <Input value={form.department} onChange={update("department")} maxLength={100} />
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h2>
          <span className="section-num">2</span> Your idea
        </h2>
        <Field label="Idea title" required validationMessage={errors.title}>
          <Input value={form.title} onChange={update("title")} maxLength={120} placeholder="e.g. HR policy Q&A agent" />
        </Field>
        <Field label="What problem or pain point should the agent solve?" required validationMessage={errors.problem}>
          <Textarea value={form.problem} onChange={update("problem")} maxLength={2000} rows={4} resize="vertical" />
        </Field>
        <Field label="What should the agent do? What's the desired outcome?" required validationMessage={errors.desiredOutcome}>
          <Textarea value={form.desiredOutcome} onChange={update("desiredOutcome")} maxLength={2000} rows={4} resize="vertical" />
        </Field>
      </section>

      <section className="form-section">
        <h2>
          <span className="section-num">3</span> How it works today
        </h2>
        <Field label="Current process" validationMessage={errors.currentProcess}>
          <Textarea value={form.currentProcess} onChange={update("currentProcess")} maxLength={2000} rows={3} resize="vertical" />
        </Field>
        <div className="grid-2">
          <Field label="How often does this happen?" required validationMessage={errors.frequency}>
            <Select value={form.frequency} onChange={update("frequency")}>
              <option value="">Select...</option>
              {config.frequencies.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>
          <Field label="How many people are affected?" required validationMessage={errors.usersAffected}>
            <Select value={form.usersAffected} onChange={update("usersAffected")}>
              <option value="">Select...</option>
              {config.usersAffected.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label="Data sources / systems involved"
          validationMessage={errors.dataSources}
          hint="e.g. SharePoint, Dataverse, ServiceNow, SAP, Excel, Outlook"
        >
          <Textarea value={form.dataSources} onChange={update("dataSources")} maxLength={1000} rows={2} resize="vertical" />
        </Field>
      </section>

      <section className="form-section">
        <h2>
          <span className="section-num">4</span> What should the agent be able to do?
        </h2>
        <div role="group" aria-labelledby="capabilities-label" className="stack" style={{ gap: 6 }}>
          <Text id="capabilities-label">Select all that apply</Text>
          <div className="checkbox-grid">
            {config.capabilities.map((c) => (
              <Checkbox
                key={c.key}
                label={c.label}
                checked={form.capabilities.includes(c.key)}
                onChange={(_, d) => toggleCapability(c.key, !!d.checked)}
              />
            ))}
          </div>
          {errors.capabilities && <Text className="error-text">{errors.capabilities}</Text>}
        </div>
        <Field label="Who will use the agent?" validationMessage={errors.audience}>
          <RadioGroup value={form.audience} onChange={(_, d) => setForm((f) => ({ ...f, audience: d.value }))} layout="horizontal">
            {config.audiences.map((a) => (
              <Radio key={a} value={a} label={a} />
            ))}
          </RadioGroup>
        </Field>
      </section>

      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
        </label>
      </div>

      <Text size={200} className="muted">
        Submitted ideas are visible to all workshop participants. Please don't include confidential or personal data.
      </Text>

      <div className="row">
        <Button appearance="primary" size="large" type="submit" disabled={saving} icon={<SendRegular />}>
          {saving ? "Submitting..." : "Submit idea"}
        </Button>
      </div>
    </form>
  );
}
