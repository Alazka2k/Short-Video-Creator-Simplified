import { Metadata } from "next";
import PrivacyPolicyComponent from "@/components/marketing/legal/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Video Creator",
  description: "Privacy policy information for the Video Creator platform.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyComponent />;
} 