import { useState, useEffect } from "react";
import { X, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";

interface VaultModalProps {
  provider: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (secrets: Record<string, string>) => void;
}

function MaskedInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
      <input
        id={id}
        type={visible ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-600 font-mono"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        tabIndex={-1}
        aria-label={visible ? "Hide" : "Show"}
      >
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function PlainInput({
  value,
  onChange,
  placeholder,
  id,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      autoComplete="off"
      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-600"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Per-tool credential field configuration
type FieldConfig = {
  key: string;           // key in secrets object
  label: string;
  placeholder: string;
  masked: boolean;
  required?: boolean;
  type?: string;
};

const TOOL_FIELDS: Record<string, FieldConfig[]> = {
  clay: [
    { key: "apiKey", label: "API Key", placeholder: "clay_…", masked: true, required: true },
    { key: "tableId", label: "Table / View URL", placeholder: "https://clay.com/workspace/…", masked: false, required: true },
    { key: "webhookUrl", label: "Webhook URL", placeholder: "https://your-app.com/webhooks/clay", masked: false, type: "url" },
  ],
  hubspot: [
    { key: "accessToken", label: "Private App Access Token", placeholder: "pat-na1-…", masked: true, required: true },
  ],
  salesforce: [
    { key: "clientId", label: "Client ID (Consumer Key)", placeholder: "3MVG9…", masked: false, required: true },
    { key: "clientSecret", label: "Client Secret (Consumer Secret)", placeholder: "abc123…", masked: true, required: true },
    { key: "instanceUrl", label: "Instance URL", placeholder: "https://yourorg.my.salesforce.com", masked: false, required: true, type: "url" },
  ],
  airtable: [
    { key: "accessToken", label: "Personal Access Token", placeholder: "pat…", masked: true, required: true },
    { key: "tableId", label: "Base ID", placeholder: "appXXXXXXXXXXXX", masked: false, required: true },
  ],
  pipedrive: [
    { key: "apiKey", label: "API Token", placeholder: "Pipedrive personal API token", masked: true, required: true },
    { key: "webhookUrl", label: "Webhook URL (optional)", placeholder: "https://your-app.com/webhooks/pipedrive", masked: false, type: "url" },
  ],
  attio: [
    { key: "clientId", label: "Client ID", placeholder: "Attio OAuth Client ID", masked: false, required: true },
    { key: "clientSecret", label: "Client Secret", placeholder: "Attio OAuth Client Secret", masked: true, required: true },
  ],
  apollo: [
    { key: "apiKey", label: "API Key", placeholder: "Apollo.io API key", masked: true, required: true },
    { key: "webhookUrl", label: "Webhook URL (optional)", placeholder: "https://your-app.com/webhooks/apollo", masked: false, type: "url" },
  ],
  lusha: [
    { key: "apiKey", label: "API Key", placeholder: "Lusha API key", masked: true, required: true },
  ],
  phantombuster: [
    { key: "apiKey", label: "API Key", placeholder: "PhantomBuster API key", masked: true, required: true },
    { key: "webhookUrl", label: "Webhook URL (optional)", placeholder: "https://your-app.com/webhooks/pb", masked: false, type: "url" },
  ],
  cognism: [
    { key: "apiKey", label: "API Key", placeholder: "Cognism API key", masked: true, required: true },
  ],
  clearbit: [
    { key: "apiKey", label: "API Key (Secret Key)", placeholder: "sk_…", masked: true, required: true },
  ],
  clearbit_p: [
    { key: "apiKey", label: "API Key (Secret Key)", placeholder: "sk_…", masked: true, required: true },
  ],
  zoominfo: [
    { key: "apiKey", label: "Username (Email)", placeholder: "you@company.com", masked: false, required: true },
    { key: "accessToken", label: "Password", placeholder: "ZoomInfo account password", masked: true, required: true },
  ],
  hunter: [
    { key: "apiKey", label: "API Key", placeholder: "Hunter.io API key", masked: true, required: true },
  ],
  pdl: [
    { key: "apiKey", label: "API Key", placeholder: "People Data Labs API key", masked: true, required: true },
  ],
  snovio: [
    { key: "apiKey", label: "API User ID", placeholder: "Snov.io API user ID", masked: false, required: true },
    { key: "accessToken", label: "API Secret", placeholder: "Snov.io API secret key", masked: true, required: true },
  ],
  rocketreach: [
    { key: "apiKey", label: "API Key", placeholder: "RocketReach API key", masked: true, required: true },
  ],
  smartlead: [
    { key: "apiKey", label: "API Key", placeholder: "Smartlead API key", masked: true, required: true },
    { key: "webhookUrl", label: "Webhook URL (optional)", placeholder: "https://your-app.com/webhooks/smartlead", masked: false, type: "url" },
  ],
  instantly: [
    { key: "apiKey", label: "API Key", placeholder: "Instantly API key", masked: true, required: true },
  ],
  lemlist: [
    { key: "apiKey", label: "API Key", placeholder: "Lemlist API key", masked: true, required: true },
  ],
  heyreach: [
    { key: "apiKey", label: "API Key", placeholder: "HeyReach API key", masked: true, required: true },
    { key: "webhookUrl", label: "Webhook URL (optional)", placeholder: "https://your-app.com/webhooks/heyreach", masked: false, type: "url" },
  ],
  outreach: [
    { key: "clientId", label: "Client ID", placeholder: "Outreach OAuth Client ID", masked: false, required: true },
    { key: "clientSecret", label: "Client Secret", placeholder: "Outreach OAuth Client Secret", masked: true, required: true },
  ],
  replyio: [
    { key: "apiKey", label: "API Key", placeholder: "Reply.io API key", masked: true, required: true },
  ],
  stripe: [
    { key: "apiKey", label: "Secret Key", placeholder: "sk_live_…", masked: true, required: true },
    { key: "accessToken", label: "Webhook Signing Secret", placeholder: "whsec_…", masked: true, required: true },
  ],
  paddle: [
    { key: "apiKey", label: "API Key", placeholder: "Paddle API key", masked: true, required: true },
    { key: "webhookUrl", label: "Webhook URL (optional)", placeholder: "https://your-app.com/webhooks/paddle", masked: false, type: "url" },
  ],
  chargebee: [
    { key: "apiKey", label: "API Key", placeholder: "Chargebee API key", masked: true, required: true },
    { key: "tableId", label: "Site Name", placeholder: "yourcompany (from yourcompany.chargebee.com)", masked: false, required: true },
  ],
  lemonsqueezy: [
    { key: "apiKey", label: "API Key", placeholder: "LemonSqueezy API key", masked: true, required: true },
    { key: "accessToken", label: "Webhook Secret (optional)", placeholder: "lmnsqzy_…", masked: true },
  ],
  n8n: [
    { key: "instanceUrl", label: "Instance URL", placeholder: "https://app.n8n.cloud  or  https://n8n.yourcompany.com", masked: false, required: true, type: "url" },
    { key: "apiKey", label: "API Key", placeholder: "n8n API key (Settings → API → Create an API key)", masked: true, required: true },
  ],
  make: [
    { key: "apiKey", label: "API Token", placeholder: "Make.com API token (Account → API access → Add token)", masked: true, required: true },
    { key: "tableId", label: "Region", placeholder: "us1  (or eu1 / eu2 for European teams)", masked: false, required: false },
  ],
};

// Fallback generic fields
const GENERIC_FIELDS: FieldConfig[] = [
  { key: "apiKey", label: "API Key", placeholder: "sk_live_… or similar", masked: true },
  { key: "accessToken", label: "Access Token / Secret", placeholder: "token, PAT, client secret…", masked: true },
  { key: "webhookUrl", label: "Webhook URL", placeholder: "https://your-app.com/webhooks/…", masked: false, type: "url" },
];

export default function VaultModal({ provider, isOpen, onClose, onSave }: VaultModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const fields = TOOL_FIELDS[provider] ?? GENERIC_FIELDS;
  const displayName = provider
    ? provider.replace("_p", "").charAt(0).toUpperCase() + provider.replace("_p", "").slice(1)
    : "";

  useEffect(() => {
    if (isOpen) {
      setValues({});
      setValidationError(null);
    }
  }, [isOpen, provider]);

  if (!isOpen) return null;

  const setValue = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const secrets: Record<string, string> = {};
    fields.forEach((f) => {
      const v = (values[f.key] ?? "").trim();
      if (v) secrets[f.key] = v;
    });

    // Require all required fields
    const missingRequired = fields.find((f) => f.required && !(values[f.key] ?? "").trim());
    if (missingRequired) {
      setValidationError(`${missingRequired.label} is required.`);
      return;
    }

    // At least one field filled if no required fields
    if (Object.keys(secrets).length === 0) {
      setValidationError("Enter at least one credential to connect.");
      return;
    }

    // Minimum length guard for masked (secret) fields
    const shortKey = Object.entries(secrets).find(
      ([k, v]) => fields.find((f) => f.key === k)?.masked && v.length < 8
    );
    if (shortKey) {
      setValidationError(`${shortKey[0]} looks too short — check your credential.`);
      return;
    }

    onSave(secrets);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              Connect {displayName}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-[300px]">
              Credentials are <span className="text-emerald-400 font-medium">AES-256 encrypted</span> before
              being stored. They are never logged or exposed in the UI.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors ml-4 shrink-0">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label htmlFor={`vault-${field.key}`} className="block text-xs font-medium text-slate-300 mb-1">
                {field.label}{" "}
                {field.required ? (
                  <span className="text-[10px] text-rose-400 font-semibold">required</span>
                ) : (
                  <span className="text-slate-500">(optional)</span>
                )}
              </label>
              {field.masked ? (
                <MaskedInput
                  id={`vault-${field.key}`}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(v) => setValue(field.key, v)}
                />
              ) : (
                <PlainInput
                  id={`vault-${field.key}`}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(v) => setValue(field.key, v)}
                  type={field.type ?? "text"}
                />
              )}
            </div>
          ))}

          {/* Validation error */}
          {validationError && (
            <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {validationError}
            </p>
          )}

          {/* Security note */}
          <p className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1">
            <Lock size={10} className="shrink-0" />
            Keys are encrypted with AES-256-GCM and never stored in your browser or logged.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-colors"
            >
              Save & verify connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
