import type { Metadata } from "next";

import { ChatScreen } from "@/components/insights/chat/chat-screen";

export const metadata: Metadata = { title: "AI chat" };

export default function Page() {
  return <ChatScreen />;
}
