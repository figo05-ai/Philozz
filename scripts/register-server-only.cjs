/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require('module');
const orig = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'server-only') {
    return {};
  }
  return orig.call(this, request, parent, isMain);
};

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // Ignore if file doesn't exist
  }
}
