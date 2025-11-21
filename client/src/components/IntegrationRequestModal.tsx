import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Loader2, Zap } from "lucide-react";

interface IntegrationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IntegrationRequestModal({
  isOpen,
  onClose,
}: IntegrationRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset and close after delay
    setTimeout(() => {
      onClose();
      setTimeout(() => setIsSuccess(false), 300); // Wait for close anim to finish before resetting state
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors z-10"
              >
                <X size={20} />
              </button>

              {!isSuccess ? (
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                  <div className="mb-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                      <Zap size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-50">
                      Request an Integration
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Don't see your tool? Tell us what you need, and we'll
                      prioritize it.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Tool Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Marketo, Outreach, Pipedrive..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Official Website
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Your Email (for updates)
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="you@company.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-8 bg-slate-50 text-slate-950 font-semibold h-10 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Request"
                    )}
                  </button>
                </form>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center h-[420px]">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }} // <--- FIXED HERE
                    className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20"
                  >
                    <CheckCircle2 size={32} />
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-50 mb-2">
                    Request Received!
                  </h3>
                  <p className="text-slate-400 text-sm max-w-[200px]">
                    Thanks for the suggestion. We've added this to our roadmap
                    voting board.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}