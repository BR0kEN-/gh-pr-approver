/**
 * @param {function(message: string): void} handler
 * @param {string} type
 * @param {string|string[]} lines
 */
function format(handler, type, lines) {
  if (typeof lines === 'string') {
    lines = [lines];
  }

  handler(`==> [${type}] @ ${new Date()}\n    ${lines.join('\n    ')}\n`);
}

/**
 * @param {string} url
 * @param {string} title
 * @param {string} message
 */
function skip(url, title, message) {
  format(console.warn, 'SKIP', [
    `URL: ${url}`,
    `Title: ${title}`,
    `Reason: ${message}`,
  ]);
}

/**
 * @param {string|string[]} message
 */
function error(message) {
  format(console.error, 'ERROR', message);
}

/**
 * @param {string|string[]} message
 */
function log(message) {
  format(console.log, 'INFO', message);
}

module.exports = {
  log,
  skip,
  error,
};
