'use client';

import { useEffect } from 'react';

/**
 * Tracks the iOS Safari visual viewport (which shrinks when the on-screen
 * keyboard opens) and exposes its height as `--vvh` CSS custom property.
 *
 * Fixed-positioned bottom sheets use `--vvh` instead of `100dvh` so they
 * resize together with the keyboard instead of being pushed off-screen.
 */
export function ViewportTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;

    function update() {
      const h = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--vvh', `${h}px`);
      document.documentElement.style.setProperty(
        '--keyboard-inset',
        `${Math.max(0, window.innerHeight - h)}px`,
      );
    }

    update();
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return null;
}
