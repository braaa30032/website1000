/* ═══════════════════════════════════════════════════════════════
   APP.JS — Orchestrator (website 6.2)
   
   Thin entry module. Initializes modules, wires events,
   manages shared state.
   
   Step 1: static grid rendering with colored placeholders.
   Step 2: Observer-driven vertical scroll between sections.
           Pattern from: Ibaliqbal/gsap-collection slide-animation-observer
   Step 4: adds nav module.
   ═══════════════════════════════════════════════════════════════ */

import { gsap }      from 'gsap';
import { CSSPlugin } from 'CSSPlugin';
import { Observer }  from 'Observer';

import { getActivePalette, applyTheme, LIBRARY, getPageCount } from './library.js';
import * as Grid from './grid.js';

gsap.registerPlugin(CSSPlugin, Observer);

/** Debug mode — set true to enable HUD + verbose console logs. */
const DEBUG = false;

/* ── Animation Config ── */
const ANIM = {
    duration:    0.9,       // section scroll duration
    ease:        'power3.inOut',
    overscroll:  80,        // px of accumulated wheel delta before triggering next section
    hThreshold:  200,       // horizontal delta for chapter change (Step 5)
};

/* ── State ── */
const state = {
    chapter: 0,
    page: 0,
    section: 0,              // current section index within page
    sectionCount: 1,         // total sections in current page
    totalHeight: 0,          // total content height
    pageBoundaries: [],      // [0, H, 2H, ...] section snap points
    isAnimating: false,       // animation lock (slide-animation-observer pattern)
    wheelAccum: 0,           // accumulated wheel delta for overscroll threshold
    blockInputUntil: 0,      // hard gate for residual momentum after page swap
    buildEpoch: 0,           // token to cancel stale unlock timers
};

/* ── Safety: max lock duration before forced unlock ── */
const MAX_LOCK_MS = 12000;  // raised for slow loading/chapter spin animation
let _lockSafetyTimer = null;

/* ── Observer instance (created once, persists) ── */
let _observer = null;


/* ═══════════════════════════════════════════════════════════════
   SHARED GUARDS — single source of truth for input gating
   ═══════════════════════════════════════════════════════════════ */

/** True when ANY animation/build is in progress or momentum gate is active. */
function _isInputBlocked() {
    return state.isAnimating || Date.now() < state.blockInputUntil;
}

/**
 * Schedule the unlock of isAnimating after the momentum gate expires.
 * Epoch-guarded: if a newer build/transition started before the timer
 * fires, the stale timer is silently discarded.
 *
 * @param {number} epoch — the buildEpoch at the time the caller started
 * @param {number} [minDelayMs=250] — minimum ms to hold the lock after now
 */
function _scheduleUnlock(epoch, minDelayMs = 250) {
    const releaseAt = Math.max(state.blockInputUntil, Date.now() + minDelayMs);
    _clearLockSafety();
    setTimeout(() => {
        if (epoch !== state.buildEpoch) return;
        state.isAnimating = false;
        state.wheelAccum = 0;
    }, Math.max(0, releaseAt - Date.now()));
}

/**
 * Arm a hard safety timer: if the animation/build hasn't unlocked
 * within MAX_LOCK_MS, force-unlock to prevent permanent deadlock.
 */
function _armLockSafety(epoch) {
    _clearLockSafety();
    _lockSafetyTimer = setTimeout(() => {
        if (epoch !== state.buildEpoch) return;
        if (state.isAnimating) {
            console.warn('[safety] forced unlock after', MAX_LOCK_MS, 'ms');
            state.isAnimating = false;
            state.wheelAccum = 0;
        }
    }, MAX_LOCK_MS);
}

function _clearLockSafety() {
    if (_lockSafetyTimer) { clearTimeout(_lockSafetyTimer); _lockSafetyTimer = null; }
}

