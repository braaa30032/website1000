/**
 * SHARED ANIMATION CONFIG — GSAP-powered
 * Used by nav.js and app.js for synchronized transitions.
 *
 * "Independent transforms" concept: each property (position, scale)
 * gets its own easing/duration within a single gsap.timeline,
 * creating organic, harmonious motion.
 */

import gsap from 'gsap';

/* ── Ease name: power2.inOut closely matches the old cubic ── */
const EASE_NAME = 'power2.inOut';

export const ANIM = {
    duration:      0.9,          // seconds (GSAP uses seconds)
    resetDelay:    0.2,          // seconds
    ease:          EASE_NAME,
    stretchPeak:   2.2,
    phase1End:     0.35,         // normalized (0–1)
    phase1Retreat: 0.3,
};

export function lerp(a, b, t) { return a + (b - a) * t; }

/* ── Unified render-dirty bridge ──
   Both CDS and Nav register their render callbacks here.
   gsap.ticker drives a single rAF loop for everything. */
const _renderCallbacks = [];

export function registerRenderCallback(fn) {
    if (_renderCallbacks.indexOf(fn) === -1) _renderCallbacks.push(fn);
}

gsap.ticker.add(() => {
    for (let i = 0; i < _renderCallbacks.length; i++) _renderCallbacks[i]();
});

/**
 * Build a GSAP timeline for the 2-phase stretch-slide transition.
 *
 * Independent transforms:
 *   • container.position[axis] — slides with EASE_NAME over full duration
 *   • inGroup.scale[dim]       — stretches with "back.out(1.4)" (phase1→peak→1)
 *   • inGroup.position[dim]    — anchors with "power3.out" (snappy settle)
 *
 * @param {object} opts
 * @param {THREE.Group} opts.container     — parent group that slides
 * @param {string}      opts.axis          — 'x' or 'y'
 * @param {number}      opts.direction     — 1 or -1
 * @param {THREE.Group} opts.inGroup       — incoming page group
 * @param {THREE.Group} opts.outGroup      — outgoing page group (unused in tween — just slides with container)
 * @param {number}      opts.slideDistance  — total px the container moves
 * @param {number}      opts.inLocalPos    — initial position of inGroup on axis
 * @param {number}      opts.SQ            — nav quad size
 * @param {number}      opts.viewW         — viewport width
 * @param {number}      opts.viewH         — viewport height
 * @param {function}    opts.onUpdate      — called every tick (set needsRender)
 * @returns {gsap.core.Timeline}
 */
