import { Metadata } from "next";
import ContactForm from "@/components/marketing/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Narravid",
  description: "Get in touch with our team.",
};

export default function ContactPage() {
  return (
    <div className="relative min-h-[calc(100vh-16rem)] overflow-hidden py-12 md:py-24">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              Contact Us
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Let's Get In Touch.</h1>
            <p className="text-xl text-muted-foreground">
              Or just reach out manually to <a href="mailto:contact@narravid.io" className="text-primary hover:underline">contact@narravid.io</a>.
            </p>
          </div>
          
          <ContactForm />
        </div>
      </div>
    </div>
  );
} 