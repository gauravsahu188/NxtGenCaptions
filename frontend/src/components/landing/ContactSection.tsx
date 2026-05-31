"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Lightbulb, AlertCircle, Send } from 'lucide-react';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setSubmitted(true);
      setFormData({ email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('Error submitting contact form:', err);
      setError(err.message || 'Failed to send email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactOptions = [
    {
      icon: AlertCircle,
      title: "Report an Issue",
      description: "Bug, crash, or something not working? Let us know.",
    },
    {
      icon: Lightbulb,
      title: "Request a Feature",
      description: "Have an idea? We'd love to hear it and make it happen.",
    },
    {
      icon: MessageSquare,
      title: "General Inquiry",
      description: "Questions about pricing, plans, or anything else.",
    },
  ];

  return (
    <section className="w-full py-24 px-4 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
            Contact Us
          </h2>
          <p className="text-lg text-[var(--color-fg-muted)] max-w-2xl mx-auto">
            Have an issue or want to suggest a new feature? We&apos;re here to help.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {contactOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface)]/50 hover:bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] transition-all duration-300 cursor-pointer"
              onClick={() => {
                setFormData((prev) => ({ ...prev, subject: option.title }));
                document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center mb-3">
                <option.icon className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <h4 className="font-semibold text-white mb-1">{option.title}</h4>
              <p className="text-sm text-[var(--color-fg-muted)]">{option.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          id="contact-form"
        >
          {submitted ? (
            <div className="p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Email Sent Successfully!</h4>
              <p className="text-[var(--color-fg-muted)] mb-6">
                Your message has been sent to <span className="text-emerald-400 font-medium">nxtgencaptions@gmail.com</span>. We&apos;ll get back to you as soon as possible.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="py-2 px-6 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 active:scale-[0.98] transition-all duration-200 text-sm font-medium"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)]">
              {error && (
                <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-fg-muted)] mb-2">
                    Your Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-fg-muted)]" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-default)] text-white placeholder-[var(--color-fg-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-fg-muted)] mb-2">
                    Subject
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-default)] text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="Report an Issue">Report an Issue</option>
                    <option value="Request a Feature">Request a Feature</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-fg-muted)] mb-2">
                  Your Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your issue or idea in detail..."
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-default)] text-white placeholder-[var(--color-fg-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-xl bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-bright)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}