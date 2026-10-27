"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Input, Textarea, Select, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/security/Turnstile";
import { quoteRequestSchema } from "@/lib/schema/lead";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

// The client form omits server-managed fields (honeypot is rendered
// directly, turnstileToken/utm are attached at submit time) so
// react-hook-form's inferred type matches exactly what the visible fields
// produce.
const clientSchema = quoteRequestSchema.omit({ honeypot: true, turnstileToken: true, utm: true });
type ClientQuoteForm = z.infer<typeof clientSchema>;

const goalOptions = [
  { value: "messenger-crm", label: "Messenger/CRM automation" },
  { value: "lead-generation", label: "Lead generation" },
  { value: "social-distribution", label: "Social media distribution" },
  { value: "ecommerce-ops", label: "E-commerce operations" },
  { value: "ai-agent", label: "AI agent / LLM workflows" },
  { value: "other", label: "Something else" },
];
const deploymentOptions = [
  { value: "n8n-cloud", label: "n8n Cloud" },
  { value: "self-hosted-vps", label: "Self-hosted VPS" },
  { value: "on-premise", label: "On-premise" },
  { value: "not-sure", label: "Not sure yet" },
];
const budgetOptions = [
  { value: "under-1k", label: "< $1k" },
  { value: "1k-5k", label: "$1k–$5k" },
  { value: "5k-15k", label: "$5k–$15k" },
  { value: "15k-plus", label: "$15k+" },
];
const timelineOptions = [
  { value: "asap", label: "ASAP" },
  { value: "2-4-weeks", label: "2–4 weeks" },
  { value: "1-3-months", label: "1–3 months" },
  { value: "exploring", label: "Just exploring" },
];

export function QuoteForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientQuoteForm>({ resolver: zodResolver(clientSchema) });

  async function onSubmit(values: ClientQuoteForm) {
    if (!turnstileToken) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      const response = await fetch("/api/leads/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, honeypot: "", turnstileToken }),
      });
      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line/70 bg-white p-8 text-center">
        <CheckCircle2 aria-hidden="true" size={32} className="text-teal-700" />
        <p className="text-sm font-medium text-ink">
          Thanks — we&apos;ll reply within 1 business day with next steps.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {/* Honeypot: real users never see or fill this. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="quote-company-website">Leave this field empty</label>
        <input id="quote-company-website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Full name" required error={errors.fullName?.message} {...register("fullName")} />
        <Input
          label="Work email"
          type="email"
          required
          error={errors.workEmail?.message}
          {...register("workEmail")}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Company" required error={errors.company?.message} {...register("company")} />
        <Input
          label="Website"
          type="url"
          placeholder="https://"
          error={errors.website?.message}
          {...register("website")}
        />
      </div>

      <Select
        label="Primary goal"
        required
        placeholder="Select a goal"
        options={goalOptions}
        error={errors.primaryGoal?.message}
        {...register("primaryGoal")}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Select
          label="Deployment target"
          required
          placeholder="Select one"
          options={deploymentOptions}
          error={errors.deploymentTarget?.message}
          {...register("deploymentTarget")}
        />
        <Select
          label="Budget range"
          required
          placeholder="Select one"
          options={budgetOptions}
          error={errors.budgetRange?.message}
          {...register("budgetRange")}
        />
        <Select
          label="Timeline"
          required
          placeholder="Select one"
          options={timelineOptions}
          error={errors.timeline?.message}
          {...register("timeline")}
        />
      </div>

      <Textarea
        label="Project details"
        required
        hint="At least 20 characters — the more context, the faster we can quote."
        error={errors.projectDetails?.message}
        {...register("projectDetails")}
      />

      <Checkbox
        label="I agree to be contacted about this request."
        error={errors.consent?.message}
        {...register("consent")}
      />

      <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />

      {status === "error" ? (
        <p role="alert" className="text-sm font-medium text-danger">
          Something went wrong sending your request. Please try again.
        </p>
      ) : null}

      <Button type="submit" loading={status === "submitting"} disabled={!turnstileToken} className="self-start">
        Request a Quote
      </Button>
    </form>
  );
}