/* ── Init ── */
function init() {
    const container = document.getElementById('content-layer');
    if (!container) { console.error('Missing #content-layer'); return; }

    // Apply design tokens (colors + typo) as CSS custom properties
    applyTheme();

    // Init grid module
    Grid.init(container);

    // Nav quad click handlers (Step 4) — both sets for buffer swap
    const quads = Grid.getNavQuads();
    if (quads) {
        ['a', 'b'].forEach(setId => {
            const set = quads.sets[setId];
            set.tl.el.addEventListener('click', () => _navClick('prev-ch'));
            set.tr.el.addEventListener('click', () => _navClick('next-ch'));
            set.bl.el.addEventListener('click', () => _navClick('next-pg'));
            set.br.el.addEventListener('click', () => _navClick('next-pg'));
        });
    }

    // Start with Chapter 0 "David Asche"
    state.chapter = 0;
    state.page = 0;

    // Loading screen: quads start closed with "0fun", build content behind, then open
    Grid.setQuadsClosed(['0', 'f', 'u', 'n']);
    _loadingOpen();

    // Observer: wheel + touch input → section navigation
    _observer = Observer.create({
        target: window,
        type: 'wheel,touch,pointer',
        wheelSpeed: -1,
        tolerance: 10,
        preventDefault: true,
        onUp: (self) => _onScrollInput(1, self),
        onDown: (self) => _onScrollInput(-1, self),
        onLeft: (self) => _onHorizontalInput(1, self),
        onRight: (self) => _onHorizontalInput(-1, self),
    });

    // Keyboard navigation
    document.addEventListener('keydown', _onKey);

    // Resize handler
    window.addEventListener('resize', _onResize);

    if (DEBUG) {
        console.log(`[app] website 6.2 — Phase 3: Library Polish`);
        console.log(`[app] Scroll sections | Click corners for ch/pg | ←→ chapters ↑↓ pages | R re-render`);
    }
}

/**
 * Loading screen open: build content behind closed quads, then open.
 */
async function _loadingOpen() {
    state.isAnimating = true;
    const epoch = ++state.buildEpoch;
    _armLockSafety(epoch);

    const ch = state.chapter;
    const pg = state.page;

    // Build page behind closed quads
    const result = await Grid.buildPage(ch, pg);
    Grid.removeOldDom(result.oldDom);

    state.totalHeight = result.totalHeight;
    state.pageBoundaries = result.pageBoundaries;
    state.sectionCount = result.pageBoundaries.length;
    state.section = 0;

    const dom = Grid.getDom();
    if (dom) gsap.set(dom, { y: 0 });

    // 1s hold, then spin letters one-by-one: 0 → f → u → n (1 rotation)
    await _delay(1000);
    await Grid.spinQuadLetters(['0', 'f', 'u', 'n'], 1);
    await _delay(400);

    // Update labels to real nav content before opening
    Grid.updateNavQuads(ch, pg, 0);

    // Open quads to reveal content (slow, cinematic)
    const openTl = Grid.animateQuadOpen(1.2);
    await new Promise(r => openTl.eventCallback('onComplete', r));

    _scheduleUnlock(epoch);
    _updateHud();
    Grid.prefetchAdjacent(ch, pg);
    if (DEBUG) console.log(`[loading] opened → ch:${ch} pg:${pg}`);
}


/* ═══════════════════════════════════════════════════════════════
   SCROLL — Observer-driven section navigation
   
   Pattern: slide-animation-observer (isAnimating guard + timeline)
   
   Observer fires onUp/onDown on every wheel tick. We accumulate
   delta until it exceeds the overscroll threshold, then trigger
   a smooth GSAP scroll to the next section boundary.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Handle vertical scroll input from Observer.
 * direction: +1 = scroll down (next section), -1 = scroll up (prev section)
 */
function _onScrollInput(direction, self) {
    if (_isInputBlocked()) return;

    // Accumulate wheel delta for overscroll threshold
    state.wheelAccum += Math.abs(self.deltaY || 30);

    if (state.wheelAccum < ANIM.overscroll) return;

    // Threshold exceeded — trigger section change
    state.wheelAccum = 0;

    const nextSection = state.section + direction;

    // Bounds check: if at first/last section, try page change
    if (nextSection < 0) {
        // At top of first section → go to previous page
        _changePage(-1);
        return;
    }
    if (nextSection >= state.sectionCount) {
        // Past last section → go to next page
        _changePage(1);
        return;
    }

    // Navigate to section
    _goToSection(nextSection);
}

