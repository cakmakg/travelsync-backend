const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level.toUpperCase()}] ${message} ${metaString}`;
    })
  ),
  transports: [new transports.Console()],
});

/**
 * Suppress console methods in production
 * Directs all console output to logger instead
 */
if (process.env.NODE_ENV === 'production') {
  // Override console methods to prevent debug output
  console.log = () => {}; // Suppress
  console.debug = () => {}; // Suppress
  console.info = (...args) => logger.info(args.join(' ')); // Route to logger
  console.warn = (...args) => logger.warn(args.join(' ')); // Route to logger
  console.error = (...args) => logger.error(args.join(' ')); // Route to logger
}

module.exports = logger;
