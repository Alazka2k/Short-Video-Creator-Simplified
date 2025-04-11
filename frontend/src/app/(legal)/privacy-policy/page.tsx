import { Metadata } from "next";
import PrivacyPolicyComponent from "@/components/marketing/legal/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Narravid",
  description: "Privacy policy information for the Narravid platform.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyComponent />;
} 