/**
 * Animate scroll to a target section.
 * Core pattern from slide-animation-observer: set isAnimating, timeline, onComplete release.
 */
function _goToSection(targetSection) {
    if (targetSection === state.section) return;
    if (targetSection < 0 || targetSection >= state.sectionCount) return;

    state.isAnimating = true;
    const targetY = state.pageBoundaries[targetSection] || 0;
    const dom = Grid.getDom();

    if (!dom) { state.isAnimating = false; return; }

    // GSAP scroll: animate the chapter container's Y position
    gsap.to(dom, {
        y: -targetY,
        duration: ANIM.duration,
        ease: ANIM.ease,
        onComplete: () => {
            state.section = targetSection;
            state.isAnimating = false;
            state.wheelAccum = 0;
            _updateHud();
            Grid.updateNavQuads(state.chapter, state.page, state.section);
            if (DEBUG) console.log(`[scroll] → section ${targetSection}/${state.sectionCount - 1}`);
        }
    });
}

/**
 * Change page within chapter (triggered when scrolling past first/last section).
 */
function _changePage(direction) {
    const maxPage = getPageCount(state.chapter) - 1;
    const nextPage = state.page + direction;

    if (nextPage < 0 || nextPage > maxPage) {
        if (DEBUG) console.log(`[scroll] at chapter boundary, ch:${state.chapter} pg:${state.page}`);
        return;
    }

    state.wheelAccum = 0;
    state.blockInputUntil = Date.now() + 800;
    const landAtEnd = direction < 0;
    _animateTransition(state.chapter, nextPage, 'y', direction, landAtEnd);
}

/**
 * Handle horizontal input from Observer (chapter change — Step 5 placeholder).
 */
function _onHorizontalInput(direction, self) {
    if (_isInputBlocked()) return;

    state.wheelAccum += Math.abs(self.deltaX || 30);
    if (state.wheelAccum < ANIM.hThreshold) return;
    state.wheelAccum = 0;

    const maxCh = LIBRARY.length - 1;
    if (direction > 0 && state.chapter < maxCh) {
        state.blockInputUntil = Date.now() + 800;
        _animateTransition(state.chapter + 1, 0, 'x', 1);
    } else if (direction < 0 && state.chapter > 0) {
        state.blockInputUntil = Date.now() + 800;
        _animateTransition(state.chapter - 1, 0, 'x', -1);
    }
}

/**
 * Handle nav quad click (Step 4).
 */
function _navClick(action) {
    if (_isInputBlocked()) return;

    const maxCh = LIBRARY.length - 1;
    const maxPg = getPageCount(state.chapter) - 1;

    switch (action) {
        case 'prev-ch':
            if (state.chapter > 0)
                _animateTransition(state.chapter - 1, 0, 'x', -1);
            break;
        case 'next-ch':
            if (state.chapter < maxCh)
                _animateTransition(state.chapter + 1, 0, 'x', 1);
            break;
        case 'prev-pg':
            if (state.page > 0)
                _animateTransition(state.chapter, state.page - 1, 'y', -1, true);
            break;
        case 'next-pg':
            if (state.page < maxPg)
                _animateTransition(state.chapter, state.page + 1, 'y', 1);
            break;
    }
}


/* ═══════════════════════════════════════════════════════════════
   BUILD & DISPLAY
   ═══════════════════════════════════════════════════════════════ */

/* ── Transition config ── */
const TRANSITION = {
    duration: 0.8,          // page/chapter transition duration
    ease: 'power3.inOut',
    flashPeak: 0.06,       // flash opacity at midpoint
    flashAt: 0.45,         // flash position in timeline (0-1)
};

/**
 * Animated page/chapter transition.
 * axis='y': slides old/new content vertically (page change).
 * axis='x': quad close → swap content behind → show title → quad open (chapter change).
 */
