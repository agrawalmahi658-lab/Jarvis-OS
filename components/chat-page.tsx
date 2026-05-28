"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Orb, type OrbState } from "@/components/orb";
import dynamic from "next/dynamic";

const Orb3D = dynamic(() => import("@/components/orb-3d").then(mod => mod.Orb3D), {
  ssr: false,
  loading: () => <Orb state="idle" size="md" />,
});
import { HudCorner } from "@/components/hud-corner";
import { ParticleBackground } from "@/components/particle-background";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, Send } from "lucide-react";
import { useWakeWord } from "@/hooks/use-wake-word";
import { useClapDetect } from "@/hooks/use-clap-detect";
import { useTTS } from "@/hooks/use-tts";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function useTime() {
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function HudStat({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[9px] tracking-widest">
      <span className={`w-1 h-1 rounded-full ${ok ? "bg-cyan-400" : "bg-red-400"}`} />
      <span className="text-cyan-700">{label}:</span>
      <span className={ok ? "text-cyan-400" : "text-red-400"}>{value}</span>
    </div>
  );
}

function HudBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-cyan-700 tracking-widest w-20 text-right">{label}</span>
      <div className="w-16 h-1 bg-cyan-950 relative">
        <div className="absolute inset-y-0 left-0 bg-cyan-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-cyan-500 tabular-nums">{pct}%</span>
    </div>
  );
}

