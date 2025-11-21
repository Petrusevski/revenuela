import React, { useEffect, useState } from "react";

type VaultModalProps = {
  provider: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (secrets: Record<string, string>) => void;
};

type VaultField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "password" | "textarea";
  helperText?: string;
};

// Per-provider field configuration
const PROVIDER_FIELDS: Record<string, VaultField[]> = {
  // Clay – typical API key
 clay: [
    {
      key: "apiKey",
      label: "API Key",
      placeholder: "sk_live_...",
      type: "password",
      helperText: "Settings → API Key",
    },
    {
      key: "tableId",
      label: "Table / View ID",
      placeholder: "tbl_...",
      type: "text",
      helperText: "The ID of the table you want to import leads from.",
    },
  ],

  // Stripe – API key + optional webhook secret
  stripe: [
    {
      key: "apiKey",
      label: "Secret API key",
      placeholder: "sk_live_...",
      type: "password",
      helperText:
        "From Stripe Dashboard → Developers → API keys (SECRET key, not publishable).",
    },
    {
      key: "webhookSecret",
      label: "Webhook signing secret (optional)",
      placeholder: "whsec_...",
      type: "password",
      helperText:
        "If you use webhooks, paste your endpoint's signing secret (Developers → Webhooks).",
    },
  ],

  // Segment – write key + optional webhook URL
  segment: [
    {
      key: "writeKey",
      label: "Write key",
      placeholder: "SEGMENT_WRITE_KEY",
      type: "password",
      helperText: "From Segment source settings → API keys.",
    },
    {
      key: "webhookUrl",
      label: "Webhook URL (optional)",
      placeholder: "https://your-app.com/webhooks/segment",
      type: "text",
      helperText:
        "If you forward events via webhook instead of direct SDK, paste your endpoint URL.",
    },
  ],

  // HubSpot – access token only
  hubspot: [
    {
      key: "accessToken",
      label: "Access token",
      placeholder: "pat-eu1-...",
      type: "password",
      helperText:
        "Paste a private app access token from HubSpot (Settings → Integrations → Private apps).",
    },
  ],

  // Fallback: generic fields – user chooses what they actually need
  default: [
    {
      key: "apiKey",
      label: "API key (optional)",
      placeholder: "sk_live_... or any key",
      type: "password",
      helperText:
        "If your tool uses a single API key, paste it here. Leave empty if not needed.",
    },
    {
      key: "accessToken",
      label: "Access token / secret (optional)",
      placeholder: "token, PAT, client secret…",
      type: "password",
      helperText:
        "Use this if your tool gives you a token or secret instead of an API key.",
    },
    {
      key: "webhookUrl",
      label: "Webhook URL (optional)",
      placeholder: "https://your-app.com/webhooks/provider",
      type: "text",
      helperText:
        "For webhook-only tools, paste the URL where they should send events.",
    },
  ],
};

const getFieldsForProvider = (provider: string): VaultField[] =>
  PROVIDER_FIELDS[provider] ?? PROVIDER_FIELDS.default;

const prettifyProviderName = (id: string) =>
  id
    ? id
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "";

const VaultModal: React.FC<VaultModalProps> = ({
  provider,
  isOpen,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({});
      setError(null);
    }
  }, [isOpen, provider]);

  if (!isOpen) return null;

  const fields = getFieldsForProvider(provider);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Keep only non-empty fields
    const nonEmpty: Record<string, string> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (typeof v === "string" && v.trim().length > 0) {
        nonEmpty[k] = v.trim();
      }
    });

    if (Object.keys(nonEmpty).length === 0) {
      setError(
        "Please enter at least one credential (API key, token or webhook URL)."
      );
      return;
    }

    onSave(nonEmpty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Connect {prettifyProviderName(provider)}
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          Paste the credentials provided by{" "}
          {prettifyProviderName(provider)}. All values are{" "}
          <span className="font-medium text-emerald-300">encrypted</span>{" "}
          before they are stored and never shown back in plain text.
        </p>

        <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-slate-200">
                {field.label}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={form[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder={field.placeholder}
                />
              ) : (
                <input
                  type={field.type === "password" ? "password" : "text"}
                  value={form[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-50 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder={field.placeholder}
                />
              )}

              {field.helperText && (
                <p className="mt-1 text-[10px] text-slate-400">
                  {field.helperText}
                </p>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-3 rounded-md bg-rose-900/40 px-3 py-2 text-[11px] text-rose-200">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs text-slate-200 hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-slate-50 hover:bg-indigo-500"
          >
            Save & check connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default VaultModal;