async function _animateTransition(targetCh, targetPg, axis, dir, landAtEnd = false) {
    state.isAnimating = true;
    const epoch = ++state.buildEpoch;
    _armLockSafety(epoch);

    // ── Chapter transition (axis='x'): quad close/open ──
    if (axis === 'x') {
        // Phase 1: Close quads over the screen (slow, cinematic)
        const closeTl = Grid.animateQuadClose(1.0);
        await closeTl.then ? closeTl : new Promise(r => closeTl.eventCallback('onComplete', r));

        // Phase 2: Spin chapter name letters one-by-one across quads
        const chapterName = LIBRARY[targetCh] ? LIBRARY[targetCh].name : `Chapter ${targetCh}`;
        const parts = _splitChapterName(chapterName);
        await _delay(1000);
        await Grid.spinQuadLetters(parts, 1);
        await _delay(400);

        // Phase 3: Swap content behind closed quads (invisible to user)
        const oldDom = Grid.getDom();
        const cached = Grid.getPrefetched(targetCh, targetPg);
        if (cached) {
            Grid.adoptPrefetched(cached);
        } else {
            await Grid.buildPage(targetCh, targetPg);
        }
        const newDom = Grid.getDom();
        Grid.removeOldDom(oldDom);

        // Update state
        state.chapter = targetCh;
        state.page = targetPg;
        const bnd = Grid.getPageBoundaries();
        state.pageBoundaries = bnd;
        state.sectionCount = bnd.length;
        state.section = 0;
        state.totalHeight = newDom ? parseInt(newDom.style.height) || window.innerHeight : window.innerHeight;
        gsap.set(newDom, { x: 0, y: 0 });

        // Phase 4: Update nav labels to new chapter context, then open (slow)
        Grid.updateNavQuads(targetCh, targetPg, 0);

        const openTl = Grid.animateQuadOpen(1.2);
        await openTl.then ? openTl : new Promise(r => openTl.eventCallback('onComplete', r));

        // Done
        newDom.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
        state.wheelAccum = 0;
        _scheduleUnlock(epoch);
        _updateHud();
        Grid.prefetchAdjacent(targetCh, targetPg);
        if (DEBUG) console.log(`[transition] chapter → ch:${targetCh} pg:${targetPg}`);
        return;
    }

    // ── Page transition (axis='y'): vertical slide ──
    const oldDom = Grid.getDom();
    const oldY = oldDom ? gsap.getProperty(oldDom, 'y') : 0;

    // Fill nav buffers with target state
    Grid.fillNavBuffers(targetCh, targetPg, 0);

    // Try prefetch cache first (avoids async delay / black flash)
    let result;
    const cached = Grid.getPrefetched(targetCh, targetPg);
    if (cached) {
        Grid.adoptPrefetched(cached);
        result = {
            totalHeight: cached.totalHeight,
            pageBoundaries: cached.pageBoundaries,
            sectionMeta: cached.sectionMeta,
            layout: cached.layout,
            oldDom: oldDom
        };
        if (DEBUG) console.log(`[transition] using prefetched page ch:${targetCh} pg:${targetPg}`);
    } else {
        result = await Grid.buildPage(targetCh, targetPg);
        if (DEBUG) console.log(`[transition] built page live ch:${targetCh} pg:${targetPg}`);
    }
    const newDom = Grid.getDom();

    // Prevent one-frame flash: hide until GSAP positions it offscreen
    newDom.style.visibility = 'hidden';

    // Update state
    state.chapter = targetCh;
    state.page = targetPg;
    state.totalHeight = result.totalHeight;
    state.pageBoundaries = result.pageBoundaries;
    state.sectionCount = result.pageBoundaries.length;
    state.section = (landAtEnd && state.sectionCount > 1) ? state.sectionCount - 1 : 0;

    const newSectionY = -(state.pageBoundaries[state.section] || 0);
    const H = window.innerHeight;
    const dur = TRANSITION.duration;

    // Position new DOM offscreen (vertical only)
    gsap.set(newDom, { y: newSectionY + H * dir });
    newDom.style.visibility = '';

    // Build master timeline
    const master = gsap.timeline({
        onComplete: () => {
            Grid.removeOldDom(result.oldDom);
            gsap.set(newDom, { x: 0, y: newSectionY });
            newDom.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
            state.wheelAccum = 0;
            _scheduleUnlock(epoch);
            _updateHud();
            Grid.prefetchAdjacent(targetCh, targetPg);
            if (DEBUG) console.log(`[transition] y${dir > 0 ? '+' : '-'} → ch:${targetCh} pg:${targetPg}`);
        }
    });

    // Old slides out
    if (oldDom) {
        master.to(oldDom, { y: oldY - H * dir, duration: dur, ease: TRANSITION.ease }, 0);
    }
    // New slides in
    master.to(newDom, { y: newSectionY, duration: dur, ease: TRANSITION.ease }, 0);

    // Nav quad page-push
    const navTl = Grid.animateNavPagePush(dir, dur);
    if (navTl) master.add(navTl, 0);

    // Flash overlay
    const flash = document.getElementById('flash');
    if (flash) {
        master.to(flash, {
            opacity: TRANSITION.flashPeak,
            duration: dur * 0.15,
            ease: 'power2.in'
        }, dur * TRANSITION.flashAt);
        master.to(flash, {
            opacity: 0,
            duration: dur * 0.4,
            ease: 'power2.out'
        }, dur * TRANSITION.flashAt + dur * 0.15);
    }
}