export function buildCDSTransitionTimeline(opts) {
    const { container, axis, direction, inGroup, slideDistance, inLocalPos, SQ, viewW, viewH, onUpdate } = opts;
    const dim = axis;
    const pageExtent = axis === 'x' ? viewW : -viewH;
    const anchorFar = (direction === -1);
    const gapDir = -Math.sign(inLocalPos);
    const peak = ANIM.stretchPeak;
    const retreat = ANIM.phase1Retreat;
    const inScaleOrig = { x: inGroup.scale.x, y: inGroup.scale.y };

    /* Compute duration — X transitions are sqrt-scaled */
    let dur = ANIM.duration;
    if (axis === 'x') {
        const distX = viewW - SQ, distY = viewH - SQ;
        if (distY > 0) dur = ANIM.duration * Math.sqrt(distX / distY);
    }

    const tl = gsap.timeline({
        onUpdate: onUpdate || (() => {}),
        onComplete: () => {
            /* Ensure final state is clean */
            container.position[axis] = slideDistance;
            inGroup.scale.set(inScaleOrig.x, inScaleOrig.y, 1);
            inGroup.position[dim] = inLocalPos;
        }
    });

    /* ── Phase 1: stretch + slight retreat (0 → 35% of duration) ── */
    const p1Dur = dur * ANIM.phase1End;
    const p1SlideTarget = slideDistance * retreat;
    const p1ScaleTarget = peak;

    /* Container slides to retreat position */
    tl.to(container.position, {
        [axis]: p1SlideTarget,
        duration: p1Dur,
        ease: 'power1.in',
    }, 0);

    /* inGroup stretches — independent ease! (back = slight overshoot feel) */
    const _p1Scale = { v: 1 };
    tl.to(_p1Scale, {
        v: p1ScaleTarget,
        duration: p1Dur,
        ease: 'power2.in',
        onUpdate: function () {
            const stretch = _p1Scale.v;
            inGroup.scale[dim] = inScaleOrig[dim] * stretch;
            inGroup.position[dim] = inLocalPos
                + (anchorFar ? -pageExtent * (stretch - 1) : 0)
                + gapDir * SQ * (stretch - 1);
        }
    }, 0);

    /* ── Phase 2: destretch + slide to final (35% → 100%) ── */
    const p2Dur = dur * (1 - ANIM.phase1End);
    const p2Start = p1Dur;

    /* Container slides to final position — smooth settle */
    tl.to(container.position, {
        [axis]: slideDistance,
        duration: p2Dur,
        ease: 'power3.out',
    }, p2Start);

    /* inGroup de-stretches back to 1 — independent "back.out" for organic bounce */
    const _p2Scale = { v: p1ScaleTarget };
    tl.to(_p2Scale, {
        v: 1,
        duration: p2Dur,
        ease: 'back.out(1.4)',
        onUpdate: function () {
            const stretch = _p2Scale.v;
            inGroup.scale[dim] = inScaleOrig[dim] * stretch;
            inGroup.position[dim] = inLocalPos
                + (anchorFar ? -pageExtent * (stretch - 1) : 0)
                + gapDir * SQ * (stretch - 1);
        }
    }, p2Start);

    return tl;
}

/**
 * Build a nav-layer transition timeline (animateX or animateY).
 *
 * Independent transforms per quadrant:
 *   • position[axis] — each quad slides on its own curve
 *   • scale[dim]     — stretch/destretch with "back.out"
 *
 * @param {object} opts
 * @param {string}  opts.axis        — 'x' or 'y'
 * @param {number}  opts.direction   — 1 or -1
 * @param {object}  opts.quadrants   — { prev, main, next, nextNext, top, bottom, ... }
 * @param {object}  opts.defaults    — default positions from getDefaultPositions()
 * @param {number}  opts.SQ          — nav quad size
 * @param {number}  opts.viewW
 * @param {number}  opts.viewH
 * @param {function} opts.onUpdate   — called every tick (set needsRender)
 * @returns {gsap.core.Timeline}
 */
export function buildNavTransitionTimeline(opts) {
    const { axis, direction, quadrants, defaults, SQ, viewW, viewH, onUpdate } = opts;
    const dim = axis;
    const peak = ANIM.stretchPeak;
    const retreat = ANIM.phase1Retreat;

    let dur = ANIM.duration;
    if (axis === 'x') {
        const distX = Math.abs(defaults.next.x - defaults.main.x);
        const distY = Math.abs(defaults.top.y - defaults.bottom.y);
        if (distY > 0) dur = ANIM.duration * Math.sqrt(distX / distY);
    }

    const savedScale = {};
    const panelNames = ['prev', 'main', 'next', 'nextNext', 'topTop', 'top', 'bottom', 'bottomBottom', 'info'];
    panelNames.forEach(n => { savedScale[n] = quadrants[n].scale[dim]; });

    const p1Dur = dur * ANIM.phase1End;
    const p2Dur = dur * (1 - ANIM.phase1End);
    const p2Start = p1Dur;

    const tl = gsap.timeline({
        onUpdate: onUpdate || (() => {}),
        onComplete: () => {
            panelNames.forEach(n => { quadrants[n].scale[dim] = savedScale[n]; });
        }
    });

    if (axis === 'x') {
        _buildNavX(tl, direction, quadrants, defaults, SQ, peak, retreat, savedScale, p1Dur, p2Dur, p2Start);
    } else {
        _buildNavY(tl, direction, quadrants, defaults, SQ, peak, retreat, savedScale, p1Dur, p2Dur, p2Start);
    }

    return tl;
}

