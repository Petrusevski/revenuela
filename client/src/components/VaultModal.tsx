import { useState, useEffect } from "react";
import { X, Lock, } from "lucide-react";

interface VaultModalProps {
  provider: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (secrets: Record<string, string>) => void;
}

export default function VaultModal({ provider, isOpen, onClose, onSave }: VaultModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [tableId, setTableId] = useState(""); // Useful for Clay
  const [webhookUrl, setWebhookUrl] = useState("");

  // Reset fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKey("");
      setAccessToken("");
      setTableId("");
      setWebhookUrl("");
    }
  }, [isOpen, provider]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the secrets object based on what was filled
    const secrets: Record<string, string> = {};
    if (apiKey) secrets.apiKey = apiKey;
    if (accessToken) secrets.accessToken = accessToken;
    if (tableId) secrets.tableId = tableId;
    if (webhookUrl) secrets.webhookUrl = webhookUrl;

    onSave(secrets);
  };

  // Dynamic labels based on provider (optional polish)
  const isClay = provider === 'clay';
  const isHubSpot = provider === 'hubspot';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Connect {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
              Paste the credentials provided by {provider}. All values are <span className="text-emerald-400 font-medium">encrypted</span> before storage.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* API Key Field (Standard) */}
          {!isHubSpot && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                API Key <span className="text-slate-500">(optional)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input 
                  type="password" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-600"
                  placeholder="sk_live_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Access Token Field (HubSpot, etc) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Access Token / Secret <span className="text-slate-500">(optional)</span>
            </label>
            <input 
              type="password" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-600"
              placeholder="token, PAT, client secret..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </div>

          {/* Clay Specific Field */}
          {isClay && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Table ID / View URL <span className="text-slate-500">(required for Clay)</span>
              </label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-600"
                placeholder="https://clay.com/workspace/..."
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
              />
            </div>
          )}

          {/* Webhook URL (Generic) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Webhook URL <span className="text-slate-500">(optional)</span>
            </label>
            <input 
              type="text" 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none placeholder-slate-600"
              placeholder="https://your-app.com/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
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
              Save & check connection
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}