/* ═══════════════════════════════════════════════════════════════
   SYLLABLE-BASED QUAD SPLITTING

   Splits chapter names into 4 readable groups using correct
   German syllable hyphenation. Uses a dictionary for known words
   and a consonant-cluster fallback for unknown ones.
   ═══════════════════════════════════════════════════════════════ */

/**
 * German syllable dictionary for known chapter words.
 * Key = lowercase word, value = array of syllable strings.
 * This uses standard German Duden hyphenation rules.
 */
const SYLLABLE_DICT = {
    'david':              ['Da', 'vid'],
    'asche':              ['A', 'sche'],
    'freie':              ['frei', 'e'],
    'arbeiten':           ['Ar', 'bei', 'ten'],
    'spitzenkollektion':  ['Spit', 'zen', 'kol', 'lek', 'ti', 'on'],
    'displaydisplay':     ['Dis', 'play', 'Dis', 'play'],
    'kollektion':         ['Kol', 'lek', 'ti', 'on'],
    'spitzen':            ['Spit', 'zen'],
    'display':            ['Dis', 'play'],
};

/** Known German consonant clusters that stay together. */
const _CLUSTERS = new Set([
    'bl','br','ch','ck','cl','cr','dr','dw','fl','fr','gl','gn','gr',
    'kl','kn','kr','pf','ph','pl','pr','qu','sch','schr','spr','str',
    'sw','th','tr','ts','tw','wr','zw'
]);

/** Is character a German vowel? */
function _isVowel(c) {
    return 'aeiouyäöüAEIOUYÄÖÜ'.includes(c);
}

/**
 * Syllabify a single word.
 * Dictionary first, then consonant-cluster rule-based fallback.
 */
function _syllabifyWord(word) {
    if (word.length <= 2) return [word];

    // Dictionary lookup (case-insensitive)
    const entry = SYLLABLE_DICT[word.toLowerCase()];
    if (entry) {
        // Preserve original case of first char
        const copy = [...entry];
        if (word[0] === word[0].toUpperCase() && copy[0]) {
            copy[0] = copy[0][0].toUpperCase() + copy[0].slice(1);
        }
        return copy;
    }

    // Fallback: rule-based German syllable splitting
    // Strategy: find vowel→consonant(s)→vowel boundaries, split before
    // the consonant cluster that starts the next syllable.
    const syllables = [];
    let current = '';

    for (let i = 0; i < word.length; i++) {
        current += word[i];

        // Only consider splitting after a vowel
        if (!_isVowel(word[i])) continue;
        if (i >= word.length - 2) continue;

        // Look ahead: collect consonant cluster
        let consEnd = i + 1;
        while (consEnd < word.length && !_isVowel(word[consEnd])) consEnd++;
        const consCount = consEnd - (i + 1);

        // Need at least one consonant followed by a vowel
        if (consCount === 0 || consEnd >= word.length) continue;

        // Check for known clusters at end of consonant group
        const cons = word.slice(i + 1, consEnd).toLowerCase();

        // If the whole consonant group is a known cluster, keep with next syllable
        if (_CLUSTERS.has(cons)) {
            syllables.push(current);
            current = '';
            continue;
        }

        // If >1 consonants: split so the last cluster stays with next syllable
        if (consCount > 1) {
            // Try to find a cluster at the end
            let splitAt = i + 1; // default: split before first consonant
            for (let cl = Math.min(4, consCount); cl >= 2; cl--) {
                const tail = word.slice(consEnd - cl, consEnd).toLowerCase();
                if (_CLUSTERS.has(tail)) {
                    splitAt = consEnd - cl;
                    break;
                }
            }
            // Take consonants up to splitAt into current syllable
            current += word.slice(i + 1, splitAt);
            syllables.push(current);
            current = '';
            i = splitAt - 1; // loop will ++ to splitAt
        } else {
            // Single consonant: goes with next syllable
            syllables.push(current);
            current = '';
        }
    }
    if (current) syllables.push(current);
    return syllables.length > 0 ? syllables : [word];
}

