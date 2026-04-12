import { useState } from "react";
import type { ContactFormData } from "@/types";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ContactForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState<ContactFormData>({
    first_name: "",
    last_name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  function update(field: keyof ContactFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to send");

      setStatus("success");
      setForm({ first_name: "", last_name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  const inputClass = "bg-white border-[1.5px] border-bdl rounded-[10px] py-3 px-4 text-ink text-[0.9rem] font-sans outline-none w-full transition-all placeholder:text-faint focus:border-cyan-2 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)]";

  return (
    <div className="bg-light-2 border border-bdl rounded-[20px] p-10 max-[580px]:p-7 max-[580px]:px-5">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4 max-[580px]:grid-cols-1">
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[0.71rem] font-bold text-muted tracking-[0.3px] uppercase">{t.contactForm.firstName}</label>
            <input type="text" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} placeholder={t.contactForm.firstNamePlaceholder} required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-[0.71rem] font-bold text-muted tracking-[0.3px] uppercase">{t.contactForm.lastName}</label>
            <input type="text" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} placeholder={t.contactForm.lastNamePlaceholder} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[0.71rem] font-bold text-muted tracking-[0.3px] uppercase">{t.contactForm.email}</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder={t.contactForm.emailPlaceholder} required className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[0.71rem] font-bold text-muted tracking-[0.3px] uppercase">{t.contactForm.subject}</label>
          <input type="text" value={form.subject} onChange={(e) => update("subject", e.target.value)} placeholder={t.contactForm.subjectPlaceholder} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[0.71rem] font-bold text-muted tracking-[0.3px] uppercase">{t.contactForm.message}</label>
          <textarea value={form.message} onChange={(e) => update("message", e.target.value)} placeholder={t.contactForm.messagePlaceholder} required className={`${inputClass} resize-y min-h-[110px]`} />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full py-3.5 bg-ink text-white border-none rounded-[10px] font-bold text-[0.92rem] cursor-pointer font-sans transition-all hover:bg-dark-2 hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "sending" ? t.contactForm.sending : `${t.contactForm.send} \u2192`}
        </button>

        {status === "success" && (
          <p className="text-green text-sm mt-4 text-center font-medium">{t.contactForm.success}</p>
        )}
        {status === "error" && (
          <p className="text-red text-sm mt-4 text-center font-medium">{t.contactForm.error}</p>
        )}
      </form>
    </div>
  );
}