/* ── Internal: X-axis nav timeline ── */
function _buildNavX(tl, direction, q, d, SQ, peak, retreat, ss, p1D, p2D, p2S) {
    if (direction === 1) {
        /* ► Next chapter: next→main, main→prev */

        /* Phase 1: incoming stretch + outgoing retreat */
        const _inS1 = { v: 1 };
        tl.to(_inS1, {
            v: peak, duration: p1D, ease: 'power2.in',
            onUpdate() {
                q.next.scale.x = ss.next * _inS1.v;
                q.next.position.x = d.next.x + SQ / 2 * (1 - _inS1.v);
            }
        }, 0);

        const _outS1 = { v: 1 };
        tl.to(_outS1, {
            v: 1 + (peak - 1) * 0.5, duration: p1D, ease: 'power1.in',
            onUpdate() {
                q.main.scale.x = ss.main * _outS1.v;
            }
        }, 0);

        tl.to(q.main.position, {
            x: lerp(d.main.x, d.prev.x, retreat) + SQ / 2 * (1 - (1 + (peak - 1) * 0.5)),
            duration: p1D, ease: 'power1.in',
        }, 0);

        /* Phase 2: destretch + slide */
        const _inS2 = { v: peak };
        tl.to(_inS2, {
            v: 1, duration: p2D, ease: 'back.out(1.4)',
            onUpdate() {
                q.next.scale.x = ss.next * _inS2.v;
            }
        }, p2S);

        const p1EndPosIn = d.next.x + SQ / 2 * (1 - peak);
        tl.fromTo(q.next.position, { x: p1EndPosIn }, {
            x: d.main.x, duration: p2D, ease: 'power3.out',
        }, p2S);

        const mainP1Stretch = 1 + (peak - 1) * 0.5;
        const _outS2 = { v: mainP1Stretch };
        tl.to(_outS2, {
            v: 1, duration: p2D, ease: 'power2.out',
            onUpdate() { q.main.scale.x = ss.main * _outS2.v; }
        }, p2S);

        const mainP1EndX = lerp(d.main.x, d.prev.x, retreat) + SQ / 2 * (1 - mainP1Stretch);
        tl.fromTo(q.main.position, { x: mainP1EndX }, {
            x: d.prev.x, duration: p2D, ease: 'power2.out',
        }, p2S);

        /* Buffer: nextNext slides in */
        tl.fromTo(q.nextNext.position, { x: d.nextNext.x }, {
            x: d.next.x, duration: p2D, ease: 'power2.out',
        }, p2S);

    } else {
        /* ◄ Previous chapter: prev→main, main→next */

        const _inS1 = { v: 1 };
        tl.to(_inS1, {
            v: peak, duration: p1D, ease: 'power2.in',
            onUpdate() {
                q.prev.scale.x = ss.prev * _inS1.v;
                q.prev.position.x = d.prev.x + SQ / 2 * (_inS1.v - 1);
            }
        }, 0);

        const _outS1 = { v: 1 };
        tl.to(_outS1, {
            v: 1 + (peak - 1) * 0.5, duration: p1D, ease: 'power1.in',
            onUpdate() {
                q.main.scale.x = ss.main * _outS1.v;
            }
        }, 0);

        tl.to(q.main.position, {
            x: lerp(d.main.x, d.next.x, retreat) + SQ / 2 * ((1 + (peak - 1) * 0.5) - 1),
            duration: p1D, ease: 'power1.in',
        }, 0);

        /* Phase 2 */
        const _inS2 = { v: peak };
        tl.to(_inS2, {
            v: 1, duration: p2D, ease: 'back.out(1.4)',
            onUpdate() {
                q.prev.scale.x = ss.prev * _inS2.v;
            }
        }, p2S);

        const p1EndPosIn = d.prev.x + SQ / 2 * (peak - 1);
        tl.fromTo(q.prev.position, { x: p1EndPosIn }, {
            x: d.main.x, duration: p2D, ease: 'power3.out',
        }, p2S);

        const mainP1Stretch = 1 + (peak - 1) * 0.5;
        const _outS2 = { v: mainP1Stretch };
        tl.to(_outS2, {
            v: 1, duration: p2D, ease: 'power2.out',
            onUpdate() { q.main.scale.x = ss.main * _outS2.v; }
        }, p2S);

        const mainP1EndX = lerp(d.main.x, d.next.x, retreat) + SQ / 2 * (mainP1Stretch - 1);
        tl.fromTo(q.main.position, { x: mainP1EndX }, {
            x: d.next.x, duration: p2D, ease: 'power2.out',
        }, p2S);

        /* Buffer */
        tl.fromTo(q.next.position, { x: d.next.x }, {
            x: d.nextNext.x, duration: p2D, ease: 'power2.out',
        }, p2S);
    }
}

