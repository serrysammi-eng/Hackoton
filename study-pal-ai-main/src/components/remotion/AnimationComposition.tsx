import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { AnimationStep } from "@/lib/animation.types";

/* ─── Single Step Renderer ─── */
function StepRenderer({ step, startFrame }: { step: AnimationStep; startFrame: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;
  const durationFrames = step.duration * fps;

  if (localFrame < 0 || localFrame > durationFrames + 30) return null;

  const progress = spring({ frame: localFrame, fps, config: { damping: 15, stiffness: 80 } });
  const opacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const exitOpacity = interpolate(localFrame, [durationFrames - 10, durationFrames], [1, 0.3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const posX = step.position === "left" ? "15%" : step.position === "right" ? "55%" : "25%";

  if (step.type === "box") {
    return (
      <div
        style={{
          position: "absolute",
          left: posX,
          top: "30%",
          transform: `scale(${progress})`,
          opacity: opacity * exitOpacity,
        }}
      >
        <div
          style={{
            padding: "16px 28px",
            borderRadius: 16,
            border: "2px solid rgba(139, 92, 246, 0.6)",
            background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 30px rgba(139,92,246,0.3)",
            color: "#f1f5f9",
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "Inter, system-ui, sans-serif",
            textAlign: "center" as const,
            maxWidth: 280,
          }}
        >
          {step.text}
        </div>
      </div>
    );
  }

  if (step.type === "arrow") {
    const drawProgress = interpolate(localFrame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
    return (
      <div
        style={{
          position: "absolute",
          left: posX,
          top: "50%",
          opacity: opacity * exitOpacity,
        }}
      >
        <svg width="200" height="40" viewBox="0 0 200 40">
          <defs>
            <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1="20"
            x2={200 * drawProgress}
            y2="20"
            stroke="url(#arrowGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {drawProgress > 0.8 && (
            <polygon
              points={`${200 * drawProgress - 12},12 ${200 * drawProgress},20 ${200 * drawProgress - 12},28`}
              fill="#f59e0b"
            />
          )}
        </svg>
        <div
          style={{
            color: "#94a3b8",
            fontSize: 14,
            fontFamily: "Inter, system-ui, sans-serif",
            marginTop: 4,
            textAlign: "center" as const,
          }}
        >
          {step.text}
        </div>
      </div>
    );
  }

  if (step.type === "equation") {
    const slideY = interpolate(localFrame, [0, 15], [20, 0], { extrapolateRight: "clamp" });
    return (
      <div
        style={{
          position: "absolute",
          left: posX,
          top: "40%",
          transform: `translateY(${slideY}px)`,
          opacity: opacity * exitOpacity,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: "'Caveat', cursive",
            background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 30px rgba(245,158,11,0.3)",
            maxWidth: 350,
          }}
        >
          {step.text}
        </div>
      </div>
    );
  }

  // text type
  const slideY = interpolate(localFrame, [0, 12], [16, 0], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: posX,
        top: step.position === "center" ? "35%" : "45%",
        transform: `translateY(${slideY}px)`,
        opacity: opacity * exitOpacity,
        maxWidth: 360,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 500,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#e2e8f0",
          lineHeight: 1.5,
        }}
      >
        {step.text}
      </div>
    </div>
  );
}

/* ─── Main Composition ─── */
export function AnimationComposition({ steps }: { steps: AnimationStep[] }) {
  const { fps } = useVideoConfig();

  // Calculate start frames for each step
  let accumulated = 0;
  const startFrames = steps.map((s) => {
    const start = accumulated;
    accumulated += s.duration * fps;
    return start;
  });

  return (
    <AbsoluteFill
      style={{
        background: "transparent",
      }}
    >
      {/* Ambient background elements */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.08), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(245,158,11,0.05), transparent 50%)",
        }}
      />
      {steps.map((step, i) => (
        <StepRenderer key={i} step={step} startFrame={startFrames[i]} />
      ))}
    </AbsoluteFill>
  );
}

export function calculateTotalDuration(steps: AnimationStep[], fps: number): number {
  return steps.reduce((acc, s) => acc + s.duration * fps, 0) + 30; // +30 for tail
}
