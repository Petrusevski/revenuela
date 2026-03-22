import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import PageHeader from "../components/PageHeader";
import {
  FileText, Download, CheckCircle2, Loader2,
  Building2, Mail, Hash, Calendar, CreditCard,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  dateFormatted: string;
  status: "paid" | "pending";
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  leadId: string | null;
  description: string;
  amount: number;
  currency: string;
  source: string;
  chargeId: string;
  issuer: {
    company: string;
    registry: string;
    address: string;
    email: string;
    country: string;
  };
};

// ── Invoice HTML template ─────────────────────────────────────────────────────

function buildInvoiceHTML(inv: Invoice): string {
  const currencySymbol = inv.currency === "USD" ? "$" : inv.currency === "GBP" ? "£" : "€";
  const amountFmt = `${currencySymbol}${inv.amount.toFixed(2)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${inv.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #fff; padding: 48px; font-size: 14px; }
    .invoice { max-width: 780px; margin: 0 auto; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .brand-name { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .brand-sub  { font-size: 11px; color: #6366f1; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-badge { text-align: right; }
    .invoice-badge h1 { font-size: 32px; font-weight: 900; color: #6366f1; letter-spacing: -1px; }
    .invoice-badge .inv-num { font-size: 13px; color: #64748b; margin-top: 4px; font-weight: 500; }

    /* Divider */
    .divider { height: 2px; background: linear-gradient(90deg, #6366f1, #a855f7); border-radius: 2px; margin-bottom: 36px; }

    /* Parties */
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .party-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px; }
    .party-name  { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .party-line  { font-size: 12px; color: #64748b; line-height: 1.7; }

    /* Meta row */
    .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 36px; }
    .meta-item { display: flex; flex-direction: column; gap: 4px; }
    .meta-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; }
    .meta-value { font-size: 13px; font-weight: 600; color: #1e293b; }
    .status-paid { display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 20px; }

    /* Items table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead tr { background: #0f172a; }
    thead th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; }
    thead th:last-child { text-align: right; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody td { padding: 16px; font-size: 13px; color: #334155; }
    tbody td:last-child { text-align: right; font-weight: 600; }
    .item-name { font-weight: 600; color: #1e293b; }
    .item-sub  { font-size: 11px; color: #94a3b8; margin-top: 2px; }

    /* Totals */
    .totals { display: flex; justify-content: flex-end; margin-bottom: 36px; }
    .totals-box { width: 260px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .totals-row:last-child { border-bottom: none; background: #0f172a; }
    .totals-row:last-child .label { color: #cbd5e1; font-weight: 600; }
    .totals-row:last-child .value { color: #fff; font-weight: 800; font-size: 15px; }
    .label { color: #64748b; }
    .value { font-weight: 600; color: #1e293b; }

    /* Footer */
    .footer { border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; }
    .footer-note { font-size: 11px; color: #94a3b8; line-height: 1.6; }
    .footer-ref  { font-size: 11px; color: #cbd5e1; font-family: monospace; }

    @media print {
      body { padding: 24px; }
      @page { margin: 16mm; }
    }
  </style>
</head>
<body>
  <div class="invoice">

    <!-- Header -->
    <div class="header">
      <div class="brand">
        <div class="brand-name">${inv.issuer.company}</div>
        <div class="brand-sub">GTM Intelligence · iqpipe.io</div>
      </div>
      <div class="invoice-badge">
        <h1>INVOICE</h1>
        <div class="inv-num">${inv.invoiceNumber}</div>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Parties -->
    <div class="parties">
      <div>
        <div class="party-label">From</div>
        <div class="party-name">${inv.issuer.company}</div>
        <div class="party-line">Registry: ${inv.issuer.registry}</div>
        <div class="party-line">${inv.issuer.address}</div>
        <div class="party-line">${inv.issuer.country}</div>
        <div class="party-line">${inv.issuer.email}</div>
      </div>
      <div>
        <div class="party-label">Bill To</div>
        <div class="party-name">${inv.customerName}</div>
        ${inv.customerCompany ? `<div class="party-line">${inv.customerCompany}</div>` : ""}
        ${inv.customerEmail   ? `<div class="party-line">${inv.customerEmail}</div>`   : ""}
      </div>
    </div>

    <!-- Meta -->
    <div class="meta">
      <div class="meta-item">
        <div class="meta-label">Invoice No.</div>
        <div class="meta-value">${inv.invoiceNumber}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Issue Date</div>
        <div class="meta-value">${inv.dateFormatted}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Payment Date</div>
        <div class="meta-value">${inv.dateFormatted}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Status</div>
        <div class="meta-value"><span class="status-paid">✓ PAID</span></div>
      </div>
    </div>

    <!-- Line items -->
    <table>
      <thead>
        <tr>
          <th style="width:60%">Description</th>
          <th>Source</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-name">${inv.description || "iqpipe subscription"}</div>
            ${inv.chargeId ? `<div class="item-sub">Charge: ${inv.chargeId}</div>` : ""}
          </td>
          <td>${inv.source}</td>
          <td>${amountFmt}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-box">
        <div class="totals-row">
          <span class="label">Subtotal</span>
          <span class="value">${amountFmt}</span>
        </div>
        <div class="totals-row">
          <span class="label">Tax</span>
          <span class="value">€0.00</span>
        </div>
        <div class="totals-row">
          <span class="label">Total</span>
          <span class="value">${amountFmt}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-note">
        Thank you for your business.<br />
        Questions? Contact us at ${inv.issuer.email}
      </div>
      <div class="footer-ref">${inv.invoiceNumber} · ${inv.issuer.registry}</div>
    </div>

  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("iqpipe_token");
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE_URL}/api/workspaces/primary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(({ id: workspaceId }) =>
        fetch(`${API_BASE_URL}/api/invoices?workspaceId=${encodeURIComponent(workspaceId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      )
      .then(r => r.json())
      .then(data => setInvoices(data.invoices || []))
      .catch(() => setError("Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  function downloadInvoice(inv: Invoice) {
    const html  = buildInvoiceHTML(inv);
    const blob  = new Blob([html], { type: "text/html" });
    const url   = URL.createObjectURL(blob);
    const win   = window.open(url, "_blank");
    if (win) setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const totalRevenue = invoices.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="pb-12">
      <PageHeader
        title="Invoices"
        subtitle="Payment records issued by VIBECRAB OÜ — download any invoice as a print-ready PDF."
      />

      {/* ── Stats ── */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Invoices",   value: loading ? "—" : String(invoices.length), icon: FileText,     accent: "text-indigo-400",  bg: "bg-indigo-500/10"  },
          { label: "Total Revenue",    value: loading ? "—" : `€${totalRevenue.toFixed(2)}`, icon: CreditCard, accent: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Payments Settled", value: loading ? "—" : String(invoices.length), icon: CheckCircle2, accent: "text-sky-400",     bg: "bg-sky-500/10"     },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${s.bg} border border-slate-700`}>
              <s.icon size={16} className={s.accent} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Issuer card ── */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Issuing Company</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-indigo-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-200">VIBECRAB OÜ</span>
          </div>
          <div className="flex items-center gap-2">
            <Hash size={13} className="text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400">Registry: 17289453</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400">billing@iqpipe.io</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400">Harju maakond, Tallinn, Lasnamäe linnaosa, Sepapaja tn 6, 15551 · Estonia</span>
          </div>
        </div>
      </div>

      {/* ── Invoice table ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <span className="w-32">Invoice #</span>
          <span>Customer</span>
          <span className="hidden md:block w-28 text-right">Date</span>
          <span className="w-20 text-right">Amount</span>
          <span className="w-16 text-center">Status</span>
          <span className="w-28 text-right">Action</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading invoices…</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-rose-400">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
            <FileText size={32} className="text-slate-700" />
            <p className="text-sm">No invoices yet.</p>
            <p className="text-xs text-slate-600">Invoices are generated automatically from Stripe payments once connected.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/60">
            {invoices.map(inv => {
              const currencySymbol = inv.currency === "USD" ? "$" : inv.currency === "GBP" ? "£" : "€";
              return (
                <li
                  key={inv.id}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-4 items-center hover:bg-slate-800/30 transition-colors"
                >
                  {/* Invoice number */}
                  <div className="w-32">
                    <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      {inv.invoiceNumber}
                    </span>
                  </div>

                  {/* Customer */}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-200 truncate">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {inv.customerCompany && <span>{inv.customerCompany} · </span>}
                      {inv.customerEmail}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="hidden md:block w-28 text-right">
                    <span className="text-xs text-slate-400">{inv.dateFormatted}</span>
                  </div>

                  {/* Amount */}
                  <div className="w-20 text-right">
                    <span className="text-sm font-bold text-white">
                      {currencySymbol}{inv.amount.toFixed(2)}
                    </span>
                    <div className="text-[10px] text-slate-600">{inv.currency}</div>
                  </div>

                  {/* Status */}
                  <div className="w-16 flex justify-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase">
                      <CheckCircle2 size={9} /> Paid
                    </span>
                  </div>

                  {/* Download */}
                  <div className="w-28 flex justify-end">
                    <button
                      onClick={() => downloadInvoice(inv)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-all"
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {invoices.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <span className="text-[11px] text-slate-600">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
            <span className="text-[11px] text-slate-500">
              All invoices issued by <span className="text-slate-400 font-medium">VIBECRAB OÜ</span> · billing@iqpipe.io
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
