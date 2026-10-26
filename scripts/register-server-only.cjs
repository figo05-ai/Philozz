/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require('module');
const orig = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'server-only') {
    return {};
  }
  if (request === 'next/headers') {
    return {
      cookies: async () => ({
        get: (name) => (globalThis.__mockCookies ? { value: globalThis.__mockCookies[name] } : undefined),
        set: (name, val) => {
          globalThis.__mockCookies = globalThis.__mockCookies || {};
          globalThis.__mockCookies[name] = val;
        },
      }),
      headers: async () => new Map(),
    };
  }
  if (request === 'next/cache') {
    return {
      revalidatePath: (path, type) => {
        globalThis.__revalidatedPaths = globalThis.__revalidatedPaths || [];
        globalThis.__revalidatedPaths.push({ path, type });
      },
      revalidateTag: (tag) => {
        globalThis.__revalidatedTags = globalThis.__revalidatedTags || [];
        globalThis.__revalidatedTags.push(tag);
      },
      unstable_cache: (fn) => fn,
    };
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