export default function ChatPage() {
  const [userName, setUserName] = useState("Guest");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [orbState, setOrbState] = useState<OrbState>("idle");

  // Mic permission gate
  const [micEnabled, setMicEnabled] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [micLoading, setMicLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { speak, stop } = useTTS();
  const now = useTime();

  // Request mic permission (user gesture required)
  const enableMic = useCallback(async () => {
    setMicLoading(true);
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      setMicStream(stream);
      setMicEnabled(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("denied") || msg.includes("Permission")) {
        setMicError("Microphone access denied. Please allow in browser settings.");
      } else {
        setMicError("Could not access microphone: " + msg);
      }
    } finally {
      setMicLoading(false);
    }
  }, []);

  // Send message - uses AI SDK streaming
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    stop();
    const userMsg = text.trim();
    setInput("");

    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content: userMsg }]);
    setOrbState("thinking");

    const asstMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: asstMsgId, role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, { role: "user", content: userMsg }]
        }),
      });

      if (!response.body) throw new Error("No body");

      setOrbState("speaking");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Parse SSE format
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            // AI SDK text stream format
            try {
              const text = JSON.parse(line.slice(2));
              fullResponse += text;
              setMessages(prev =>
                prev.map(m =>
                  m.id === asstMsgId
                    ? { ...m, content: fullResponse }
                    : m
                )
              );
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      if (fullResponse.trim()) speak(fullResponse);
    } catch (err) {
      console.error(err);
      setMessages(prev =>
        prev.map(m =>
          m.id === asstMsgId
            ? { ...m, content: "I apologize, but I encountered an error. Please try again." }
            : m
        )
      );
    } finally {
      setOrbState("idle");
    }
  }, [messages, speak, stop]);

  // Wake word (only when mic enabled)
  const sendRef = useRef(sendMessage);
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  const { wakeState, liveTranscript, supported, forceActivate } = useWakeWord({
    enabled: micEnabled,
    onCommand: (t) => sendRef.current(t),
  });

  // Clap detection (reuses same stream)
  const { clapState } = useClapDetect({
    enabled: micEnabled,
    stream: micStream,
    onDoubleClap: forceActivate,
  });

  // Mirror wake state → orb
  useEffect(() => {
    if (wakeState === "activated" || wakeState === "listening") {
      setOrbState("listening");
    }
  }, [wakeState]);

  // Show live transcript in input
  useEffect(() => {
    if (liveTranscript) setInput(liveTranscript);
  }, [liveTranscript]);

  // Load user name from localStorage
  useEffect(() => {
    const name = localStorage.getItem("jarvis_user_name");
    if (name) setUserName(name);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isListening = wakeState === "activated" || wakeState === "listening";
  const isProcessing = orbState === "thinking" || orbState === "speaking";

  const timeStr = now?.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }) ?? "--:--:--";
  const dateStr = now
    ?.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    ?.toUpperCase() ?? "-- --- ----";

  return (
    <div className="h-screen w-full bg-[#020408] text-cyan-50 flex flex-col relative overflow-hidden font-mono select-none">
      <div className="hex-grid fixed inset-0 pointer-events-none z-0" />
      <ParticleBackground />

      {/* Scan line */}
      <motion.div
        className="fixed inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none z-[1]"
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Mic activation gate overlay */}
      <AnimatePresence>
        {!micEnabled && (
          <motion.div
            key="mic-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020408]/95 backdrop-blur-sm gap-8"
          >
            {/* Corner brackets on the gate */}
            <HudCorner position="tl" size={24} className="top-6 left-6" />
            <HudCorner position="tr" size={24} className="top-6 right-6" />
            <HudCorner position="bl" size={24} className="bottom-6 left-6" />
            <HudCorner position="br" size={24} className="bottom-6 right-6" />

            <div className="flex flex-col items-center gap-3 text-center">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Orb size="lg" state="idle" />
              </motion.div>
              <div className="text-[9px] tracking-[0.5em] text-cyan-600 uppercase mt-4">
                Stark A.I.
              </div>
              <h1 className="text-5xl font-light tracking-[0.6em] text-white hud-glow">
                JARVIS
              </h1>
              <p className="text-[10px] tracking-[0.3em] text-cyan-600 uppercase mt-2">
                Microphone access required for voice activation
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              {micError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-red-400 tracking-wider text-center px-4"
                >
                  {micError}
                </motion.p>
              )}

              <div className="relative w-full">
                <HudCorner position="tl" size={8} className="top-0 left-0" />
                <HudCorner position="br" size={8} className="bottom-0 right-0" />
                <Button
                  onClick={enableMic}
                  disabled={micLoading}
                  className="w-full bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-100 border border-cyan-500/40 hover:border-cyan-400 rounded-none tracking-[0.3em] uppercase font-mono text-sm h-14 transition-all duration-300"
                >
                  {micLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      {"Requesting access..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Mic size={16} />
                      Activate JARVIS Voice
                    </span>
                  )}
                </Button>
              </div>

              <Button
                variant="ghost"
                onClick={() => setMicEnabled(true)}
                className="text-cyan-800 hover:text-cyan-600 hover:bg-transparent text-[10px] tracking-widest uppercase font-mono"
              >
                {"Skip - use text only"}
              </Button>

              <p className="text-[9px] tracking-wider text-cyan-900 text-center px-6">
                {"Say \"JARVIS\" to activate - Double clap - or type below"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Header */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-5 pb-3 border-b border-cyan-500/10">
        {/* Left panel */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <div className="text-[9px] tracking-[0.25em] text-cyan-600 uppercase">System Time</div>
          <div className="text-lg tracking-widest text-cyan-300 tabular-nums">{timeStr}</div>
          <div className="text-[9px] tracking-[0.2em] text-cyan-700">{dateStr}</div>
          <div className="mt-2 flex flex-col gap-0.5">
            <HudStat label="NEURAL CORE" value="ACTIVE" ok />
            <HudStat label="MEMORY" value="SYNCED" ok />
            <HudStat
              label="VOICE"
              value={
                !micEnabled ? "DISABLED" :
                wakeState === "off" ? "OFF" :
                isListening ? "LISTENING" : "STANDBY"
              }
              ok={micEnabled && wakeState !== "off"}
            />
            <HudStat
              label="CLAP"
              value={
                clapState === "inactive" ? "OFF" :
                clapState === "clap1" ? "1x..." :
                clapState === "activated" ? "2x!" : "READY"
              }
              ok={clapState === "ready" || clapState === "clap1" || clapState === "activated"}
            />
          </div>
        </div>

        {/* Center orb */}
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="relative">
            <HudCorner position="tl" size={14} className="top-[-8px] left-[-8px]" />
            <HudCorner position="tr" size={14} className="top-[-8px] right-[-8px]" />
            <HudCorner position="bl" size={14} className="bottom-[-8px] left-[-8px]" />
            <HudCorner position="br" size={14} className="bottom-[-8px] right-[-8px]" />
            <Orb3D state={orbState} size={180} />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-[9px] tracking-[0.4em] text-cyan-600 uppercase">Stark A.I.</div>
            <h1 className="text-2xl font-light tracking-[0.5em] text-white hud-glow">JARVIS</h1>
            <div className="flex items-center gap-2 text-[9px] tracking-[0.3em] text-cyan-400 uppercase">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                orbState === "idle" ? "bg-cyan-400" :
                orbState === "listening" ? "bg-red-400" :
                orbState === "thinking" ? "bg-violet-400" : "bg-cyan-300"
              }`} />
              {orbState === "idle" ? "STANDBY" :
               orbState === "listening" ? "LISTENING" :
               orbState === "thinking" ? "PROCESSING" : "RESPONDING"}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-1 min-w-[160px] items-end">
          <div className="text-[9px] tracking-[0.25em] text-cyan-600 uppercase">Neural Status</div>
          <div className="flex flex-col gap-0.5 items-end mt-1">
            <HudBar label="COGNITION" pct={94} />
            <HudBar label="RESPONSE" pct={88} />
            <HudBar label="ACCURACY" pct={97} />
          </div>
          <div className="mt-2 text-[9px] tracking-widest text-cyan-700">
            USER: <span className="text-cyan-400">{userName.toUpperCase()}</span>
          </div>
          {micEnabled && (
            <button
              onClick={() => {
                micStream?.getTracks().forEach(t => t.stop());
                setMicEnabled(false);
                setMicStream(null);
              }}
              className="text-[9px] tracking-widest text-cyan-900 hover:text-cyan-600 transition-colors mt-1 uppercase"
            >
              Disable Voice
            </button>
          )}
        </div>
      </div>

      {/* Empty state - Animated JARVIS greeting */}
      {messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 gap-6"
        >
          {/* Main greeting with typewriter effect */}
          <div className="flex flex-col items-center gap-4">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="text-2xl md:text-3xl font-sans font-light text-cyan-100 tracking-wide text-center"
              style={{
                textShadow: "0 0 30px rgba(0, 212, 255, 0.4), 0 0 60px rgba(0, 212, 255, 0.2)"
              }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                Hello.
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.6 }}
              >
                {" "}This is{" "}
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.0, duration: 0.8, ease: "easeOut" }}
                className="text-cyan-300 font-normal tracking-[0.15em]"
                style={{
                  textShadow: "0 0 40px rgba(0, 212, 255, 0.6), 0 0 80px rgba(0, 212, 255, 0.3)"
                }}
              >
                JARVIIS
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.8, duration: 0.6 }}
              >
                .
              </motion.span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.4, duration: 0.8, ease: "easeOut" }}
              className="text-xl md:text-2xl font-sans font-light text-cyan-200/90 tracking-wide text-center"
              style={{
                textShadow: "0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.15)"
              }}
            >
              How may I help you today?
            </motion.p>
          </div>

          {/* Subtle glowing line separator */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 4.2, duration: 1, ease: "easeOut" }}
            className="w-48 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
            style={{
              boxShadow: "0 0 10px rgba(0, 212, 255, 0.4)"
            }}
          />

          {/* Instructions with fade in */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.8, duration: 1 }}
            className="text-[10px] tracking-[0.4em] text-cyan-600 uppercase"
          >
            {micEnabled && supported
              ? "Say \"JARVIS\" - Double clap - or type"
              : "Type a command below"}
          </motion.p>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 md:px-16 lg:px-32 pb-40 z-10 no-scrollbar">
        <div className="max-w-3xl mx-auto flex flex-col gap-5 pt-5">
          {messages.map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start gap-3"}`}
            >
              {m.role === "assistant" && (
                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full border border-cyan-500/40 bg-cyan-950/30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 6px #00D4FF" }} />
                </div>
              )}
              <div className={`relative px-5 py-3 max-w-[80%] leading-relaxed text-sm font-sans ${
                m.role === "user"
                  ? "hud-bubble-user rounded-2xl rounded-tr-none text-cyan-50"
                  : "hud-bubble-asst rounded-2xl rounded-tl-none text-cyan-100"
              }`}>
                {m.role === "assistant" && (
                  <>
                    <HudCorner position="tl" size={8} className="top-0 left-0" />
                    <HudCorner position="br" size={8} className="bottom-0 right-0" />
                  </>
                )}
                {m.content || (
                  <span className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
                      />
                    ))}
                  </span>
                )}
                {m.role === "assistant" && orbState === "speaking" && idx === messages.length - 1 && (
                  <div className="mt-2 flex gap-0.5 items-end h-3">
                    {[1, 2, 3, 4, 5, 4, 3].map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-cyan-400 rounded-full"
                        animate={{ height: [`${h * 10}%`, "100%", `${h * 10}%`] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-[#020408] via-[#020408]/95 to-transparent px-6 pb-5 pt-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          {/* Status line */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 text-[10px] tracking-widest text-red-400"
              >
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                VOICE COMMAND ACTIVE
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input bar */}
          <div className="relative hud-input-bar rounded-sm">
            <HudCorner position="tl" size={10} className="top-0 left-0" />
            <HudCorner position="br" size={10} className="bottom-0 right-0" />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type a command..."}
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none text-cyan-100 placeholder:text-cyan-800 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm tracking-wider"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isProcessing}
                className="bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/30 rounded-sm text-cyan-300 hover:text-cyan-100 transition-all"
              >
                <Send size={16} />
              </Button>
            </form>
          </div>

          <p className="text-center text-[8px] tracking-[0.3em] text-cyan-900 uppercase">
            J.A.R.V.I.S. - Just A Rather Very Intelligent System
          </p>
        </div>
      </div>
    </div>
  );
}
