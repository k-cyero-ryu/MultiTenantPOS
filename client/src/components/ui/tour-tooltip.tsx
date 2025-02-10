import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TourTooltipProps {
  children: React.ReactNode;
  isVisible: boolean;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function TourTooltip({
  children,
  isVisible,
  position = "bottom",
  className,
}: TourTooltipProps) {
  const positions = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute z-50 max-w-xs rounded-lg bg-primary p-4 text-primary-foreground shadow-lg",
            positions[position],
            className
          )}
        >
          <div className="relative">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
