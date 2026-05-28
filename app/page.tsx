"use client";

import { useState } from "react";
import { StartupSequence } from "@/components/startup-sequence";
import ChatPage from "@/components/chat-page";

export default function Page() {
  const [showStartup, setShowStartup] = useState(true);

  return (
    <>
      {showStartup && <StartupSequence onComplete={() => setShowStartup(false)} />}
      <ChatPage />
    </>
  );
}
