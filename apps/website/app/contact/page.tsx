"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sacco: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with actual form submission endpoint
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", sacco: "", message: "" });
      setSubmitted(false);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-16 pb-16">
      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-bold">Contact Us</h1>
        <p className="text-xl text-neutral-600">
          Get in touch with the SACCO+ team. We&apos;re here to help.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center flex-shrink-0">
                <Mail size={24} className="text-neutral-900" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Email</h3>
                <a
                  href="mailto:info@saccoplus.rw"
                  className="text-neutral-600 hover:text-brand-yellow transition-colors"
                >
                  info@saccoplus.rw
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-blue rounded-full flex items-center justify-center flex-shrink-0">
                <Phone size={24} className="text-neutral-900" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Phone / WhatsApp</h3>
                <a
                  href="tel:+250788000000"
                  className="text-neutral-600 hover:text-brand-yellow transition-colors"
                >
                  +250 788 000 000
                </a>
                <p className="text-sm opacity-80 mt-1">Mon-Fri: 8AM - 5PM (CAT)</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Office</h3>
                <p className="text-neutral-600">
                  KG 7 Ave, Kigali
                  <br />
                  Rwanda
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-3">Help Hours</h3>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span>8:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span>9:00 AM - 1:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-neutral-200 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>

          {submitted ? (
            <div className="bg-brand-green/20 border-2 border-rwgreen rounded-lg p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto">
                <Send size={32} />
              </div>
              <h3 className="text-xl font-bold">Message Sent!</h3>
              <p className="text-neutral-600">We&apos;ll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Full Name <span className="text-brand-yellow">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-rwyellow"
                  placeholder="Mukamana Aline"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Email <span className="text-brand-yellow">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-rwyellow"
                  placeholder="aline@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-rwyellow"
                  placeholder="+250 788 123 456"
                />
              </div>

              <div>
                <label htmlFor="sacco" className="block text-sm font-semibold mb-2">
                  SACCO Name (if applicable)
                </label>
                <input
                  type="text"
                  id="sacco"
                  name="sacco"
                  value={formData.sacco}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-rwyellow"
                  placeholder="Gasabo Umurenge SACCO"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2">
                  Message <span className="text-brand-yellow">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-rwyellow resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <button
                type="submit"
                className="w-full glass px-6 py-4 font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
