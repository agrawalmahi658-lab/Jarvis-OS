"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StartupSequenceProps {
  onComplete: () => void;
}

// Deep space floating particle
function DeepSpaceParticle({ 
  delay, 
  x, 
  y, 
  size,
  color = "cyan"
}: { 
  delay: number; 
  x: number; 
  y: number;
  size: number;
  color?: "cyan" | "white" | "blue";
}) {
  const colors = {
    cyan: "rgba(0, 212, 255, 0.6)",
    white: "rgba(255, 255, 255, 0.4)",
    blue: "rgba(100, 180, 255, 0.5)",
  };
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: `radial-gradient(circle, ${colors[color]} 0%, transparent 70%)`,
        filter: "blur(0.5px)",
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0.4, 0.8, 0],
        scale: [0.3, 1, 0.7, 1, 0.3],
        y: [0, -20, -40, -60, -100],
        x: [0, Math.random() * 30 - 15, Math.random() * 40 - 20, Math.random() * 30 - 15, 0],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Holographic ring with gradient
function HoloRing({ 
  size, 
  delay, 
  duration,
  thickness = 1,
  opacity = 0.3,
  reverse = false,
  gradient = false,
}: { 
  size: number; 
  delay: number; 
  duration: number;
  thickness?: number;
  opacity?: number;
  reverse?: boolean;
  gradient?: boolean;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        border: gradient ? "none" : `${thickness}px solid rgba(0, 212, 255, ${opacity})`,
        background: gradient 
          ? `conic-gradient(from 0deg, transparent 0deg, rgba(0, 212, 255, ${opacity}) 60deg, transparent 120deg, rgba(0, 212, 255, ${opacity * 0.5}) 180deg, transparent 240deg, rgba(0, 212, 255, ${opacity * 0.7}) 300deg, transparent 360deg)`
          : "none",
        boxShadow: `0 0 ${20 + size * 0.05}px rgba(0, 212, 255, ${opacity * 0.4}), inset 0 0 ${15 + size * 0.03}px rgba(0, 212, 255, ${opacity * 0.2})`,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, scale: 0, rotateX: 80 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotateX: 80,
        rotateZ: reverse ? -360 : 360,
      }}
      transition={{
        opacity: { duration: 1.5, delay },
        scale: { duration: 2, delay, ease: [0.34, 1.56, 0.64, 1] },
        rotateZ: { duration, repeat: Infinity, ease: "linear", delay: delay + 1.5 },
      }}
    />
  );
}

// Energy arc segment
function EnergyArc({ 
  size, 
  rotation, 
  delay,
  arcLength = 90,
  pulseDelay = 0,
}: { 
  size: number; 
  rotation: number; 
  delay: number;
  arcLength?: number;
  pulseDelay?: number;
}) {
  const circumference = 2 * Math.PI * ((size / 2) - 2);
  
  return (
    <motion.div
      className="absolute"
      style={{
        width: size,
        height: size,
      }}
      initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
      animate={{ 
        opacity: [0, 1, 1],
        scale: 1,
        rotate: rotation,
      }}
      transition={{ 
        opacity: { duration: 1, delay, times: [0, 0.5, 1] },
        scale: { duration: 1.5, delay, ease: "easeOut" },
      }}
    >
      <motion.svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear", delay: delay + 1 }}
      >
        <defs>
          <linearGradient id={`energyArc-${rotation}-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 212, 255, 0)" />
            <stop offset="20%" stopColor="rgba(0, 212, 255, 0.3)" />
            <stop offset="50%" stopColor="rgba(0, 212, 255, 1)" />
            <stop offset="80%" stopColor="rgba(0, 212, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 212, 255, 0)" />
          </linearGradient>
          <filter id={`glow-${rotation}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) - 2}
          fill="none"
          stroke={`url(#energyArc-${rotation}-${size})`}
          strokeWidth="2"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeLinecap="round"
          filter={`url(#glow-${rotation})`}
          animate={{
            strokeDashoffset: [0, -circumference],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
            delay: pulseDelay,
          }}
        />
      </motion.svg>
    </motion.div>
  );
}

