// Patch Node.js fs to prevent EMFILE (too many open files) crashes on Windows
const fs = require('fs');
try {
  const gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(fs);
} catch (e) {
  // graceful-fs fallback
}

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limit parallel workers on Windows to prevent file handle exhaustion (EMFILE)
config.maxWorkers = 2;

module.exports = config;
