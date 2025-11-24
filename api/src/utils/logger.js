// Logger utility for consistent logging across the application

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
};

// Get current log level from environment or default to DEBUG (for development)
const getLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  return LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.DEBUG;
};

const currentLogLevel = getLogLevel();

// Format timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Format log message
const formatMessage = (level, context, message, data = null, forceFull = false) => {
  const timestamp = getTimestamp();
  const levelName = LOG_LEVEL_NAMES[level];
  const contextStr = context ? `[${context}]` : '';
  
  let logMessage = `${timestamp} ${levelName} ${contextStr} ${message}`;
  
  if (data !== null && data !== undefined) {
    // For large objects, limit the output (unless forceFull is true)
    if (typeof data === 'object' && data !== null) {
      const dataStr = JSON.stringify(data, null, 2);
      if (!forceFull && dataStr.length > 500) {
        logMessage += `\n${dataStr.substring(0, 500)}... (truncated, ${dataStr.length} chars total)`;
      } else {
        logMessage += `\n${dataStr}`;
      }
    } else {
      logMessage += ` ${data}`;
    }
  }
  
  return logMessage;
};

// Logger object
const logger = {
  error: (message, context = null, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage(LOG_LEVELS.ERROR, context, message, data));
    }
  },

  warn: (message, context = null, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage(LOG_LEVELS.WARN, context, message, data));
    }
  },

  info: (message, context = null, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage(LOG_LEVELS.INFO, context, message, data));
    }
  },

  debug: (message, context = null, data = null, forceFull = false) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage(LOG_LEVELS.DEBUG, context, message, data, forceFull));
    }
  },
  
  // Special method for full data logging (bypasses truncation)
  debugFull: (message, context = null, data = null) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage(LOG_LEVELS.DEBUG, context, message, data, true));
    }
  },
};

export default logger;

