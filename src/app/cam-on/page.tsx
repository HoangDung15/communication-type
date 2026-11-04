import type { Metadata } from "next";
import { ThanksContent } from "@/components/ThanksContent";

export const metadata: Metadata = { title: "Cảm ơn bạn | BETTER TALK, BETTER WORK" };

export default function ThanksPage() {
  return <ThanksContent />;
}
