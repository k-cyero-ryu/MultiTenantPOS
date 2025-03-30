import { Button } from "@/components/ui/button";
import { TourTooltip } from "@/components/ui/tour-tooltip";
import { useTour } from "@/providers/tour-provider";
import { LucideChevronLeft, LucideChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TourStepProps {
  stepId: string;
  children: React.ReactNode;
}

export function TourStep({ stepId, children }: TourStepProps) {
  const { currentStep, steps, showTour, nextStep, previousStep, endTour } = useTour();
  const { t } = useTranslation();
  const step = steps.find(s => s.id === stepId);
  const isCurrentStep = currentStep === stepId;

  if (!step || !showTour) {
    return children;
  }

  return (
    <div className="relative">
      {children}
      <TourTooltip
        isVisible={isCurrentStep}
        position={step.position}
      >
        <div className="space-y-4">
          <h3 className="font-semibold">{step.title}</h3>
          <p className="text-sm">{step.content}</p>
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={previousStep}
                disabled={steps.indexOf(step) === 0}
              >
                <LucideChevronLeft className="mr-1 h-4 w-4" />
                {t('tour.previous')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={nextStep}
              >
                {steps.indexOf(step) === steps.length - 1 ? t('tour.finish') : t('tour.next')}
                {steps.indexOf(step) !== steps.length - 1 && (
                  <LucideChevronRight className="ml-1 h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={endTour}
            >
              {t('tour.skip')}
            </Button>
          </div>
        </div>
      </TourTooltip>
    </div>
  );
}
