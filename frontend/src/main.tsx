import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import './styles/markdown-preview.css';
import './styles/notebook-preview.css';

function getErrorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getErrorStack(value: unknown): string | undefined {
  return value instanceof Error ? value.stack : undefined;
}

function reportRendererFatal(payload: {
  kind: 'unhandledrejection' | 'error';
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
}) {
  window.electronAPI?.diagnostics?.rendererFatal(payload).catch(() => {});
}

// Global error handlers to catch errors that React error boundaries can't
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  reportRendererFatal({
    kind: 'unhandledrejection',
    message: getErrorMessage(event.reason),
    stack: getErrorStack(event.reason),
    url: window.location.href,
  });
  // Prevent default browser behavior (showing error in console)
  event.preventDefault();

  // Show a user-friendly error message
  alert('An unexpected error occurred. The application may need to be restarted.\n\nError: ' + (event.reason?.message || String(event.reason)));
});

window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  reportRendererFatal({
    kind: 'error',
    message: getErrorMessage(event.error || event.message),
    stack: getErrorStack(event.error),
    url: event.filename || window.location.href,
    line: event.lineno,
    column: event.colno,
  });
  // Note: We don't prevent default here as the error boundary should catch React errors
});

// Swallow OS file drops outside of registered drop zones (terminal, editor, etc.)
// Without this, Chromium's default behavior on a file drop is to navigate the
// window to the dropped file's URI — which wipes the entire Pane UI. Components
// that want to accept drops still register their own handlers; this is just a
// safety net for dropping into empty space.
window.addEventListener('dragover', (e) => {
  if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
});
window.addEventListener('drop', (e) => {
  if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
