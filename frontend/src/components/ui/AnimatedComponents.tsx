import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// Animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const scale: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Animated wrapper components
interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideDown({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      variants={slideDown}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      variants={scale}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({ children, className }: AnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// List with stagger animation
interface StaggerListProps {
  children: ReactNode;
  className?: string;
}

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: AnimatedProps) {
  return (
    <motion.div
      variants={slideUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated button with hover and tap effects
interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({
  children,
  onClick,
  className,
  disabled,
  type = 'button',
}: AnimatedButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.button>
  );
}

// Animated card with hover effect
interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedCard({ children, className, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: '0 10px 40px -15px rgba(0, 0, 0, 0.2)' }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Animated modal/dialog
interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function AnimatedModal({ isOpen, onClose, children, className }: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Animated notification/toast
interface AnimatedToastProps {
  isVisible: boolean;
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function AnimatedToast({ isVisible, children, position = 'top-right' }: AnimatedToastProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`fixed ${positionClasses[position]} z-50`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animated counter for numbers
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1, className }: AnimatedCounterProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration / 2 }}
      >
        {value.toLocaleString()}
      </motion.span>
    </motion.span>
  );
}

// Loading spinner with animation
export function AnimatedSpinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <motion.svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
      />
    </motion.svg>
  );
}

export { AnimatePresence };
