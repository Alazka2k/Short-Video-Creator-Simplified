import { Metadata } from "next";
import TermsOfServiceComponent from "@/components/marketing/legal/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service | Video Creator",
  description: "Terms of service and user agreement for the Video Creator platform.",
};

export default function TermsOfServicePage() {
  return <TermsOfServiceComponent />;
} 