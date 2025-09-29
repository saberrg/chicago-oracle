/**
 * Type-safe console logging types
 */

export type LogLevel = 'log' | 'warn' | 'error' | 'info';

export interface LogEntry {
  readonly id: string;
  readonly timestamp: Date;
  readonly level: LogLevel;
  readonly message: string;
  readonly data: string | undefined;
}

export type CopyStatus = 'idle' | 'copying' | 'success' | 'error';

export interface ConsoleLogDisplayProps {
  readonly className?: string;
}

/**
 * Type-safe console method override
 */
export type ConsoleMethod = (...args: unknown[]) => void;

/**
 * Type-safe log entry creation
 */
export interface LogEntryInput {
  readonly level: LogLevel;
  readonly message: string;
  readonly data?: unknown;
}

/**
 * Utility type for safe JSON stringification
 */
export type SafeJsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | SafeJsonValue[] 
  | { [key: string]: SafeJsonValue };

/**
 * Type guard to check if a value is safe for JSON stringification
 */
export function isSafeJsonValue(value: unknown): value is SafeJsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  
  if (Array.isArray(value)) {
    return value.every(isSafeJsonValue);
  }
  
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every(isSafeJsonValue);
  }
  
  return false;
}

/**
 * Safely stringify a value, handling circular references and unsafe values
 */
export function safeStringify(value: unknown): string {
  try {
    if (isSafeJsonValue(value)) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  } catch {
    return String(value);
  }
}
