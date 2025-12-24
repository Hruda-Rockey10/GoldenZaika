/**
 * Centralized Logger Service
 * Enforces structured logging and prevents unstructured console.log usage.
 */

const LOG_LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  DEBUG: "debug",
};

class Logger {
  constructor() {
    this.env = process.env.NODE_ENV || "development";
  }

  /**
   * Format message into structured JSON
   * @param {string} level
   * @param {string} message
   * @param {object} meta
   */
  format(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: this.env,
      ...meta,
    });
  }

  info(message, meta) {
    // eslint-disable-next-line
    console.info(this.format(LOG_LEVELS.INFO, message, meta));
  }

  warn(message, meta) {
    // eslint-disable-next-line
    console.warn(this.format(LOG_LEVELS.WARN, message, meta));
  }

  error(message, error) {
    const meta = {
      error: error?.message || error,
      stack: error?.stack,
    };
    // eslint-disable-next-line
    console.error(this.format(LOG_LEVELS.ERROR, message, meta));
  }

  debug(message, meta) {
    if (this.env === "development") {
      // eslint-disable-next-line
      console.debug(this.format(LOG_LEVELS.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
