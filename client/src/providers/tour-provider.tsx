import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface TourStep {
  id: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface TourContextType {
  currentStep: string | null;
  showTour: boolean;
  steps: TourStep[];
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  setSteps: (steps: TourStep[]) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [showTour, setShowTour] = useState(false);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = useCallback(() => {
    setShowTour(true);
    setCurrentStepIndex(0);
  }, []);

  const endTour = useCallback(() => {
    setShowTour(false);
    setCurrentStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      endTour();
    }
  }, [currentStepIndex, steps.length, endTour]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  return (
    <TourContext.Provider
      value={{
        currentStep: showTour ? steps[currentStepIndex]?.id : null,
        showTour,
        steps,
        startTour,
        endTour,
        nextStep,
        previousStep,
        setSteps,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
