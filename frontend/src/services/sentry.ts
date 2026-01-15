import * as Sentry from '@sentry/react';

// Initialize Sentry
export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_ENV || 'production',
      
      // Performance monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
      // Adjust in production to a lower value to reduce costs
      tracesSampleRate: 0.1,
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of errors
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      
      // Filter out common noise
      ignoreErrors: [
        // Random plugins/extensions
        'top.GLOBALS',
        // Network errors
        'Network request failed',
        'Failed to fetch',
        'NetworkError',
        // Cancelled requests
        'AbortError',
        'The operation was aborted',
      ],
      
      // Before send hook for additional filtering
      beforeSend(event, hint) {
        // Filter out events from browser extensions
        if (event.exception?.values?.[0]?.stacktrace?.frames) {
          const frames = event.exception.values[0].stacktrace.frames;
          const hasExtension = frames.some(
            frame => frame.filename?.includes('extension') || 
                    frame.filename?.includes('chrome-extension')
          );
          if (hasExtension) {
            return null;
          }
        }
        return event;
      },
    });
  }
}

// Set user context when user logs in
export function setUserContext(user: { id: string; email: string; role: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Capture custom error with context
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Capture custom message
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Add breadcrumb for debugging
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

// Create error boundary wrapper
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Profile a component or function
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  name: string
) {
  return Sentry.withProfiler(Component, { name });
}

// Start a transaction for performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

// Export Sentry for direct access if needed
export { Sentry };
