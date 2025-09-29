'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  data?: any;
}

export default function ConsoleLogDisplay() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Store original console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    // Override console methods to capture logs
    const addLog = (level: LogEntry['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const logEntry: LogEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level,
        message,
        data: args.length > 1 ? args.slice(1) : undefined
      };

      setLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args);
    };

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

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
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
                      {JSON.stringify(log.data, null, 2)}
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
          {logs.length} log entries. Click "Expand" to view details.
        </div>
      )}
    </div>
  );
}
