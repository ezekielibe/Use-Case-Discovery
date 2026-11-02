import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Select,
  Spinner,
  Text,
  Textarea,
  Title2,
} from "@fluentui/react-components";
import { api, ApiError, errorMessage } from "../api/client";
import type { AppConfig, IdeaInput } from "../types";

const EMPTY: IdeaInput = {
  name: "",
  email: "",
  department: "",
  title: "",
  problem: "",
  desiredOutcome: "",
  currentProcess: "",
  frequency: "",
  usersAffected: "",
  dataSources: "",
  website: "",
};

export default function Submit() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [form, setForm] = useState<IdeaInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.config().then(setConfig).catch((err) => setMessage(errorMessage(err)));
  }, []);

  const update = (key: keyof IdeaInput) => (_: unknown, data: { value: string }) =>
    setForm((f) => ({ ...f, [key]: data.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setErrors({});
    try {
      await api.submitIdea(form);
      setForm(EMPTY);
      setDone(true);
    } catch (err) {
      setMessage(errorMessage(err));
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="panel stack">
        <MessageBar intent="success">
          <MessageBarBody>
            <MessageBarTitle>Thank you!</MessageBarTitle>
            Your idea has been submitted.
          </MessageBarBody>
        </MessageBar>
        <div className="row">
          <Button appearance="primary" onClick={() => setDone(false)}>
            Share another idea
          </Button>
          <Link to="/ideas">
            <Button>Browse & vote</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!config) return message ? <MessageBar intent="error"><MessageBarBody>{message}</MessageBarBody></MessageBar> : <Spinner label="Loading..." />;

  return (
    <form className="panel stack" onSubmit={onSubmit} noValidate>
      <Title2>Share a use case idea</Title2>
      <Text className="muted">Fields marked * are required. Your email is only visible to workshop facilitators.</Text>

      {message && (
        <MessageBar intent="error">
          <MessageBarBody>{message}</MessageBarBody>
        </MessageBar>
      )}

      <div className="grid-2">
        <Field label="Your name" validationMessage={errors.name}>
          <Input value={form.name} onChange={update("name")} maxLength={100} />
        </Field>
        <Field label="Email" validationMessage={errors.email} hint="Optional, so facilitators can follow up">
          <Input type="email" value={form.email} onChange={update("email")} maxLength={200} />
        </Field>
        <Field label="Department / Organization" required validationMessage={errors.department}>
          <Input value={form.department} onChange={update("department")} maxLength={100} />
        </Field>
      </div>

      <Field label="Idea title" required validationMessage={errors.title}>
        <Input value={form.title} onChange={update("title")} maxLength={120} placeholder="e.g. HR policy Q&A agent" />
      </Field>
      <Field label="What problem or pain point should the agent solve?" required validationMessage={errors.problem}>
        <Textarea value={form.problem} onChange={update("problem")} maxLength={2000} rows={4} resize="vertical" />
      </Field>
      <Field label="What should the agent do / desired outcome?" required validationMessage={errors.desiredOutcome}>
        <Textarea value={form.desiredOutcome} onChange={update("desiredOutcome")} maxLength={2000} rows={4} resize="vertical" />
      </Field>
      <Field label="How is this done today?" validationMessage={errors.currentProcess}>
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
        hint="e.g. SharePoint, Dataverse, ServiceNow, SAP, Excel, email"
      >
        <Textarea value={form.dataSources} onChange={update("dataSources")} maxLength={1000} rows={2} resize="vertical" />
      </Field>

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
        Submitted ideas (excluding email) are visible to all workshop participants. Please don't include confidential or
        personal data.
      </Text>

      <div className="row">
        <Button appearance="primary" type="submit" disabled={saving}>
          {saving ? "Submitting..." : "Submit idea"}
        </Button>
      </div>
    </form>
  );
}
