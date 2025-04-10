import { Metadata } from "next";
import ImprintComponent from "@/components/marketing/legal/imprint";

export const metadata: Metadata = {
  title: "Imprint | Video Creator",
  description: "Legal imprint information for the Video Creator platform.",
};

export default function ImprintPage() {
  return <ImprintComponent />;
} 