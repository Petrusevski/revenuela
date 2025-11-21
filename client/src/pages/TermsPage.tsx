import Header from "../components/Header";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="border-b border-slate-900 bg-slate-950">
          <div className="mx-auto max-w-4xl px-4 pt-10 pb-12 md:pt-14 md:pb-16">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-4">
              Terms of Use
            </h1>
            <p className="text-sm text-slate-400 mb-8">
              Last updated: November 2025
            </p>

            <div className="space-y-6 text-sm text-slate-300">
              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  1. Acceptance of terms
                </h2>
                <p>
                  By creating an account, accessing or using Revenuela, you
                  agree to be bound by these Terms of Use. If you do not agree,
                  you may not use the service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  2. The service
                </h2>
                <p>
                  Revenuela provides a revenue analytics and GTM data platform
                  that connects to tools you choose to integrate. We may update
                  or modify the service over time, including adding or removing
                  features.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  3. Accounts & workspaces
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    You are responsible for maintaining the confidentiality of
                    your login credentials.
                  </li>
                  <li>
                    You are responsible for activities that occur under your
                    account and workspaces.
                  </li>
                  <li>
                    You must ensure that all information you provide is accurate
                    and kept up to date.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  4. Customer data & connected tools
                </h2>
                <p className="mb-2">
                  You retain all rights to the data you send to Revenuela from
                  connected tools (&quot;Customer Data&quot;). You grant us a
                  limited license to process Customer Data solely:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>To provide, secure and improve the service.</li>
                  <li>To comply with legal obligations where applicable.</li>
                </ul>
                <p className="mt-2">
                  You are responsible for ensuring that you have the right to
                  connect third-party tools and share data with Revenuela in
                  accordance with their terms and applicable laws.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  5. Acceptable use
                </h2>
                <p className="mb-2">You agree not to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    Use Revenuela for unlawful, harmful or fraudulent purposes.
                  </li>
                  <li>
                    Attempt to reverse engineer, interfere with or disrupt the
                    service or infrastructure.
                  </li>
                  <li>
                    Misrepresent your identity or affiliation when using the
                    service.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  6. Subscriptions, fees & cancellation
                </h2>
                <p>
                  Access to paid plans may be subject to subscription fees as
                  described on our pricing page or in a separate order form.
                  Unless otherwise agreed, subscriptions renew automatically
                  until cancelled. You can cancel at any time, with access
                  continuing until the end of the current billing period.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  7. Disclaimer & limitation of liability
                </h2>
                <p className="mb-2">
                  Revenuela is provided on an &quot;as is&quot; and &quot;as
                  available&quot; basis. We do not guarantee that the service
                  will be uninterrupted or error-free.
                </p>
                <p>
                  To the maximum extent permitted by law, Revenuela and its
                  affiliates will not be liable for indirect, incidental or
                  consequential damages, or for any loss of profits, revenue or
                  data arising from your use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  8. Changes to these terms
                </h2>
                <p>
                  We may update these Terms from time to time. If changes are
                  material, we will provide notice (for example by email or in
                  the app). Continued use of the service after changes take
                  effect constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-2">
                  9. Contact
                </h2>
                <p>
                  If you have questions about these Terms, contact us at{" "}
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
