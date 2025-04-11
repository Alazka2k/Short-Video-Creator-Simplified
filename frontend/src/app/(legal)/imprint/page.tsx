import { Metadata } from "next";
import ImprintComponent from "@/components/marketing/legal/imprint";

export const metadata: Metadata = {
  title: "Imprint | Narravid",
  description: "Legal imprint information for the Narravid platform.",
};

export default function ImprintPage() {
  return <ImprintComponent />;
} 