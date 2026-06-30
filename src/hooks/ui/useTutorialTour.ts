import { useState, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/app.store';
import {
  trackTutorialStarted,
  trackTutorialCompleted,
  trackTutorialSkipped,
  trackTutorialStepViewed,
} from '../../services/analytics.service';

export type TutorialAction =
  | 'tap_add_expense'
  | 'tap_add_transaction'
  | 'add_account'
  | 'create_budget'
  | 'create_goal'
  | 'view_health_score'
  | 'view_networth'
  | 'tap_add_holding';

export interface TutorialStep {
  emoji: string;
  title: string;
  body: string;
  requiredAction?: TutorialAction;
  // When set: no spotlight, no arrow — show an inline illustration instead.
  // inlineFab renders the purple + FAB; inlineButton renders a labelled pill button.
  inlineFab?: boolean;
  inlineButton?: string;
}

export interface TutorialTourResult {
  visible: boolean;
  stepIndex: number;
  total: number;
  currentStep: TutorialStep;
  next: () => void;
  skip: () => void;
  reset: () => void;
  completeAction: (action: TutorialAction) => void;
}

export function useTutorialTour(baseKey: string, steps: TutorialStep[]): TutorialTourResult {
  const tutorialVersion = useAppStore(s => s.tutorialVersion);
  const versionedKey    = `${baseKey}_v${tutorialVersion}`;

  const completed    = useAppStore(s => s.tutorialsCompleted[versionedKey] ?? false);
  const setCompleted = useAppStore(s => s.setTutorialCompleted);

  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible]     = useState(!completed);
  const startTrackedRef           = useRef(false);

  // Fire started + step 0 viewed once on first render if visible
  if (visible && !startTrackedRef.current) {
    startTrackedRef.current = true;
    trackTutorialStarted(baseKey);
    trackTutorialStepViewed(baseKey, 0);
  }

  const finish = useCallback(() => {
    setVisible(false);
    setCompleted(versionedKey);
    trackTutorialCompleted(baseKey);
  }, [versionedKey, baseKey, setCompleted]);

  const next = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      const nextStep = stepIndex + 1;
      setStepIndex(nextStep);
      trackTutorialStepViewed(baseKey, nextStep);
    } else {
      finish();
    }
  }, [stepIndex, steps.length, baseKey, finish]);

  const skip = useCallback(() => {
    setVisible(false);
    setCompleted(versionedKey);
    trackTutorialSkipped(baseKey);
  }, [versionedKey, baseKey, setCompleted]);

  const reset = useCallback(() => {
    setStepIndex(0);
    setVisible(true);
    startTrackedRef.current = false;
  }, []);

  const completeAction = useCallback((action: TutorialAction) => {
    const current = steps[stepIndex];
    if (current?.requiredAction === action) {
      setTimeout(() => {
        if (stepIndex < steps.length - 1) {
          setStepIndex(i => i + 1);
        } else {
          finish();
        }
      }, 800);
    }
  }, [stepIndex, steps, finish]);

  return {
    visible,
    stepIndex,
    total: steps.length,
    currentStep: steps[stepIndex] ?? steps[0],
    next,
    skip,
    reset,
    completeAction,
  };
}