// Data stream line
function DataStream({ delay, position }: { delay: number; position: "left" | "right" }) {
  const isLeft = position === "left";
  
  return (
    <motion.div
      className="absolute h-full w-px"
      style={{
        left: isLeft ? "15%" : "auto",
        right: isLeft ? "auto" : "15%",
        background: "linear-gradient(to bottom, transparent 0%, rgba(0, 212, 255, 0.3) 20%, rgba(0, 212, 255, 0.1) 80%, transparent 100%)",
      }}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 2, delay, ease: "easeOut" }}
    >
      {/* Traveling pulse */}
      <motion.div
        className="absolute w-1 h-16"
        style={{
          left: "-1px",
          background: "linear-gradient(to bottom, transparent, rgba(0, 212, 255, 0.8), transparent)",
          filter: "blur(1px)",
        }}
        animate={{ top: ["-10%", "110%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: delay + 1 }}
      />
    </motion.div>
  );
}

export function StartupSequence({ onComplete }: StartupSequenceProps) {
  const [phase, setPhase] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [systemText, setSystemText] = useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const audioRef = useRef<AudioContext | null>(null);

  const systemMessages = [
    "QUANTUM CORE INITIALIZING",
    "NEURAL PATHWAYS ACTIVATING",
    "HOLOGRAPHIC INTERFACE LOADING",
    "VOICE SYNTHESIS CALIBRATING",
    "COGNITIVE ENGINE ONLINE",
    "J.A.R.V.I.S. READY",
  ];

  // Play subtle startup sound
  const playStartupTone = useCallback((frequency: number, duration: number, delay: number = 0) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = frequency;
      osc.type = "sine";
      
      const startTime = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.03, startTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Audio not supported
    }
  }, []);

  // Typewriter effect
  const typeText = useCallback((text: string, onComplete?: () => void) => {
    let index = 0;
    setSystemText("");
    const interval = setInterval(() => {
      if (index < text.length) {
        setSystemText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 25);
    return () => clearInterval(interval);
  }, []);

  // Phase progression
  useEffect(() => {
    // Phase 0: Pure black void (0-1.5s)
    // Phase 1: Single spark appears (1.5-3s)
    // Phase 2: Spark expands, particles converge (3-5s)
    // Phase 3: Orb forms with inner glow (5-7s)
    // Phase 4: Holographic rings deploy (7-9s)
    // Phase 5: Full HUD elements + loading (9-13s)
    // Phase 6: Final sequence + fade (13-15s)

    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => { setPhase(1); playStartupTone(220, 0.5); }, 1500));
    timers.push(setTimeout(() => { setPhase(2); playStartupTone(330, 0.8); }, 3000));
    timers.push(setTimeout(() => { setPhase(3); playStartupTone(440, 1); }, 5000));
    timers.push(setTimeout(() => { setPhase(4); playStartupTone(550, 0.6); }, 7000));
    timers.push(setTimeout(() => { setPhase(5); playStartupTone(660, 0.4); }, 9000));
    timers.push(setTimeout(() => { setPhase(6); playStartupTone(880, 1.5); }, 13500));
    timers.push(setTimeout(() => onComplete(), 15500));

    return () => timers.forEach(clearTimeout);
  }, [onComplete, playStartupTone]);

  // Loading progress
  useEffect(() => {
    if (phase >= 5 && phase < 6) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const increment = Math.random() * 3 + 1;
          return Math.min(prev + increment, 100);
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // System messages
  useEffect(() => {
    if (phase === 5) {
      let msgIndex = 0;
      const showNextMessage = () => {
        if (msgIndex < systemMessages.length) {
          setCurrentMessageIndex(msgIndex);
          typeText(systemMessages[msgIndex], () => {
            msgIndex++;
            if (msgIndex < systemMessages.length) {
              setTimeout(showNextMessage, 300);
            }
          });
        }
      };
      setTimeout(showNextMessage, 500);
    }
  }, [phase, typeText]);

  // Generate ambient particles
  const ambientParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 50 + Math.random() * 50,
    delay: Math.random() * 8,
    size: 1 + Math.random() * 3,
    color: (["cyan", "white", "blue"] as const)[Math.floor(Math.random() * 3)],
  }));

  // Formation particles (converge to center)
  const formationParticles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 24;
    const distance = 300 + Math.random() * 100;
    return {
      id: i,
      startX: Math.cos(angle) * distance,
      startY: Math.sin(angle) * distance,
      delay: i * 0.04,
    };
  });

  return (
    <AnimatePresence>
      {phase < 6 ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ background: "#000000" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Deep space background gradient */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0, 30, 60, 0.4) 0%, rgba(0, 10, 20, 0.2) 40%, rgba(0, 0, 0, 1) 70%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 3 }}
          />

          {/* Subtle vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.6) 100%)",
            }}
          />

          {/* Data streams */}
          {phase >= 4 && (
            <>
              <DataStream delay={0} position="left" />
              <DataStream delay={0.3} position="right" />
            </>
          )}

          {/* Ambient floating particles */}
          {phase >= 3 && ambientParticles.map((p) => (
            <DeepSpaceParticle key={p.id} {...p} />
          ))}

          {/* Phase 1: Initial spark in the void */}
          <AnimatePresence>
            {phase >= 1 && phase < 3 && (
              <motion.div
                className="absolute"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1,
                  scale: [0, 2, 1.5, 2, 1.5],
                }}
                exit={{ opacity: 0, scale: 3 }}
                transition={{ 
                  duration: 1.5,
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    background: "#00D4FF",
                    boxShadow: "0 0 20px 5px #00D4FF, 0 0 40px 10px rgba(0, 212, 255, 0.6), 0 0 80px 20px rgba(0, 212, 255, 0.3), 0 0 120px 30px rgba(0, 212, 255, 0.1)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: Particles converging */}
          {phase >= 2 && phase < 4 && (
            <div className="absolute">
              {formationParticles.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full"
                  style={{
                    width: 3,
                    height: 3,
                    background: "#00D4FF",
                    boxShadow: "0 0 10px #00D4FF, 0 0 20px rgba(0, 212, 255, 0.5)",
                    left: "50%",
                    top: "50%",
                    marginLeft: -1.5,
                    marginTop: -1.5,
                  }}
                  initial={{
                    x: p.startX,
                    y: p.startY,
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: 0,
                    y: 0,
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: p.delay,
                    ease: [0.4, 0, 0.2, 1],
                    times: [0, 0.3, 0.8, 1],
                  }}
                />
              ))}
            </div>
          )}

          {/* Phase 3+: Central orb */}
          {phase >= 3 && (
            <motion.div
              className="absolute flex items-center justify-center"
              style={{ perspective: 1000 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Outer glow layer */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 200,
                  height: 200,
                  background: "radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)",
                  filter: "blur(20px)",
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Main orb */}
              <motion.div
                className="relative rounded-full"
                style={{
                  width: 100,
                  height: 100,
                  background: "radial-gradient(circle at 35% 35%, rgba(180, 240, 255, 0.95) 0%, rgba(0, 200, 255, 0.9) 25%, rgba(0, 150, 200, 0.8) 50%, rgba(0, 100, 150, 0.7) 75%, rgba(0, 60, 100, 0.6) 100%)",
                  boxShadow: "0 0 40px 10px rgba(0, 212, 255, 0.5), 0 0 80px 20px rgba(0, 212, 255, 0.3), 0 0 120px 40px rgba(0, 212, 255, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.2), inset -20px -20px 40px rgba(0, 50, 100, 0.3)",
                }}
                animate={{
                  scale: [1, 1.03, 1],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Specular highlight */}
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "12%",
                    left: "18%",
                    width: "35%",
                    height: "35%",
                    background: "radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 30%, transparent 70%)",
                    filter: "blur(4px)",
                  }}
                />
                {/* Secondary highlight */}
                <div
                  className="absolute rounded-full"
                  style={{
                    bottom: "20%",
                    right: "15%",
                    width: "15%",
                    height: "15%",
                    background: "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)",
                    filter: "blur(2px)",
                  }}
                />
              </motion.div>

              {/* Inner ring pulse */}
              <motion.div
                className="absolute rounded-full border"
                style={{
                  width: 130,
                  height: 130,
                  borderColor: "rgba(0, 212, 255, 0.3)",
                  borderWidth: 1,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}

          {/* Phase 4+: Holographic rings */}
          {phase >= 4 && (
            <div className="absolute flex items-center justify-center" style={{ perspective: 1000 }}>
              <HoloRing size={160} delay={0} duration={25} thickness={1} opacity={0.5} />
              <HoloRing size={200} delay={0.15} duration={30} thickness={1} opacity={0.4} reverse gradient />
              <HoloRing size={260} delay={0.3} duration={35} thickness={1} opacity={0.3} />
              <HoloRing size={320} delay={0.45} duration={40} thickness={1} opacity={0.2} reverse />
              <HoloRing size={400} delay={0.6} duration={50} thickness={1} opacity={0.15} gradient />

              {/* Energy arcs */}
              <EnergyArc size={240} rotation={0} delay={0.5} arcLength={80} pulseDelay={0} />
              <EnergyArc size={240} rotation={120} delay={0.7} arcLength={60} pulseDelay={5} />
              <EnergyArc size={240} rotation={240} delay={0.9} arcLength={70} pulseDelay={10} />
              
              <EnergyArc size={340} rotation={30} delay={0.6} arcLength={100} pulseDelay={2.5} />
              <EnergyArc size={340} rotation={150} delay={0.8} arcLength={80} pulseDelay={7.5} />
              <EnergyArc size={340} rotation={270} delay={1.0} arcLength={90} pulseDelay={12.5} />
            </div>
          )}

          {/* Phase 5: Title and loading */}
          {phase >= 5 && (
            <>
              {/* J.A.R.V.I.S. Title */}
              <motion.div
                className="absolute top-[15%] flex flex-col items-center gap-4"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <motion.h1
                  className="font-light tracking-[0.4em] text-transparent bg-clip-text"
                  style={{
                    fontSize: "clamp(2rem, 6vw, 4rem)",
                    backgroundImage: "linear-gradient(180deg, rgba(180, 240, 255, 1) 0%, rgba(0, 212, 255, 1) 50%, rgba(0, 150, 200, 1) 100%)",
                    filter: "drop-shadow(0 0 30px rgba(0, 212, 255, 0.8)) drop-shadow(0 0 60px rgba(0, 212, 255, 0.4))",
                  }}
                  initial={{ letterSpacing: "1.5em", opacity: 0 }}
                  animate={{ letterSpacing: "0.4em", opacity: 1 }}
                  transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
                >
                  J.A.R.V.I.S.
                </motion.h1>
                
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                >
                  <motion.div
                    className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: 60 }}
                    transition={{ duration: 1.5, delay: 1.2 }}
                  />
                  <p
                    className="text-[10px] tracking-[0.35em] font-light"
                    style={{
                      color: "rgba(0, 212, 255, 0.6)",
                      textShadow: "0 0 10px rgba(0, 212, 255, 0.5)",
                    }}
                  >
                    JUST A RATHER VERY INTELLIGENT SYSTEM
                  </p>
                  <motion.div
                    className="h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
                    initial={{ width: 0 }}
                    animate={{ width: 60 }}
                    transition={{ duration: 1.5, delay: 1.2 }}
                  />
                </motion.div>
              </motion.div>

              {/* Loading section */}
              <motion.div
                className="absolute bottom-[15%] flex flex-col items-center gap-5 w-full max-w-md px-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                {/* System status messages */}
                <div className="h-6 flex items-center justify-center">
                  <motion.span
                    className="font-mono text-xs tracking-[0.25em]"
                    style={{
                      color: currentMessageIndex === systemMessages.length - 1 ? "#00FF88" : "#00D4FF",
                      textShadow: `0 0 10px ${currentMessageIndex === systemMessages.length - 1 ? "rgba(0, 255, 136, 0.8)" : "rgba(0, 212, 255, 0.8)"}`,
                    }}
                  >
                    {systemText}
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ marginLeft: 2 }}
                    >
                      |
                    </motion.span>
                  </motion.span>
                </div>

                {/* Loading bar container */}
                <div className="relative w-full">
                  {/* Track */}
                  <div
                    className="w-full h-[2px] rounded-full overflow-hidden"
                    style={{
                      background: "rgba(0, 212, 255, 0.1)",
                      boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {/* Progress fill */}
                    <motion.div
                      className="h-full rounded-full relative"
                      style={{
                        width: `${loadingProgress}%`,
                        background: "linear-gradient(90deg, rgba(0, 212, 255, 0.5) 0%, rgba(0, 212, 255, 1) 50%, rgba(100, 220, 255, 1) 100%)",
                        boxShadow: "0 0 10px rgba(0, 212, 255, 0.8), 0 0 20px rgba(0, 212, 255, 0.4)",
                      }}
                      transition={{ duration: 0.1 }}
                    >
                      {/* Shimmer effect */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)",
                          animation: "shimmer 1.5s infinite",
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* End markers */}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-cyan-500/30 rounded-sm" />
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-cyan-500/30 rounded-sm" />
                </div>

                {/* Progress percentage */}
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <span
                    className="font-mono text-xl tracking-wider"
                    style={{
                      color: "rgba(0, 212, 255, 0.9)",
                      textShadow: "0 0 15px rgba(0, 212, 255, 0.6)",
                    }}
                  >
                    {Math.round(loadingProgress)}
                    <span className="text-sm ml-1 opacity-60">%</span>
                  </span>
                </motion.div>
              </motion.div>
            </>
          )}

          {/* Corner brackets */}
          {phase >= 4 && (
            <>
              {[
                { pos: "top-6 left-6", transform: "", delay: 0.2 },
                { pos: "top-6 right-6", transform: "scale(-1, 1)", delay: 0.3 },
                { pos: "bottom-6 left-6", transform: "scale(1, -1)", delay: 0.4 },
                { pos: "bottom-6 right-6", transform: "scale(-1, -1)", delay: 0.5 },
              ].map((corner, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${corner.pos}`}
                  style={{ transform: corner.transform }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.5, scale: 1 }}
                  transition={{ duration: 1, delay: corner.delay, ease: "easeOut" }}
                >
                  <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                    <path
                      d="M0 20V2C0 0.895 0.895 0 2 0H20"
                      stroke="url(#cornerGrad)"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 12V6C0 2.686 2.686 0 6 0H12"
                      stroke="rgba(0, 212, 255, 0.3)"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="cornerGrad" x1="0" y1="0" x2="20" y2="20">
                        <stop offset="0%" stopColor="rgba(0, 212, 255, 0.8)" />
                        <stop offset="100%" stopColor="rgba(0, 212, 255, 0.2)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
              ))}
            </>
          )}

          {/* Scan lines overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              background: "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0, 212, 255, 0.1) 1px, rgba(0, 212, 255, 0.1) 2px)",
            }}
          />

          {/* Film grain noise */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.015]"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
