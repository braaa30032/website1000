/**
 * SHARED ANIMATION CONFIG
 * Used by nav.js and content3d.js for synchronized transitions.
 */

export const ANIM = {
    duration:      900,
    resetDelay:    200,
    easing:        t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2,
    stretchPeak:   2.2,
    phase1End:     0.35,
    phase1Retreat: 0.3,
};

export function lerp(a, b, t) { return a + (b - a) * t; }
