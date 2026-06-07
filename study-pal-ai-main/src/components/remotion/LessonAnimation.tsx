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

  // Start with the title as a glowing text step (type: "equation" provides the glow effect)
  if (title) {
    steps.push({ text: title, type: "equation", duration: 2.5, position: "center" });
  }

  if (sections && sections.length > 0) {
    const positions: Array<"left" | "center" | "right"> = ["left", "center", "right"];
    // Take up to 4 key headings to create a rich but reasonably-timed animation flow
    const keySections = sections.slice(0, 4);
    
    keySections.forEach((s, i) => {
      // Box step for key heading
      steps.push({
        text: s.heading,
        type: "box",
        duration: 2.5,
        position: positions[i % 3],
      });
      
      // Arrow step connecting them
      if (i < keySections.length - 1) {
        steps.push({
          text: "leads to",
          type: "arrow",
          duration: 1.5,
          position: positions[i % 3],
        });
      }
    });

    // End with a summary text step
    const summaryText = `Summary: You have completed the lesson on ${title || "this topic"}!`;
    steps.push({
      text: summaryText,
      type: "text",
      duration: 3,
      position: "center",
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
