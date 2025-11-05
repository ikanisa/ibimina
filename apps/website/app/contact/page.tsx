"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, Clock, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    sacco: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Integrate with actual form submission endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("Form submitted:", formData);
    setLoading(false);
    setSubmitted(true);

    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", sacco: "", message: "" });
      setSubmitted(false);
    }, 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 leading-tight">
            Contact Us
          </h1>
          <p className="text-xl text-neutral-700 leading-relaxed max-w-2xl mx-auto">
            Get in touch with the SACCO+ team. We're here to help with your questions.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={24} className="text-neutral-900" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-neutral-900 mb-2">Email</h3>
                  <a
                    href="mailto:info@saccoplus.rw"
                    className="text-brand-blue hover:text-brand-blue-dark transition-colors"
                  >
                    info@saccoplus.rw
                  </a>
                  <p className="text-sm text-neutral-700 mt-2">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-neutral-900 mb-2">Phone / WhatsApp</h3>
                  <a
                    href="tel:+250788000000"
                    className="text-brand-blue hover:text-brand-blue-dark transition-colors"
                  >
                    +250 788 000 000
                  </a>
                  <p className="text-sm text-neutral-700 mt-2">Mon-Fri: 8AM - 5PM (CAT)</p>
                </div>
              </div>
            </div>

            {/* Office */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-neutral-900 mb-2">Office</h3>
                  <p className="text-neutral-700">
                    KG 7 Ave, Kigali
                    <br />
                    Rwanda
                  </p>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-neutral-700" />
                <h3 className="font-bold text-lg text-neutral-900">Help Hours</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-neutral-700">
                  <span>Monday - Friday</span>
                  <span className="font-medium">8:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Saturday</span>
                  <span className="font-medium">9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Sunday</span>
                  <span className="font-medium">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-neutral-200 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Send Us a Message</h2>

              {submitted ? (
                <div className="bg-success-50 border border-success-200 rounded-xl p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900">Message Sent!</h3>
                  <p className="text-neutral-700">
                    We've received your message and will get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-neutral-900 mb-2"
                    >
                      Full Name <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Mukamana Aline"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-neutral-900 mb-2"
                    >
                      Email <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="aline@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-neutral-900 mb-2"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="+250 788 123 456"
                    />
                  </div>

                  {/* SACCO */}
                  <div>
                    <label
                      htmlFor="sacco"
                      className="block text-sm font-semibold text-neutral-900 mb-2"
                    >
                      SACCO Name (if applicable)
                    </label>
                    <input
                      type="text"
                      id="sacco"
                      name="sacco"
                      value={formData.sacco}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Gasabo Umurenge SACCO"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-neutral-900 mb-2"
                    >
                      Message <span className="text-error-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
