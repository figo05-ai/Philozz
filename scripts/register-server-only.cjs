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
  if (request === 'firebase-admin/auth') {
    const realAuthModule = orig.call(this, request, parent, isMain);
    return {
      ...realAuthModule,
      getAuth: (app) => {
        const realAuth = typeof realAuthModule.getAuth === 'function' ? realAuthModule.getAuth(app) : {};
        return new Proxy(realAuth, {
          get(target, prop) {
            if (prop === 'verifySessionCookie') {
              return async (cookieString, checkRevoked) => {
                if (globalThis.__mockAdminUser && cookieString === 'mock-valid-session-token') {
                  return {
                    uid: globalThis.__mockAdminUser.uid,
                    email: globalThis.__mockAdminUser.email,
                    admin: globalThis.__mockAdminUser.admin,
                    auth_time: Math.floor(Date.now() / 1000),
                  };
                }
                if (typeof target.verifySessionCookie === 'function') {
                  return target.verifySessionCookie(cookieString, checkRevoked);
                }
                throw new Error('Session verification failed in test harness');
              };
            }
            return target[prop];
          },
        });
      },
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