/**
 * Split a chapter name into 4 groups for quad display.
 * Uses syllable hyphenation, then distributes evenly.
 */
function _splitChapterName(name) {
    if (!name || name.length === 0) return ['', '', '', ''];

    // Short names (≤4 chars): one char per quad
    if (name.length <= 4) {
        return [name[0] || '', name[1] || '', name[2] || '', name[3] || ''];
    }

    // Split into words, syllabify each, collect all syllables
    const words = name.split(/\s+/);
    const allSyllables = [];

    words.forEach((word, wi) => {
        const syls = _syllabifyWord(word);
        syls.forEach(s => allSyllables.push(s));
        // Add space marker to last syllable of each word (except last word)
        if (wi < words.length - 1 && allSyllables.length > 0) {
            allSyllables[allSyllables.length - 1] += ' ';
        }
    });

    // Distribute syllables into 4 quads
    return _distributeToQuads(allSyllables);
}

/**
 * Distribute syllable array into exactly 4 groups, optimally balanced.
 * For ≤4 syllables: one per quad. For >4: brute-force all 3-cut positions
 * and pick the split with minimum variance (most balanced character counts).
 * Word boundaries are preserved: if a group would contain trailing syllables
 * of one word AND leading syllables of the next (detected via trailing space
 * from _splitChapterName), a large penalty is applied so the algorithm
 * prefers cuts at word boundaries. With typical chapter names (≤8 syllables),
 * max C(7,3)=35 combos — instant.
 */
function _distributeToQuads(syllables) {
    const N = syllables.length;
    if (N === 0) return ['', '', '', ''];

    if (N <= 4) {
        const r = ['', '', '', ''];
        syllables.forEach((s, i) => { r[i] = s.trim(); });
        return r;
    }

    // Brute-force: try all ways to place 3 cuts among N-1 gaps
    let bestGroups = null;
    let bestScore = Infinity;
    const totalLen = syllables.reduce((s, x) => s + x.length, 0);
    const mean = totalLen / 4;
    const WORD_MIX_PENALTY = 200; // heavy penalty for mixing two words in one quad

    for (let c1 = 1; c1 <= N - 3; c1++) {
        for (let c2 = c1 + 1; c2 <= N - 2; c2++) {
            for (let c3 = c2 + 1; c3 <= N - 1; c3++) {
                const ranges = [[0, c1], [c1, c2], [c2, c3], [c3, N]];
                const g = ranges.map(([a, b]) => syllables.slice(a, b).join(''));

                // Balance score = sum of squared deviations from mean
                let score = g.reduce((s, x) => {
                    const d = x.trim().length - mean;
                    return s + d * d;
                }, 0);

                // Word-mixing penalty: a trailing space on a syllable marks a
                // word boundary. If that boundary falls INSIDE a group (i.e.
                // not at the last position), this group mixes two words.
                for (const [a, b] of ranges) {
                    for (let i = a; i < b - 1; i++) {
                        if (syllables[i].endsWith(' ')) score += WORD_MIX_PENALTY;
                    }
                }

                if (score < bestScore) {
                    bestScore = score;
                    bestGroups = g;
                }
            }
        }
    }

    return bestGroups.map(g => g.trim());
}

