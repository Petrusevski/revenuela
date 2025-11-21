import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b border-slate-900 bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              Last updated: November 2025
            </p>

            <div className="space-y-6 text-sm text-slate-300">
              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  1. Overview
                </h2>
                <p>
                  This Privacy Policy explains how Revenuela (&quot;we&quot;,
                  &quot;us&quot;, &quot;our&quot;) collects, uses and protects
                  personal data when you use our website, app and services.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  2. Data we process
                </h2>
                <p className="mb-2">
                  We process two main categories of data:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <span className="font-medium">Account and billing data:</span>{" "}
                    name, email address, company details and billing information
                    you provide when creating an account or subscribing.
                  </li>
                  <li>
                    <span className="font-medium">GTM tool data:</span> events
                    and identifiers sent from tools you connect (e.g. Clay,
                    outbound tools, CRM, billing). We focus on business context
                    rather than sensitive personal information.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  3. How we use data
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>To provide and improve the Revenuela application.</li>
                  <li>
                    To secure and monitor the performance of our infrastructure.
                  </li>
                  <li>
                    To communicate with you about product updates, support and
                    billing.
                  </li>
                  <li>
                    To generate aggregated and anonymised analytics about how
                    GTM stacks perform (never to re-identify individuals).
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  4. Legal basis (EU/EEA)
                </h2>
                <p>
                  Where GDPR applies, we process personal data based on one or
                  more of the following legal bases: performance of a contract,
                  legitimate interests (e.g. product security, analytics),
                  compliance with legal obligations, and your consent where
                  required (e.g. certain marketing).
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  5. Data sharing & processors
                </h2>
                <p className="mb-2">
                  We may share data with trusted service providers who help us
                  operate Revenuela (e.g. hosting, email delivery, analytics).
                  These providers act as processors and only process data
                  according to our instructions.
                </p>
                <p>
                  We do not sell your personal data and we do not share GTM tool
                  data with third parties for their own marketing purposes.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  6. Data retention
                </h2>
                <p>
                  We retain account data for as long as your account is active
                  and for a reasonable period afterwards as required for
                  accounting, legal or security purposes. GTM tool data can be
                  configured per workspace, and you can request deletion at any
                  time.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  7. Your rights
                </h2>
                <p className="mb-2">
                  Depending on your jurisdiction, you may have rights to:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Access the personal data we hold about you.</li>
                  <li>Request correction or deletion of your data.</li>
                  <li>Restrict or object to certain processing.</li>
                  <li>Request data portability.</li>
                  <li>Withdraw consent where processing is based on consent.</li>
                </ul>
                <p className="mt-2">
                  To exercise these rights, contact us at{" "}
                  <a
                    href="mailto:hello@revenuela.com"
                    className="text-cyan-300 underline underline-offset-4"
                  >
                    hello@revenuela.com
                  </a>
                  .
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  8. International transfers
                </h2>
                <p>
                  Where data is transferred outside the EU/EEA, we use
                  appropriate safeguards such as Standard Contractual Clauses or
                  equivalent mechanisms, where required by applicable law.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  9. Updates
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. We will
                  post the updated version on this page and change the &quot;Last
                  updated&quot; date above.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  10. Contact
                </h2>
                <p>
                  For questions about this Policy or how we handle data, email
                  us at{" "}
                  <a
                    href="mailto:hello@revenuela.com"
                    className="text-cyan-300 underline underline-offset-4"
                  >
                    hello@revenuela.com
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
