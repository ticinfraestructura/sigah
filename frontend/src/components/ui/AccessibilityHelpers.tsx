import { useEffect, useRef, ReactNode, KeyboardEvent } from 'react';

// Skip to main content link (for keyboard users)
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      Saltar al contenido principal
    </a>
  );
}

// Screen reader only text
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// Announce changes to screen readers
export function LiveRegion({
  children,
  politeness = 'polite',
}: {
  children: ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Focus trap for modals and dialogs
interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
}

export function FocusTrap({ children, active = true }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
}

// Accessible button with loading state
interface AccessibleButtonProps {
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  ariaLabel?: string;
}

export function AccessibleButton({
  children,
  loading = false,
  loadingText = 'Cargando...',
  disabled = false,
  onClick,
  type = 'button',
  className,
  ariaLabel,
}: AccessibleButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingText}</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Accessible form field wrapper
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(requerido)</span>}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
      
      <div
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
      >
        {children}
      </div>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Keyboard navigation helper for lists
interface KeyboardNavigableListProps {
  children: ReactNode;
  onItemSelect?: (index: number) => void;
  className?: string;
}

export function KeyboardNavigableList({
  children,
  onItemSelect,
  className,
}: KeyboardNavigableListProps) {
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const list = listRef.current;
    if (!list) return;

    const items = list.querySelectorAll<HTMLElement>('[role="option"], li');
    const currentIndex = Array.from(items).findIndex(
      (item) => item === document.activeElement
    );

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex !== -1 && onItemSelect) {
          onItemSelect(currentIndex);
        }
        break;
    }
  };

  return (
    <ul
      ref={listRef}
      role="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </ul>
  );
}

// Progress indicator with proper ARIA attributes
interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-gray-500 dark:text-gray-400">{percentage}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-primary-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Table with proper accessibility attributes
interface AccessibleTableProps {
  caption: string;
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function AccessibleTable({
  caption,
  headers,
  children,
  className,
}: AccessibleTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`} role="region" aria-label={caption}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </tbody>
      </table>
    </div>
  );
}

// Tooltip with proper accessibility
interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div
        role="tooltip"
        className={`absolute ${positionClasses[position]} px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50`}
      >
        {content}
      </div>
    </div>
  );
}

// Utility hook for reduced motion preference
export function usePrefersReducedMotion(): boolean {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

// Utility hook for high contrast preference
export function usePrefersHighContrast(): boolean {
  const mediaQuery = window.matchMedia('(prefers-contrast: more)');
  return mediaQuery.matches;
}