/* ── Internal: Y-axis nav timeline ── */
function _buildNavY(tl, direction, q, d, SQ, peak, retreat, ss, p1D, p2D, p2S) {
    if (direction === 1) {
        /* ▼ Next page: bottom→top */

        const _inS1 = { v: 1 };
        tl.to(_inS1, {
            v: peak, duration: p1D, ease: 'power2.in',
            onUpdate() {
                q.bottom.scale.y = ss.bottom * _inS1.v;
                q.bottom.position.y = d.bottom.y + SQ / 2 * (_inS1.v - 1);
            }
        }, 0);

        tl.to(q.top.position, {
            y: lerp(d.top.y, d.topTop.y, retreat),
            duration: p1D, ease: 'power1.in',
        }, 0);

        /* Phase 2 */
        const _inS2 = { v: peak };
        tl.to(_inS2, {
            v: 1, duration: p2D, ease: 'back.out(1.4)',
            onUpdate() {
                q.bottom.scale.y = ss.bottom * _inS2.v;
            }
        }, p2S);

        const p1EndPosIn = d.bottom.y + SQ / 2 * (peak - 1);
        tl.fromTo(q.bottom.position, { y: p1EndPosIn }, {
            y: d.top.y, duration: p2D, ease: 'power3.out',
        }, p2S);

        const topP1End = lerp(d.top.y, d.topTop.y, retreat);
        tl.fromTo(q.top.position, { y: topP1End }, {
            y: d.topTop.y, duration: p2D, ease: 'power2.out',
        }, p2S);

        tl.fromTo(q.bottomBottom.position, { y: d.bottomBottom.y }, {
            y: d.bottom.y, duration: p2D, ease: 'power2.out',
        }, p2S);

    } else {
        /* ▲ Previous page: top→bottom */

        const _inS1 = { v: 1 };
        tl.to(_inS1, {
            v: peak, duration: p1D, ease: 'power2.in',
            onUpdate() {
                q.top.scale.y = ss.top * _inS1.v;
                q.top.position.y = d.top.y + SQ / 2 * (1 - _inS1.v);
            }
        }, 0);

        tl.to(q.bottom.position, {
            y: lerp(d.bottom.y, d.bottomBottom.y, retreat),
            duration: p1D, ease: 'power1.in',
        }, 0);

        /* Phase 2 */
        const _inS2 = { v: peak };
        tl.to(_inS2, {
            v: 1, duration: p2D, ease: 'back.out(1.4)',
            onUpdate() {
                q.top.scale.y = ss.top * _inS2.v;
            }
        }, p2S);

        const p1EndPosIn = d.top.y + SQ / 2 * (1 - peak);
        tl.fromTo(q.top.position, { y: p1EndPosIn }, {
            y: d.bottom.y, duration: p2D, ease: 'power3.out',
        }, p2S);

        const bottomP1End = lerp(d.bottom.y, d.bottomBottom.y, retreat);
        tl.fromTo(q.bottom.position, { y: bottomP1End }, {
            y: d.bottomBottom.y, duration: p2D, ease: 'power2.out',
        }, p2S);

        tl.fromTo(q.topTop.position, { y: d.topTop.y }, {
            y: d.top.y, duration: p2D, ease: 'power2.out',
        }, p2S);
    }
}

export { gsap };
