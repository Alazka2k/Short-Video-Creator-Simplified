import { Metadata } from "next";
import CookiePolicyComponent from "@/components/marketing/legal/cookie-policy";

export const metadata: Metadata = {
  title: "Cookie Policy | Narravid",
  description: "Cookie policy information for the Narravid platform.",
};

export default function CookiePolicyPage() {
  return <CookiePolicyComponent />;
} 