import { useState, useEffect } from 'react';
import type { LoadingStep } from '../types';

const STEPS: LoadingStep[] = ['context', 'contacts', 'connections', 'annotations', 'related', 'render'];
const STEP_DELAYS = [300, 650, 1000, 1280, 1530, 1880];

export function useLoadingSequence() {
  const [currentStep, setCurrentStep] = useState<LoadingStep>('context');
  const [completedSteps, setCompletedSteps] = useState<Set<LoadingStep>>(new Set());
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((step, i) => {
      const t = setTimeout(() => {
        setCurrentStep(step);
        setProgress(Math.round(((i + 1) / STEPS.length) * 100));
        if (i > 0) {
          setCompletedSteps(prev => new Set([...prev, STEPS[i - 1]]));
        }
      }, STEP_DELAYS[i]);
      timers.push(t);
    });

    // Mark last step complete and show graph
    const finalT = setTimeout(() => {
      setCompletedSteps(prev => new Set([...prev, 'render']));
      setTimeout(() => setIsLoaded(true), 400);
    }, STEP_DELAYS[STEP_DELAYS.length - 1] + 300);
    timers.push(finalT);

    return () => timers.forEach(clearTimeout);
  }, []);

  return { currentStep, completedSteps, progress, isLoaded };
}