/** Simple delay helper (ms). */
function _delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Instant build (no animation). Used for initial load, resize, R key.
 */
async function _buildAndShow(landAtEnd = false) {
    const epoch = ++state.buildEpoch;
    state.isAnimating = true;
    _armLockSafety(epoch);
    const ch = state.chapter;
    const pg = state.page;
    const result = await Grid.buildPage(ch, pg);

    // Remove old DOM immediately (no transition)
    Grid.removeOldDom(result.oldDom);

    state.totalHeight = result.totalHeight;
    state.pageBoundaries = result.pageBoundaries;
    state.sectionCount = result.pageBoundaries.length;

    if (landAtEnd && state.sectionCount > 1) {
        state.section = state.sectionCount - 1;
    } else {
        state.section = 0;
    }

    const dom = Grid.getDom();
    if (dom) {
        const targetY = state.pageBoundaries[state.section] || 0;
        gsap.set(dom, { y: -targetY });
    }

    // Update nav quads (instant, no transition)
    Grid.updateNavQuads(ch, pg, state.section);

    _scheduleUnlock(epoch);

    _updateHud();
    if (DEBUG) console.log(`[build] ch:${ch} pg:${pg} → ${state.sectionCount} sections, totalH:${result.totalHeight}px`);
}


/* ═══════════════════════════════════════════════════════════════
   DEBUG HUD
   ═══════════════════════════════════════════════════════════════ */

function _updateHud() {
    if (!DEBUG) return;
    let hud = document.getElementById('debug-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'debug-hud';
        hud.style.cssText = `
            position:fixed; top:8px; left:50%; transform:translateX(-50%);
            z-index:9999; background:rgba(0,0,0,0.85); color:#fff;
            padding:6px 16px; border-radius:6px; font:12px/1.4 monospace;
            pointer-events:none; white-space:nowrap;
        `;
        document.body.appendChild(hud);
    }
    const ch = state.chapter;
    const pg = state.page;
    const chData = LIBRARY[ch];
    const name = chData ? chData.name : '?';
    const pages = chData ? chData.pages.length : 0;
    hud.textContent = `CH:${ch} "${name}" PG:${pg}/${pages-1} SEC:${state.section}/${state.sectionCount-1} | scroll ↕ sections | ←→ ch ↑↓ pg`;
}


/* ═══════════════════════════════════════════════════════════════
   KEYBOARD
   ═══════════════════════════════════════════════════════════════ */

function _onKey(e) {
    if (_isInputBlocked()) return;

    const maxCh = LIBRARY.length - 1;

    switch (e.key) {
        // Chapter navigation (animated)
        case 'ArrowRight':
            if (state.chapter < maxCh)
                _animateTransition(state.chapter + 1, 0, 'x', 1);
            break;
        case 'ArrowLeft':
            if (state.chapter > 0)
                _animateTransition(state.chapter - 1, 0, 'x', -1);
            break;

        // Page navigation (animated)
        case 'ArrowDown':
            if (e.shiftKey) {
                const maxPg = getPageCount(state.chapter) - 1;
                if (state.page < maxPg)
                    _animateTransition(state.chapter, state.page + 1, 'y', 1);
            } else {
                _onScrollInput(1, { deltaY: ANIM.overscroll + 1 });
            }
            break;
        case 'ArrowUp':
            if (e.shiftKey) {
                if (state.page > 0)
                    _animateTransition(state.chapter, state.page - 1, 'y', -1, true);
            } else {
                _onScrollInput(-1, { deltaY: ANIM.overscroll + 1 });
            }
            break;

        case 'r':
        case 'R':
            _buildAndShow();
            break;
    }
}


/* ═══════════════════════════════════════════════════════════════
   RESIZE
   ═══════════════════════════════════════════════════════════════ */

let _resizeTimer = null;
function _onResize() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
        Grid.clearPrefetchCache();
        _buildAndShow();
    }, 200);
}


/* ── Start ── */
document.addEventListener('DOMContentLoaded', init);
