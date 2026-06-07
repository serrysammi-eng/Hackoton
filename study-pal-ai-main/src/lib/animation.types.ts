export interface AnimationStep {
  text: string;
  type: 'box' | 'arrow' | 'text' | 'equation';
  duration: number; // seconds
  position: 'left' | 'center' | 'right';
}

export interface LessonSection {
  heading: string;
  body: string;
  type?: 'concept' | 'application' | 'mistakes' | 'challenge';
}

export interface EnrichedLesson {
  title: string;
  intro: string;
  sections: LessonSection[];
  keyTakeaways: string[];
  funFact: string;
  animationSteps?: AnimationStep[];
}
