import React, { useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { RefreshCw } from "lucide-react";
import { AnimationComposition, calculateTotalDuration } from "./AnimationComposition";
import type { AnimationStep } from "@/lib/animation.types";

interface Props {
  steps?: AnimationStep[];
  /** Auto-generate simple animation from text content */
  lessonTitle?: string;
  lessonSections?: { heading: string; body: string }[];
  className?: string;
}

/**
 * Generates fallback animation steps from lesson section data
 * when the AI doesn't provide explicit animation steps.
 */
function generateFallbackSteps(
  title?: string,
  sections?: { heading: string; body: string }[],
): AnimationStep[] {
  const steps: AnimationStep[] = [];

  if (title) {
    steps.push({ text: title, type: "text", duration: 2.5, position: "center" });
  }

  if (sections) {
    const positions: Array<"left" | "center" | "right"> = ["left", "center", "right"];
    sections.slice(0, 5).forEach((s, i) => {
      steps.push({
        text: s.heading,
        type: "box",
        duration: 2,
        position: positions[i % 3],
      });
      if (i < sections.length - 1) {
        steps.push({
          text: "",
          type: "arrow",
          duration: 1,
          position: positions[i % 3],
        });
      }
    });
  }

  if (steps.length === 0) {
    steps.push({ text: "Loading…", type: "text", duration: 2, position: "center" });
  }

  return steps;
}

export function LessonAnimation({ steps, lessonTitle, lessonSections, className }: Props) {
  const [playKey, setPlayKey] = useState(0);

  const finalSteps = useMemo(
    () => steps && steps.length > 0 ? steps : generateFallbackSteps(lessonTitle, lessonSections),
    [steps, lessonTitle, lessonSections],
  );

  const fps = 30;
  const totalFrames = useMemo(() => calculateTotalDuration(finalSteps, fps), [finalSteps]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-purple-500/15 bg-[#060d1a] ${className ?? ""}`}>
      <Player
        key={playKey}
        component={AnimationComposition}
        inputProps={{ steps: finalSteps }}
        durationInFrames={Math.max(60, totalFrames)}
        compositionWidth={640}
        compositionHeight={280}
        fps={fps}
        autoPlay
        loop={false}
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: "640 / 280",
        }}
        controls={false}
      />
      {/* Replay button */}
      <button
        onClick={() => setPlayKey((k) => k + 1)}
        className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/20 bg-white/[0.06] text-purple-400 backdrop-blur transition-all hover:bg-white/[0.12] hover:text-purple-300"
        aria-label="Replay animation"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
