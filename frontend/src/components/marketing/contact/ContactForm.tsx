"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

// Define the form schema with validation rules
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(data: FormValues) {
    if (!acceptedPrivacy) {
      toast({
        title: "Please accept the privacy policy",
        description: "You need to agree to our privacy policy before sending the message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }
      
      // Success handling
      setFormSubmitted(true);
      form.reset();
      toast({
        title: "Message sent!",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Your message couldn't be sent. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="bg-black/90 backdrop-blur-sm border border-zinc-800 rounded-xl shadow-lg p-8 md:p-10 relative z-10">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="text-sm text-zinc-400 mb-1 block">Full Name</label>
              <Input
                id="name"
                placeholder="Full Name"
                {...form.register("name")}
                className="h-12 bg-zinc-900/70 border-zinc-700 focus:border-primary placeholder:text-zinc-500"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="text-sm text-zinc-400 mb-1 block">Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                {...form.register("email")}
                className="h-12 bg-zinc-900/70 border-zinc-700 focus:border-primary placeholder:text-zinc-500"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="message" className="text-sm text-zinc-400 mb-1 block">Message</label>
              <Textarea
                id="message"
                placeholder="Enter your main text here..."
                className="min-h-[150px] bg-zinc-900/70 border-zinc-700 focus:border-primary placeholder:text-zinc-500 resize-none"
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.message.message}</p>
              )}
              <div className="text-right text-zinc-500 text-xs mt-1">
                {form.watch("message")?.length || 0}/300
              </div>
            </div>
            
            <div 
              className="flex items-center gap-3 py-2 cursor-pointer"
              onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                acceptedPrivacy 
                  ? 'bg-primary border border-primary' 
                  : 'border border-zinc-600 bg-zinc-900/50'
              }`}>
                {acceptedPrivacy && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm text-zinc-300">
                I hereby agree to our <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> terms.
              </span>
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 mt-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-md flex items-center justify-center gap-2 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Form"}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </div>
        
        {/* Gradient border */}
        <div className="absolute inset-0 -z-10 rounded-xl">
          <div className="absolute inset-[-2px] rounded-xl">
            <HoverBorderGradient
              as="div"
              containerClassName="w-full h-full"
              className="bg-transparent"
              duration={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 