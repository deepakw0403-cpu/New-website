import { useState } from "react";
import { MapPin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { createEnquiry } from "../lib/api";

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await createEnquiry(form);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
    } catch (err) {
      toast.error("Failed to send message. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <main className="pt-20" data-testid="contact-page">
      {/* Hero */}
      <section className="py-24 lg:py-32 bg-neutral-50">
        <div className="container-main">
          <div className="max-w-3xl">
            <p className="subheading mb-4">Get in Touch</p>
            <h1 className="text-5xl md:text-6xl font-serif font-medium leading-tight mb-6">
              Contact Us
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Have questions about our fabrics or need help with sourcing? Our team is here to assist you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="section-gap">
        <div className="container-main">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Form */}
            <div data-testid="contact-form-section">
              <h2 className="text-2xl font-serif font-medium mb-8">Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none"
                      required
                      data-testid="contact-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none"
                      required
                      data-testid="contact-email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none"
                      data-testid="contact-phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none"
                      data-testid="contact-company"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-sm focus:border-neutral-900 focus:outline-none h-40 resize-none"
                    placeholder="Tell us how we can help..."
                    required
                    data-testid="contact-message"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50"
                  data-testid="contact-submit-btn"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div data-testid="contact-info-section">
              <h2 className="text-2xl font-serif font-medium mb-8">Contact Information</h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <Mail size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <p className="text-neutral-600">hello@locofast.com</p>
                    <p className="text-neutral-600">sourcing@locofast.com</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <Phone size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Phone</h3>
                    <p className="text-neutral-600">+91 98765 43210</p>
                    <p className="text-neutral-500 text-sm">Mon - Fri, 9am - 6pm IST</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Office</h3>
                    <p className="text-neutral-600">
                      123 Textile Hub, Koramangala<br />
                      Bengaluru, Karnataka 560034<br />
                      India
                    </p>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div className="mt-12 aspect-video bg-neutral-100 flex items-center justify-center">
                <p className="text-neutral-400">Map location</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
