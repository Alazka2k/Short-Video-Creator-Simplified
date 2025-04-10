import { Metadata } from "next";
import CookiePolicyComponent from "@/components/marketing/legal/cookie-policy";

export const metadata: Metadata = {
  title: "Cookie Policy | Video Creator",
  description: "Cookie policy information for the Video Creator platform.",
};

export default function CookiePolicyPage() {
  return <CookiePolicyComponent />;
} 