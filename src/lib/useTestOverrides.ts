'use client';

import { useSyncExternalStore } from 'react';

export interface TestOverrides {
  isWebGLDisabled: boolean;
  isMotionDisabled: boolean;
  isMobile: boolean;
}

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback);
  window.addEventListener('popstate', callback);
  return () => {
    window.removeEventListener('resize', callback);
    window.removeEventListener('popstate', callback);
  };
}

function getSnapshot(): string {
  if (typeof window === 'undefined') return 'false|false|false';
  const params = new URLSearchParams(window.location.search);
  const webgl = params.get('webgl') === 'off' || params.get('webgl') === 'false';
  const motion =
    params.get('motion') === 'off' ||
    params.get('motion') === 'false' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth <= 900;
  return `${webgl}|${motion}|${mobile}`;
}

function getServerSnapshot(): string {
  return 'false|false|false';
}

export function useTestOverrides(): TestOverrides {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [webglStr, motionStr, mobileStr] = snapshot.split('|');

  return {
    isWebGLDisabled: webglStr === 'true',
    isMotionDisabled: motionStr === 'true',
    isMobile: mobileStr === 'true',
  };
}
