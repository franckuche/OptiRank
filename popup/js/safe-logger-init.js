// Wrapper sécurisé pour le logger
window.safeLogger = {
  debug: (msg, ...args) => window.logger ? window.logger.debug(msg, ...args) : console.log('[DEBUG]', msg, ...args),
  info: (msg, ...args) => window.logger ? window.logger.info(msg, ...args) : console.log('[INFO]', msg, ...args),
  warn: (msg, ...args) => window.logger ? window.logger.warn(msg, ...args) : console.warn('[WARN]', msg, ...args),
  error: (msg, ...args) => window.logger ? window.logger.error(msg, ...args) : console.error('[ERROR]', msg, ...args)
}; 