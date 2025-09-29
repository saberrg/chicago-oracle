'use client';

import { useState, useEffect } from 'react';
import { LogEntry, LogLevel, CopyStatus, ConsoleMethod, safeStringify } from '@/types/console';

export default function ConsoleLogDisplay() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    // Store original console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    // Override console methods to capture logs
    const addLog = (level: LogLevel, args: unknown[]): void => {
      const message = args.map(arg => 
        typeof arg === 'object' && arg !== null ? safeStringify(arg) : String(arg)
      ).join(' ');
      
      const data = args.length > 1 ? safeStringify(args.slice(1)) : undefined;
      const logEntry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level,
        message,
        data
      };

      setLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
    };

    const overrideConsole = (original: ConsoleMethod, level: LogLevel): ConsoleMethod => {
      return (...args: unknown[]) => {
        original(...args);
        addLog(level, args);
      };
    };

    console.log = overrideConsole(originalLog, 'log');
    console.warn = overrideConsole(originalWarn, 'warn');
    console.error = overrideConsole(originalError, 'error');
    console.info = overrideConsole(originalInfo, 'info');

    // Cleanup function to restore original console methods
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogsToClipboard = async () => {
    if (logs.length === 0) return;
    
    setCopyStatus('copying');
    try {
      const logsText = logs.map(log => {
        const timestamp = log.timestamp.toLocaleString();
        const level = log.level.toUpperCase();
        const icon = getLevelIcon(log.level);
        const dataSection = log.data ? `\n  Data: ${log.data}` : '';
        return `[${timestamp}] ${icon} ${level}: ${log.message}${dataSection}`;
      }).join('\n\n');
      
      await navigator.clipboard.writeText(logsText);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy logs:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };


  const getLevelIcon = (level: LogLevel): string => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Console Logs</h3>
        <div className="flex gap-2">
          <button
            onClick={copyLogsToClipboard}
            disabled={logs.length === 0 || copyStatus === 'copying'}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copyStatus === 'copying' ? 'Copying...' : 
             copyStatus === 'success' ? 'Copied!' : 
             copyStatus === 'error' ? 'Failed' : 'Copy Logs'}
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-[#17663D] text-white rounded hover:bg-[#0f4a2a]"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div className={`bg-gray-900 text-green-400 font-mono text-xs rounded p-3 max-h-96 overflow-y-auto ${isExpanded ? 'block' : 'hidden'}`}>
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Try uploading an image to see logs here.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="mb-2 border-b border-gray-700 pb-2 last:border-b-0">
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className="flex-shrink-0">
                  {getLevelIcon(log.level)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="break-words">{log.message}</div>
                  {log.data && (
                    <pre className="mt-1 text-xs text-gray-400 overflow-x-auto">
                      {log.data}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!isExpanded && logs.length > 0 && (
        <div className="text-sm text-gray-600 mt-2">
          {logs.length} log entries. Click &quot;Expand&quot; to view details.
        </div>
      )}
    </div>
  );
}
