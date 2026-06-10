const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Anonymous logs endpoint — /logs/ proxies to backend /api/logs/ via nginx
// Uses full URL (not relative) so it works from Firebase hosting
const LOGS_PUBLIC = `${API_BASE}/logs/client/public`;
// Authenticated logs endpoint
const LOGS_AUTH = `${API_BASE}/logs/client`;

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

class FrontendLogger {
  private queue: LogEntry[] = [];
  private flushing = false;
  private originalConsole: Record<string, (...args: any[]) => void> = {};

  constructor() {
    this.overrideConsole();
    // ensure queued logs are attempted to be sent on page unload
    window.addEventListener('beforeunload', () => {
      if (this.queue.length === 0) return;
      const batch = this.queue.splice(0);
      try {
        const payload = JSON.stringify(batch);
        const url = this.getToken() ? LOGS_AUTH : LOGS_PUBLIC;
        if (navigator && typeof (navigator as any).sendBeacon === 'function') {
          (navigator as any).sendBeacon(url, payload);
        }
      } catch (e) {
        // swallow - best-effort
      }
    });
  }

  private overrideConsole() {
    const methods: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    for (const level of methods) {
      this.originalConsole[level] = (console as any)[level]?.bind(console) || (() => {});
      (console as any)[level] = (...args: any[]) => {
        this.originalConsole[level](...args);
        this.capture(level, args);
      };
    }

    window.onerror = (_msg, _source, _line, _col, error) => {
      this.capture('error', [error?.message || _msg, error?.stack]);
    };

    window.onunhandledrejection = (event) => {
      const reason = event.reason;
      this.capture('error', [reason?.message || 'Unhandled Promise Rejection', reason?.stack]);
    };
  }

  private capture(level: LogLevel, args: any[]) {
    const message = args.map(a => (typeof a === 'object' ? this.safeStringify(a) : String(a))).join(' ');
    const stack = args.find(a => a instanceof Error)?.stack || new Error().stack;

    const entry: LogEntry = {
      level,
      message,
      stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(entry);
    if (this.queue.length >= 10) {
      this.flush();
    } else if (!this.flushing) {
      setTimeout(() => this.flush(), 5000);
    }
  }

  private safeStringify(obj: any): string {
    try {
      return JSON.stringify(obj, (_key, value) => {
        if (value instanceof Error) return { message: value.message, stack: value.stack };
        if (typeof value === 'string' && value.length > 500) return value.slice(0, 500) + '...';
        return value;
      }, 2);
    } catch {
      return String(obj);
    }
  }

  private async flush() {
    if (this.flushing || this.queue.length === 0) return;
    const token = this.getToken();

    this.flushing = true;

    const batch = this.queue.splice(0);
    try {
      const url = token ? LOGS_AUTH : LOGS_PUBLIC;
      const payload = JSON.stringify(batch);

      // Try sendBeacon for reliable delivery during unload/navigation
      // Use raw string (text/plain) to avoid CORS preflight for cross-origin requests
      if (typeof (navigator as any)?.sendBeacon === 'function') {
        try {
          const ok = (navigator as any).sendBeacon(url, payload);
          if (ok) return;
        } catch (e) {
          // ignore and fallback to fetch
        }
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: payload,
      });

      if (resp.status === 401) {
        // anonymous/invalid token — enable backoff for anonymous clients to avoid storming
        this.setBackoff(5 * 60 * 1000); // 5 minutes
        // requeue entries for later (they may contain auth info later)
        this.queue.unshift(...batch);
        return;
      }

      if (!resp.ok) throw new Error('Failed to send client logs');
    } catch (err) {
      // requeue on failure
      this.queue.unshift(...batch);
      if (this.queue.length > 100) this.queue.splice(0, this.queue.length - 100);
    } finally {
      this.flushing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.flush(), 5000);
      }
    }
  }

  private setBackoff(ms: number) {
    try {
      const until = Date.now() + ms;
      localStorage.setItem('client_logs_backoff_until', String(until));
    } catch {}
  }

  private isBackoffActive(): boolean {
    try {
      const v = localStorage.getItem('client_logs_backoff_until');
      if (!v) return false;
      const until = Number(v);
      if (Number.isNaN(until)) return false;
      return Date.now() < until;
    } catch {
      return false;
    }
  }

  private getToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }
}

let instance: FrontendLogger | null = null;

export const initLogger = () => {
  if (!instance) {
    instance = new FrontendLogger();
  }
  return instance;
};
