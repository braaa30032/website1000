/* ═══════════════════════════════════════════════════════════════
   GRID.JS — DOM Grid Renderer for CDS
   
   Takes computeLayout() output and renders absolute-positioned
   DOM elements into #content-layer.
   
   Responsibilities:
   - Build section DOM from layout rects
   - Render mains, subs, pets as colored placeholders (Step 1)
   - Render netz fill-quads
   - Provide section boundaries for scroll navigation (Step 2)
   - Modular: works for any section config (different mainCounts)
   
   Pattern reference: Ibaliqbal/gsap-collection slide-animation-observer
   ═══════════════════════════════════════════════════════════════ */

import { gsap } from 'gsap';
import { computeLayout, LAYOUT_CONST } from './layout.js';
import {
    LIBRARY, getActivePalette, getMainNodesForPage,
    getPageSections, getPageCount
} from './library.js';

/** Debug mode — set true to enable netz labels + verbose console logs. */
const DEBUG = false;

/* ── State ── */
let _container = null;     // #content-layer
let _currentDom = null;    // current chapter container <div>
let _pageBoundaries = [];  // [0, H, 2H, ...] for scroll snap (Step 2)
let _sectionMeta = [];     // [{top, height, el}, ...] per section
let _W = 0, _H = 0;       // viewport dims
let _navQuads = null;      // { tl, tr, bl, br } nav corner elements (Step 4)

/* ── Prefetch cache: pre-built DOM for adjacent pages ── */
const _prefetchCache = new Map();  // key: 'ch-pg' → { dom, totalHeight, pageBoundaries, sectionMeta, layout }
let _prefetchInFlight = null;      // current prefetch promise (cancel on new build)

/* ── Netz strips: fixed DOM between TL/BL and TR/BR nav quads ── */
let _leftStripEl = null;           // fixed-position div for left netz strip
let _rightStripEl = null;          // fixed-position div for right netz strip

/* ── Public API ── */

/**
 * init(containerEl)
 * Bind to the #content-layer element.
 */
export function init(containerEl) {
    _container = containerEl;
    _W = window.innerWidth;
    _H = window.innerHeight;
    window.addEventListener('resize', _onResize);

    // Create nav quads once (Step 4)
    _navQuads = _createNavQuads();
    _sizeNavQuads();
}

/* ═══════════════════════════════════════════════════════════════
   NETZ STRIPS — fixed between TL/BL and TR/BR nav quads
   
   Both strips use transform: translateY() for positioning
   (same GPU-composited pipeline as nav quads) to prevent
   subpixel gaps at quad edges.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Create/update both fixed netz strip elements.
 * Left strip fills gap between TL and BL, right strip between TR and BR.
 * Uses CSS top:0 + GSAP y-transform for subpixel-accurate positioning.
 */
function _updateStrips() {
    const SQ = Math.round(Math.min(_W, _H) * LAYOUT_CONST.SQ_RATIO);
    const palette = getActivePalette();

    // Pre-blend: compute the opaque color that looks identical to
    // netz quads (primary at 0.7 opacity on #111 body).
    // This way the strip blocks content behind it (no double-blending)
    // while matching the netz-quad look exactly.
    const blended = _preblend(palette.primary, 0.7, palette.surface);

    // ── Left strip ──
    if (!_leftStripEl) {
        _leftStripEl = document.createElement('div');
        _leftStripEl.className = 'netz-strip-left';
        document.body.appendChild(_leftStripEl);
    }
    _leftStripEl.style.cssText = `
        position: fixed;
        left: 0; top: 0;
        width: ${SQ}px; height: ${_H}px;
        background: ${blended};
        z-index: 99;
        pointer-events: none;
    `;

    // ── Right strip ──
    if (!_rightStripEl) {
        _rightStripEl = document.createElement('div');
        _rightStripEl.className = 'netz-strip-right';
        document.body.appendChild(_rightStripEl);
    }
    _rightStripEl.style.cssText = `
        position: fixed;
        right: 0; top: 0;
        width: ${SQ}px; height: ${_H}px;
        background: ${blended};
        z-index: 99;
        pointer-events: none;
    `;
}

/** Get the left strip element. */
export function getLeftStrip() {
    return _leftStripEl;
}

/** Get the right strip element. */
export function getRightStrip() {
    return _rightStripEl;
}


/* ═══════════════════════════════════════════════════════════════
   PREFETCH CACHE — pre-build adjacent pages in background
   ═══════════════════════════════════════════════════════════════ */

/**
 * Build a page DOM offscreen (for prefetch cache).
 * Does NOT append to container or change _currentDom.
 */
async function _buildPageOffscreen(chapterIdx, pageIdx) {
    const nodes = getMainNodesForPage(chapterIdx, pageIdx);
    const sections = getPageSections(chapterIdx, pageIdx);

    await _preloadAspects(nodes);

    const layoutCfg = _buildLayoutConfig(nodes, sections, chapterIdx, pageIdx);
    const layout = computeLayout(layoutCfg, _W, _H);
    const palette = getActivePalette();

    const chapterEl = document.createElement('div');
    chapterEl.className = 'chapter-container';
    chapterEl.style.cssText = `position:absolute; top:0; left:0; width:${_W}px; height:${layout.totalContentHeight}px; background:${palette.surface};`;

    // Reuse the same rendering logic as buildPage
    _renderFullPage(chapterEl, layout, nodes, palette);

    // Compute boundaries
    const boundaries = [0];
    if (layout.sectionRanges && layout.sectionRanges.length > 1) {
        for (let si = 1; si < layout.sectionRanges.length; si++) {
            boundaries.push(si * _H);
        }
    }

    return {
        dom: chapterEl,
        totalHeight: layout.totalContentHeight,
        pageBoundaries: boundaries,
        sectionMeta: [],
        layout: layout
    };
}

/**
 * Prefetch adjacent pages (next + prev) in background.
 * Called after every successful buildPage or transition.
 */
export function prefetchAdjacent(ch, pg) {
    // Cancel any in-flight prefetch
    _prefetchInFlight = null;
    const token = {};
    _prefetchInFlight = token;

    const maxPg = getPageCount(ch) - 1;
    const targets = [];
    if (pg < maxPg) targets.push({ ch, pg: pg + 1 });
    if (pg > 0)     targets.push({ ch, pg: pg - 1 });

    // Also prefetch first page of next/prev chapter
    if (ch < LIBRARY.length - 1) targets.push({ ch: ch + 1, pg: 0 });
    if (ch > 0) targets.push({ ch: ch - 1, pg: 0 });

    // Build sequentially in background (don't block main thread too hard)
    (async () => {
        for (const t of targets) {
            if (_prefetchInFlight !== token) return; // cancelled
            const key = `${t.ch}-${t.pg}`;
            if (_prefetchCache.has(key)) continue;   // already cached
            try {
                const result = await _buildPageOffscreen(t.ch, t.pg);
                if (_prefetchInFlight !== token) return;
                _prefetchCache.set(key, result);
                if (DEBUG) console.log(`[prefetch] cached ${key}`);
            } catch (e) {
                console.warn(`[prefetch] failed ${key}:`, e);
            }
        }
    })();
}

/**
 * Get a prefetched page from cache. Returns null if not cached.
 * Removes from cache on retrieval (one-time use).
 */
export function getPrefetched(ch, pg) {
    const key = `${ch}-${pg}`;
    const cached = _prefetchCache.get(key);
    if (cached) {
        _prefetchCache.delete(key);
        return cached;
    }
    return null;
}

/**
 * Adopt a prefetched page: append its DOM to the container,
 * set it as current, update left strip, and trigger new prefetch round.
 */
export function adoptPrefetched(cached) {
    _container.appendChild(cached.dom);
    _currentDom = cached.dom;
    _pageBoundaries = cached.pageBoundaries;
    _sectionMeta = cached.sectionMeta || [];
    _updateStrips();
    // Kick off a new prefetch round for the newly displayed page
    // (extract ch/pg from the cached data isn't stored, so caller must call prefetchAdjacent separately)
}

/** Clear the prefetch cache (e.g. on resize). */
export function clearPrefetchCache() {
    _prefetchInFlight = null;
    _prefetchCache.forEach(entry => {
        if (entry.dom && entry.dom.parentNode) entry.dom.parentNode.removeChild(entry.dom);
    });
    _prefetchCache.clear();
}


/* ═══════════════════════════════════════════════════════════════
   ASPECT RATIO AUTO-DETECTION
   
   Before layout, probe every image/text node to determine its
   natural aspect ratio. This drives content-driven sizing:
   the layout rects match the content instead of forcing a default.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Preload aspect ratios for all nodes (mains + their children).
 * - Image nodes: load via Image(), read naturalWidth/naturalHeight
 * - Text nodes: render offscreen, measure height at reference width
 * - Already-set aspects (from library data) are preserved.
 *
 * @param {Array} nodes — from getMainNodesForPage
 * @returns {Promise<void>} — mutates node.aspect / child.aspect in place
 */
async function _preloadAspects(nodes) {
    const promises = [];

    for (const node of nodes) {
        // Main node
        if (node.type === 'text') {
            node.fill = true;  // text nodes fill their entire slot
        } else if (!node.aspect && node.type === 'image' && node.image) {
            promises.push(_probeImageAspect(node));
        }

        // Children (subs)
        const children = node.children || [];
        for (const child of children) {
            if (child.type === 'text') {
                child.fill = true;
            } else if (!child.aspect && child.type === 'image' && child.image) {
                promises.push(_probeImageAspect(child));
            }
        }
    }

    // Wait for all image probes (with timeout fallback)
    if (promises.length > 0) {
        await Promise.all(promises);
    }
}

/**
 * Probe a single image node's aspect ratio.
 * Sets node.aspect = naturalWidth / naturalHeight.
 * Falls back to default after 4s timeout.
 */
function _probeImageAspect(node) {
    return new Promise((resolve) => {
        const img = new Image();
        const timer = setTimeout(() => {
            // Timeout: leave aspect undefined → _buildLayoutConfig uses default
            resolve();
        }, 4000);

        img.onload = () => {
            clearTimeout(timer);
            if (img.naturalWidth && img.naturalHeight) {
                node.aspect = img.naturalWidth / img.naturalHeight;
            }
            resolve();
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve();
        };
        img.src = node.image;
    });
}

/* ═══════════════════════════════════════════════════════════════
   MATH-BASED TEXT SIZING
   
   Two-phase approach for text nodes:
   
   Phase 1 — Aspect ratio (in _preloadAspects):
     Compute ideal width/height from character count so the
     text box is wide enough for ~40-60 chars per line.
   
   Phase 2 — Font size (in _createNodeEl):
     fontSize = k × √( boxArea / (charCount × charWidthRatio × lineH) )
   
   charWidthRatio is calibrated once via Canvas measureText.
   ═══════════════════════════════════════════════════════════════ */

let _charWidthRatio = 0.52; // fallback; overwritten by calibration
let _charWidthCalibrated = false;

/**
 * One-time calibration: measure average character width as a fraction of em.
 * Uses Canvas measureText with a representative string.
 */
function _calibrateCharWidth() {
    if (_charWidthCalibrated) return;
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const testSize = 100; // px — large for precision
        ctx.font = `${testSize}px sans-serif`;
        const sample = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789';
        const measured = ctx.measureText(sample).width;
        _charWidthRatio = measured / (sample.length * testSize);
    } catch (e) {
        // Canvas unavailable — keep fallback
    }
    _charWidthCalibrated = true;
}

/**
 * Calculate the optimal font-size for a text block to fill a box.
 *
 * @param {number} boxW  — box width in px
 * @param {number} boxH  — box height in px
 * @param {string} text  — the full text (title + body concatenated)
 * @param {object} [opts]
 * @param {number} [opts.k=0.9]       — fill factor (< 1 leaves breathing room)
 * @param {number} [opts.lineH=1.35]  — line-height multiplier
 * @param {number} [opts.minSize=12]  — minimum font-size in px
 * @param {number} [opts.maxSize=120] — maximum font-size in px
 * @param {number} [opts.padding=0.12] — padding fraction (matches CSS 12%)
 * @returns {number} fontSize in px
 */
function _calcTextFontSize(boxW, boxH, text, opts = {}) {
    _calibrateCharWidth();

    const k       = opts.k       ?? 0.9;
    const lineH   = opts.lineH   ?? 1.35;
    const minSize = opts.minSize  ?? 12;
    const maxSize = opts.maxSize  ?? 120;
    const padFrac = opts.padFrac  ?? 0.08; // 8% padding on each axis, relative to own dimension

    // Usable area after padding (each axis relative to itself, not CSS-style)
    const innerW = boxW * (1 - 2 * padFrac);
    const innerH = boxH * (1 - 2 * padFrac);
    const area   = innerW * innerH;

    const charCount = Math.max(text.length, 1);

    // fontSize = k * sqrt( area / (charCount * charWidthRatio * lineH) )
    let fontSize = k * Math.sqrt(area / (charCount * _charWidthRatio * lineH));

    // Safety: verify text fits vertically
    // chars per line ≈ innerW / (fontSize * charWidthRatio)
    // total lines ≈ charCount / charsPerLine
    // total height ≈ lines * fontSize * lineH
    const charsPerLine = innerW / (fontSize * _charWidthRatio);
    const lines = Math.ceil(charCount / Math.max(charsPerLine, 1));
    const totalH = lines * fontSize * lineH;
    if (totalH > innerH && innerH > 0) {
        fontSize *= (innerH / totalH); // scale down to fit
    }

    return Math.round(Math.min(maxSize, Math.max(minSize, fontSize)));
}


/**
 * buildPage(chapterIdx, pageIdx)
 * Builds the DOM grid for one page (all its sections stacked vertically).
 * Returns { totalHeight, pageBoundaries, sectionMeta }.
 */
export async function buildPage(chapterIdx, pageIdx) {
    // Keep old DOM visible during async build (prevent black flash)
    const oldDom = _currentDom;

    _pageBoundaries = [];
    _sectionMeta = [];

    _W = window.innerWidth;
    _H = window.innerHeight;

    const palette = getActivePalette();
    const nodes = getMainNodesForPage(chapterIdx, pageIdx);
    const sections = getPageSections(chapterIdx, pageIdx);

    // Auto-detect aspect ratios from content
    await _preloadAspects(nodes);

    // Build layout config from library data
    const layoutCfg = _buildLayoutConfig(nodes, sections, chapterIdx, pageIdx);

    // Compute layout (pure math)
    const layout = computeLayout(layoutCfg, _W, _H);

    // Create chapter container
    const chapterEl = document.createElement('div');
    chapterEl.className = 'chapter-container';
    chapterEl.style.cssText = `position:absolute; top:0; left:0; width:${_W}px; height:${layout.totalContentHeight}px; background:${palette.surface};`;

    // Render content into the container
    _renderFullPage(chapterEl, layout, nodes, palette);

    // Compute section boundaries
    if (layout.sectionRanges && layout.sectionRanges.length > 1) {
        for (let si = 0; si < layout.sectionRanges.length; si++) {
            _pageBoundaries.push(si * _H);
        }
    } else {
        _pageBoundaries = [0];
    }

    // Atomic swap: append new, keep old for caller to handle
    _container.appendChild(chapterEl);
    _currentDom = chapterEl;

    // Update netz strips (left + right)
    _updateStrips();

    // Prefetch adjacent pages in background
    prefetchAdjacent(chapterIdx, pageIdx);

    return {
        totalHeight: layout.totalContentHeight,
        pageBoundaries: _pageBoundaries,
        sectionMeta: _sectionMeta,
        layout: layout,
        oldDom: oldDom
    };
}

/**
 * Shared rendering logic for buildPage + prefetch.
 * Appends all mains, subs, pets, netz, netzTexts into chapterEl.
 */
function _renderFullPage(chapterEl, layout, nodes, palette) {
    const sectionRanges = layout.sectionRanges || [];
    const hasMultiSections = sectionRanges.length > 1;

    if (hasMultiSections) {
        // ── Multi-section: wrap each section in a clipping container ──
        for (let si = 0; si < sectionRanges.length; si++) {
            const secTop = si * _H;
            const secBot = (si + 1) * _H;
            const range = sectionRanges[si]; // {startMain, endMain}

            // Section clipping wrapper
            const secEl = document.createElement('div');
            secEl.className = 'section-clip';
            secEl.style.cssText = `
                position:absolute; left:0; top:${secTop}px;
                width:${_W}px; height:${_H}px;
                overflow:hidden;
            `;

            // Render mains in this section
            for (let mi = range.startMain; mi < range.endMain; mi++) {
                const rect = layout.mains[mi];
                const node = nodes[mi];
                const el = _createNodeEl('main', rect, node, mi, palette);
                // Offset: elements are in absolute coords, section is at secTop
                el.style.top = (rect.y - secTop) + 'px';
                secEl.appendChild(el);

                // Render subs for this main
                const group = layout.subs[mi];
                if (group) {
                    group.forEach((subRect, subIdx) => {
                        const mainNode = nodes[mi];
                        const subNode = mainNode && mainNode.children ? mainNode.children[subIdx] : null;
                        const subEl = _createNodeEl('sub', subRect, subNode, subIdx, palette);
                        subEl.style.top = (subRect.y - secTop) + 'px';
                        secEl.appendChild(subEl);
                    });
                }
            }

            // Render pets belonging to this section's mains
            if (layout.pets && layout.pets.length > 0) {
                layout.pets.forEach((pet, i) => {
                    // Check if pet's parent main is in this section
                    if (pet.y >= secTop && pet.y < secBot) {
                        const rect = { x: pet.x - pet.w / 2, y: pet.y - pet.h / 2, w: pet.w, h: pet.h };
                        const el = _createNodeEl('pet', rect, pet.data, i, palette);
                        el.style.top = (rect.y - secTop) + 'px';
                        secEl.appendChild(el);
                    }
                });
            }

            // Render netz quads in this section's domain
            layout.netz.forEach((nz) => {
                if (nz.type !== 'rect') return;
                // Only include netz cells within this section's domain
                if (nz.y + nz.h <= secTop || nz.y >= secBot) return;

                const el = document.createElement('div');
                el.className = 'netz-quad';
                el.style.cssText = `left:${nz.x}px; top:${nz.y - secTop}px; width:${nz.w}px; height:${nz.h}px;`;

                if (DEBUG) {
                    const label = document.createElement('span');
                    label.className = 'debug-label';
                    label.textContent = `${nz.id} ${nz.w}×${nz.h}`;
                    el.appendChild(label);
                }

                secEl.appendChild(el);
            });

            // Render netzTexts for mains in this section
            for (let mi = range.startMain; mi < range.endMain; mi++) {
                const node = nodes[mi];
                if (!node.netzTexts || node.netzTexts.length === 0) continue;
                const mainRect = layout.mains[mi];
                const subGroup = layout.subs[mi] || [];
                node.netzTexts.forEach(nt => {
                    const el = _createNetzTextEl(nt, mainRect, subGroup, palette);
                    if (el) {
                        el.style.top = (parseFloat(el.style.top) - secTop) + 'px';
                        secEl.appendChild(el);
                    }
                });
            }

            chapterEl.appendChild(secEl);
        }
    } else {
        // ── Single section: flat layout (no clipping needed) ──

        // Render mains
        layout.mains.forEach((rect, i) => {
            const node = nodes[i];
            const el = _createNodeEl('main', rect, node, i, palette);
            chapterEl.appendChild(el);
        });

        // Render subs (grouped per main)
        layout.subs.forEach((group, mainIdx) => {
            group.forEach((rect, subIdx) => {
                const mainNode = nodes[mainIdx];
                const subNode = mainNode && mainNode.children ? mainNode.children[subIdx] : null;
                const el = _createNodeEl('sub', rect, subNode, subIdx, palette);
                chapterEl.appendChild(el);
            });
        });

        // Render pets
        layout.pets.forEach((pet, i) => {
            const rect = { x: pet.x - pet.w / 2, y: pet.y - pet.h / 2, w: pet.w, h: pet.h };
            const el = _createNodeEl('pet', rect, pet.data, i, palette);
            chapterEl.appendChild(el);
        });

        // Render netz fill-quads
        layout.netz.forEach((nz) => {
            if (nz.type !== 'rect') return;
            const el = document.createElement('div');
            el.className = 'netz-quad';
            el.style.cssText = `left:${nz.x}px; top:${nz.y}px; width:${nz.w}px; height:${nz.h}px;`;

            if (DEBUG) {
                const label = document.createElement('span');
                label.className = 'debug-label';
                label.textContent = `${nz.id} ${nz.w}×${nz.h}`;
                el.appendChild(label);
            }

            chapterEl.appendChild(el);
        });

        // Render netzTexts
        nodes.forEach((node, mi) => {
            if (!node.netzTexts || node.netzTexts.length === 0) return;
            const mainRect = layout.mains[mi];
            const subGroup = layout.subs[mi] || [];
            node.netzTexts.forEach(nt => {
                const el = _createNetzTextEl(nt, mainRect, subGroup, palette);
                if (el) chapterEl.appendChild(el);
            });
        });
    }

    // _renderFullPage complete — caller handles boundaries + DOM swap
}

/**
 * destroy() — remove all DOM, reset state.
 */
export function destroy() {
    if (_currentDom && _container) {
        _container.removeChild(_currentDom);
    }
    _currentDom = null;
    _pageBoundaries = [];
    _sectionMeta = [];
}

/**
 * getPageBoundaries() — current page boundaries array.
 */
export function getPageBoundaries() {
    return _pageBoundaries;
}

/**
 * getDom() — reference to current chapter container.
 */
export function getDom() {
    return _currentDom;
}

/**
 * getNavQuads() — nav quad structure (for click handler wiring).
 */
export function getNavQuads() {
    return _navQuads;
}

/**
 * removeOldDom(el) — remove a DOM element (used after transitions).
 * Safety: will NOT remove the current live DOM to prevent accidental wipe.
 */
export function removeOldDom(el) {
    if (!el || !el.parentNode) return;
    if (el === _currentDom) {
        console.warn('[grid] removeOldDom called on current live DOM — skipping');
        return;
    }
    _pauseVideos(el);
    el.parentNode.removeChild(el);
}


/* ── Video helpers: pause/resume for offscreen pages ── */

function _pauseVideos(dom) {
    if (!dom) return;
    dom.querySelectorAll('video').forEach(v => {
        v.pause();
    });
}

function _resumeVideos(dom) {
    if (!dom) return;
    dom.querySelectorAll('video').forEach(v => {
        v.play().catch(() => {}); // ignore autoplay policy blocks
    });
}


/* ═══════════════════════════════════════════════════════════════
   NAV QUADS — 9-PANEL BUFFER SYSTEM (Step 4)
   
   Two identical sets of 4 corner panels (A + B) + 1 info panel = 9.
   Double-buffer: one set visible, one offscreen. During transitions
   the buffer set slides in while the active set slides out, then
   they swap roles.
   
   TL = current location    TR = next chapter
   BL = next page           BR = "0fun"
   ═══════════════════════════════════════════════════════════════ */

/* ── Nav Animation Constants (ported from website6 nav.js) ── */
const NAV_ANIM = {
    stretchPeak:   2.2,    // incoming quad stretches to this factor
    phase1End:     0.35,   // phase 1 takes 35% of total duration
    phase1Retreat: 0.3,    // outgoing retreats 30% toward exit in phase 1
};

function _createNavQuads() {
    const sets = {};
    ['a', 'b'].forEach(setId => {
        const set = {};
        ['tl', 'tr', 'bl', 'br'].forEach(pos => {
            const el = document.createElement('div');
            el.className = `nav-quad nav-${pos}`;
            el.dataset.set = setId;
            if (setId === 'b') el.classList.add('nav-buffer');

            const label = document.createElement('span');
            label.className = 'nav-label';
            el.appendChild(label);

            document.body.appendChild(el);
            set[pos] = { el, label };
        });
        sets[setId] = set;
    });

    // Info panel (9th) — center, hidden, for future use
    const infoEl = document.createElement('div');
    infoEl.className = 'nav-quad nav-info';
    const infoLabel = document.createElement('span');
    infoLabel.className = 'nav-label';
    infoEl.appendChild(infoLabel);
    document.body.appendChild(infoEl);

    return { sets, info: { el: infoEl, label: infoLabel }, active: 'a' };
}

function _sizeNavQuads() {
    if (!_navQuads) return;
    const SQ = Math.round(Math.min(_W, _H) * LAYOUT_CONST.SQ_RATIO);
    document.documentElement.style.setProperty('--nav-sq', SQ + 'px');
}

/** Get the currently visible set of 4 quads. */
function _activeSet() {
    return _navQuads ? _navQuads.sets[_navQuads.active] : null;
}
/** Get the buffer (offscreen) set of 4 quads. */
function _bufferSet() {
    if (!_navQuads) return null;
    return _navQuads.sets[_navQuads.active === 'a' ? 'b' : 'a'];
}

/**
 * updateNavQuads(ch, pg, sec) — refresh the ACTIVE set's labels + colors.
 */
export function updateNavQuads(ch, pg, sec = 0) {
    if (!_navQuads) return;
    _sizeNavQuads();
    _fillQuadSet(_activeSet(), ch, pg, sec);
}

/**
 * fillNavBuffers(ch, pg, sec) — fill the BUFFER set with target state.
 */
export function fillNavBuffers(ch, pg, sec = 0) {
    if (!_navQuads) return;
    _fillQuadSet(_bufferSet(), ch, pg, sec);
}

/** Fill one set of 4 quads with content for given ch/pg/sec. */
function _fillQuadSet(set, ch, pg, sec) {
    if (!set) return;
    const maxCh = LIBRARY.length - 1;
    // Clamp chapter to valid range
    ch = Math.max(0, Math.min(ch, maxCh));
    const maxPg = Math.max(0, getPageCount(ch) - 1);
    pg = Math.max(0, Math.min(pg, maxPg));
    const palette = getActivePalette();
    const chapter = LIBRARY[ch];
    const chName = chapter ? chapter.name : '?';

    // TL — current location
    const pgName = _navPageName(ch, pg);
    const secLabel = sec > 0 ? `-section${sec + 1}` : '';
    _setQuadContent(set.tl, `${chName}-${pgName}${secLabel}`, true,
        palette.secondary);

    // TR — next chapter (or 'end')
    const nextCh = ch < maxCh ? LIBRARY[ch + 1] : null;
    _setQuadContent(set.tr, nextCh ? nextCh.name : 'end', true,
        palette.secondary);

    // BL — next page (or 'end')
    const hasNextPg = pg < maxPg;
    _setQuadContent(set.bl,
        hasNextPg ? _navPageName(ch, pg + 1) : 'end', true, palette.secondary);

    // BR — site name
    _setQuadContent(set.br, '0fun', true, palette.secondary);
}

function _setQuadContent(quad, text, active, bgColor) {
    quad.label.textContent = text;
    quad.el.classList.toggle('inactive', !active);
    quad.el.style.pointerEvents = active ? 'auto' : 'none';
    quad.el.style.backgroundColor = bgColor || '';
}

function _navPageName(ch, pg) {
    const chapter = LIBRARY[ch];
    if (!chapter) return `Page ${pg}`;
    if (chapter.pageNames && chapter.pageNames[pg]) return chapter.pageNames[pg];
    return `Page ${pg}`;
}

/**
 * animateNavTransition(axis, dir, duration)
 * Returns a GSAP timeline that slides active set out + buffer set in.
 * After completion, swaps active/buffer roles.
 *
 * Defensive: returns null if quads are missing, and kills any
 * in-flight nav tween before starting a new one to prevent overlap.
 *
 * @param {'x'|'y'} axis — 'x' for chapter change, 'y' for page change
 * @param {1|-1} dir — +1 = next (slide content left/up), -1 = prev
 * @param {number} duration
 * @returns {gsap.core.Timeline|null}
 */
let _navTween = null;  // track in-flight nav timeline

/**
 * animateNavTransition() — DEPRECATED, replaced by chapter close/open.
 * Kept as no-op so any stale callers don't crash.
 */
export function animateNavTransition() { return null; }


/* ═══════════════════════════════════════════════════════════════
   QUAD CLOSE / OPEN — Loading Screen & Chapter Transitions

   Nav quads scale from their corner (SQ×SQ) to cover the full
   viewport (50.1% × 50.1% each = slightly overlapping at center).
   CSS corner anchoring (top/left, top/right, etc.) means they
   naturally grow inward.

   Usage:
     Close: animateQuadClose()  → quads cover screen
     Open:  animateQuadOpen()   → quads shrink to corners
     Chapter: animateChapterTransition(ch, pg) → close+title+open
   ═══════════════════════════════════════════════════════════════ */

/** Split text into 4 roughly-equal parts for TL/TR/BL/BR. */
function _splitTextToQuads(text) {
    const len = text.length;
    if (len <= 4) {
        // One char per quad (pad with empty if short)
        return [
            text[0] || '',
            text[1] || '',
            text[2] || '',
            text[3] || ''
        ];
    }
    // Split into 4 chunks as evenly as possible
    const q = Math.ceil(len / 4);
    return [
        text.slice(0, q),
        text.slice(q, q * 2),
        text.slice(q * 2, q * 3),
        text.slice(q * 3)
    ];
}

/**
 * Corner-anchored clip-path wipe states.
 * Each quad wipes its label toward/from its own corner:
 *   TL wipes to top-left, TR to top-right, etc.
 * Ref: transition.style (Adam Argyle) corner-wipe patterns.
 */
const CORNER_WIPES = {
    tl: { hidden: 'inset(0% 100% 100% 0%)', visible: 'inset(0% 0% 0% 0%)' },
    tr: { hidden: 'inset(0% 0% 100% 100%)', visible: 'inset(0% 0% 0% 0%)' },
    bl: { hidden: 'inset(100% 100% 0% 0%)', visible: 'inset(0% 0% 0% 0%)' },
    br: { hidden: 'inset(100% 0% 0% 100%)', visible: 'inset(0% 0% 0% 0%)' },
};
const WIPE_DUR = 0.35;  // seconds for label wipe in/out

/**
 * Set all 4 active nav quads to their "closed" (fullscreen) size.
 * Used to initialize the loading screen state before open animation.
 * Also sets label text from the given parts array.
 *
 * @param {string[]} parts — 4 strings for [TL, TR, BL, BR]
 */
export function setQuadsClosed(parts = ['0', 'f', 'u', 'n']) {
    if (!_navQuads) return;
    const set = _activeSet();
    if (!set) return;
    const palette = getActivePalette();

    const quadW = Math.ceil(_W / 2) + 1;
    const quadH = Math.ceil(_H / 2) + 1;

    ['tl', 'tr', 'bl', 'br'].forEach((pos, i) => {
        const el = set[pos].el;
        el.style.width = quadW + 'px';
        el.style.height = quadH + 'px';
        set[pos].label.textContent = parts[i];
        set[pos].label.style.opacity = '0';       // hidden until spin
        set[pos].label.style.clipPath = CORNER_WIPES[pos].visible;  // clip ready
        el.style.backgroundColor = palette.secondary;
        el.classList.add('quad-fullscreen');
        el.classList.remove('inactive');
    });
}

/**
 * animateQuadClose(duration, labelParts)
 * Animates all 4 active quads from SQ to fullscreen.
 * Returns a GSAP timeline.
 *
 * @param {number} duration
 * @param {string[]} [labelParts] — optional 4 strings to show while closed
 * @returns {gsap.core.Timeline}
 */
export function animateQuadClose(duration = 0.5, labelParts) {
    if (!_navQuads) return gsap.timeline();
    const set = _activeSet();
    if (!set) return gsap.timeline();

    if (_navTween && _navTween.isActive()) {
        _navTween.progress(1).kill();
    }

    const quadW = Math.ceil(_W / 2) + 1; // +1 for overlap at center
    const quadH = Math.ceil(_H / 2) + 1;
    const palette = getActivePalette();

    const tl = gsap.timeline({
        onComplete: () => {
            // Add fullscreen class + hide labels (spin will reveal them)
            ['tl', 'tr', 'bl', 'br'].forEach((pos, i) => {
                set[pos].el.classList.add('quad-fullscreen');
                set[pos].label.style.opacity = '0';
                set[pos].label.style.clipPath = CORNER_WIPES[pos].visible;
                if (labelParts) {
                    set[pos].label.textContent = labelParts[i] || '';
                }
                set[pos].el.style.backgroundColor = palette.secondary;
                set[pos].el.classList.remove('inactive');
            });
        }
    });

    ['tl', 'tr', 'bl', 'br'].forEach(pos => {
        // Phase A: Corner-wipe old label OUT (fast, at start)
        tl.to(set[pos].label, {
            clipPath: CORNER_WIPES[pos].hidden,
            duration: WIPE_DUR,
            ease: 'power2.in'
        }, 0);

        // Phase B: Quad grows to fullscreen (starts slightly after wipe begins)
        tl.to(set[pos].el, {
            width: quadW,
            height: quadH,
            duration,
            ease: 'power3.inOut'
        }, 0);
    });

    _navTween = tl;
    return tl;
}

/**
 * animateQuadOpen(duration)
 * Animates all 4 active quads from fullscreen back to SQ corners.
 * Returns a GSAP timeline.
 *
 * @param {number} duration
 * @returns {gsap.core.Timeline}
 */
export function animateQuadOpen(duration = 0.5) {
    if (!_navQuads) return gsap.timeline();
    const set = _activeSet();
    if (!set) return gsap.timeline();

    if (_navTween && _navTween.isActive()) {
        _navTween.progress(1).kill();
    }

    const SQ = Math.round(Math.min(_W, _H) * LAYOUT_CONST.SQ_RATIO);

    const tl = gsap.timeline({
        onStart: () => {
            // Remove fullscreen class, prepare labels for corner reveal
            ['tl', 'tr', 'bl', 'br'].forEach(pos => {
                set[pos].el.classList.remove('quad-fullscreen');
                set[pos].label.style.opacity = '1';
                // Start labels clipped (hidden) — wipe will reveal them
                set[pos].label.style.clipPath = CORNER_WIPES[pos].hidden;
            });
        },
        onComplete: () => {
            // Reset to CSS-var-driven sizing, clear inline clipPath
            ['tl', 'tr', 'bl', 'br'].forEach(pos => {
                set[pos].el.style.width = '';
                set[pos].el.style.height = '';
                set[pos].label.style.clipPath = '';
            });
            _navTween = null;
        }
    });

    ['tl', 'tr', 'bl', 'br'].forEach(pos => {
        // Phase A: Quad shrinks to corner
        tl.to(set[pos].el, {
            width: SQ,
            height: SQ,
            duration,
            ease: 'power3.inOut'
        }, 0);

        // Phase B: Corner-wipe new label IN (starts near end of shrink)
        tl.to(set[pos].label, {
            clipPath: CORNER_WIPES[pos].visible,
            duration: WIPE_DUR,
            ease: 'power2.out'
        }, Math.max(0, duration - WIPE_DUR));
    });

    _navTween = tl;
    return tl;
}


/**
 * spinQuadLetters(parts, rotations)
 * Flashes letters one-by-one across TL→TR→BL→BR like loading screen.
 * Each tile: fade in → hold → fade out, then next.
 * Only animates positions that have non-empty text — so "0" (1 letter)
 * completes in ~0.94s instead of ~3.76s.
 * Returns a Promise that resolves when complete.
 *
 * @param {string[]} parts — 4 strings for [TL, TR, BL, BR]
 * @param {number} rotations — how many full cycles (default 1)
 * @returns {Promise<void>}
 */
export function spinQuadLetters(parts = ['0', 'f', 'u', 'n'], rotations = 1) {
    if (!_navQuads) return Promise.resolve();
    const set = _activeSet();
    if (!set) return Promise.resolve();

    const FADE_IN  = 0.22;   // seconds
    const HOLD     = 0.50;
    const FADE_OUT = 0.22;
    const STEP     = FADE_IN + HOLD + FADE_OUT; // 0.94s per tile
    const ALL_POS  = ['tl', 'tr', 'bl', 'br'];

    // Filter to only positions with non-empty text
    const activePositions = ALL_POS.filter((pos, i) => parts[i] && parts[i].length > 0);
    if (activePositions.length === 0) return Promise.resolve();

    // Set text, start all labels hidden
    ALL_POS.forEach((pos, i) => {
        set[pos].label.textContent = parts[i] || '';
        set[pos].label.style.opacity = '0';
        set[pos].label.style.clipPath = CORNER_WIPES[pos].visible;
    });

    const tl = gsap.timeline();

    for (let r = 0; r < rotations; r++) {
        activePositions.forEach((pos, idx) => {
            const offset = (r * activePositions.length + idx) * STEP;
            const label = set[pos].label;
            // Fade in
            tl.to(label, { opacity: 1, duration: FADE_IN, ease: 'power1.in' }, offset);
            // Fade out after hold
            tl.to(label, { opacity: 0, duration: FADE_OUT, ease: 'power1.out' }, offset + FADE_IN + HOLD);
        });
    }

    return new Promise(resolve => tl.eventCallback('onComplete', resolve));
}


/**
 * animateNavPagePush(dir, duration)
 * Page-specific nav transition: BL↔TL stretch-push on the left column.
 * TR and BR stay fixed (labels updated instantly).
 *
 * PROXY-DRIVEN, EDGE-TO-EDGE:
 * A single onUpdate computes all positions from proxy values.
 * The outgoing quad stays at its home until the incoming's leading edge
 * actually reaches it — then it's physically pushed. No jumps, no gaps.
 *
 * Coordinate system: absolute screen-space, top = 0, bottom = H.
 * "inAnchor" = the fixed/anchored edge of the incoming quad:
 *   dir=1:  anchor = bottom of BL (stays at H, then slides to SQ in phase 2)
 *   dir=-1: anchor = top of TL (stays at 0, then slides to H-SQ in phase 2)
 *
 * @param {1|-1} dir — +1 = next page (BL pushes TL up), -1 = prev (TL pushes BL down)
 * @param {number} duration — total animation duration in seconds
 * @returns {gsap.core.Timeline|null}
 */
export function animateNavPagePush(dir, duration = 0.9) {
    if (!_navQuads) return null;

    const active = _activeSet();
    const buffer = _bufferSet();
    if (!active || !buffer) return null;

    // Kill any previous in-flight nav tween
    if (_navTween && _navTween.isActive()) {
        _navTween.progress(1).kill();
    }

    const H  = _H;
    const SQ = Math.round(Math.min(_W, H) * LAYOUT_CONST.SQ_RATIO);
    const peak    = NAV_ANIM.stretchPeak;       // 2.2
    const p1Frac  = NAV_ANIM.phase1End;          // 0.35
    const p1D     = duration * p1Frac;
    const p2D     = duration * (1 - p1Frac);
    const p2S     = p1D;

    // Identify roles
    const inPos  = dir === 1 ? 'bl' : 'tl';
    const outPos = dir === 1 ? 'tl' : 'bl';
    const inEl       = active[inPos].el;
    const outEl      = active[outPos].el;
    const bufferInEl = buffer[inPos].el;

    // ── Home positions (absolute screen-space top values) ──
    const inHomeTop  = dir === 1 ? (H - SQ) : 0;
    const outHomeTop = dir === 1 ? 0 : (H - SQ);

    // ── Anchor edge values ──
    // dir=1: BL anchored at bottom=H, stretches upward. anchor = H
    //        target: incoming ends at TL's home (top=0) → anchor moves to 0+SQ = SQ
    // dir=-1: TL anchored at top=0, stretches downward. anchor = 0
    //         target: incoming ends at BL's home (top=H-SQ) → anchor moves to H-SQ
    const inAnchorHome   = dir === 1 ? H : 0;
    const inAnchorTarget = dir === 1 ? SQ : (H - SQ);

    // ── Outgoing home edges (the edge that faces the incoming) ──
    // dir=1: TL's bottom edge = SQ. If leadEdge < SQ, TL is being pushed.
    // dir=-1: BL's top edge = H-SQ. If leadEdge > H-SQ, BL is being pushed.
    const outNearEdge = dir === 1 ? SQ : (H - SQ);

    // ── Prepare: switch all 3 elements to top:0 left:0 positioning ──
    [inEl, outEl, bufferInEl].forEach(el => {
        el.style.top = '0';
        el.style.bottom = 'auto';
        el.style.left = '0';
        el.style.right = 'auto';
    });

    gsap.set(inEl,  { y: inHomeTop,  height: SQ, clearProps: 'transform' });
    gsap.set(outEl, { y: outHomeTop, height: SQ, clearProps: 'transform' });

    // Buffer starts off-screen
    bufferInEl.classList.remove('nav-buffer');
    const bufferStartTop = dir === 1 ? H : -SQ;
    gsap.set(bufferInEl, { y: bufferStartTop, height: SQ, clearProps: 'transform' });

    // Instant-update TR/BR labels
    const bufferTr = buffer['tr'];
    const bufferBr = buffer['br'];
    if (bufferTr) {
        active['tr'].label.textContent = bufferTr.label.textContent;
        active['tr'].el.style.backgroundColor = bufferTr.el.style.backgroundColor;
    }
    if (bufferBr) {
        active['br'].label.textContent = bufferBr.label.textContent;
        active['br'].el.style.backgroundColor = bufferBr.el.style.backgroundColor;
    }

    // ── Proxy: GSAP tweens these, applyProxy derives all positions ──
    const proxy = {
        inAnchor: inAnchorHome,   // anchored edge of incoming
        inStretch: 1,             // height multiplier (1 → peak → 1)
        bufferTop: bufferStartTop,
    };

    function applyProxy() {
        const inH = SQ * proxy.inStretch;

        // Incoming: compute top from anchor
        // dir=1: anchor=bottom → top = anchor - inH
        // dir=-1: anchor=top → top = anchor
        const inTop = dir === 1 ? (proxy.inAnchor - inH) : proxy.inAnchor;
        gsap.set(inEl, { y: inTop, height: inH });

        // Leading edge (the edge that faces the outgoing)
        // dir=1: top of incoming = inTop
        // dir=-1: bottom of incoming = inTop + inH
        const leadEdge = dir === 1 ? inTop : (inTop + inH);

        // Outgoing: stays at home UNTIL leadEdge reaches it, then gets pushed
        let outTop;
        if (dir === 1) {
            // TL: normally at top=0. Gets pushed when leadEdge < SQ (TL's bottom)
            // outgoing bottom = min(outNearEdge, leadEdge) → outTop = that - SQ
            outTop = Math.min(outNearEdge, leadEdge) - SQ;
        } else {
            // BL: normally at top=H-SQ. Gets pushed when leadEdge > H-SQ (BL's top)
            // outgoing top = max(outNearEdge, leadEdge)
            outTop = Math.max(outNearEdge, leadEdge);
        }
        gsap.set(outEl, { y: outTop, height: SQ });

        // Buffer
        gsap.set(bufferInEl, { y: proxy.bufferTop, height: SQ });

        // Netz strips: static full-height (0 to H), never animated.
        // Nav quads (z-100) paint over them in the corners.
        // No gap possible regardless of quad positions.
    }

    // ── Build timeline ──
    const tl = gsap.timeline({
        onUpdate: applyProxy,
        onComplete: () => {
            _navQuads.active = _navQuads.active === 'a' ? 'b' : 'a';

            const restoreQuad = (el, pos) => {
                el.style.height = '';
                el.style.top = '';
                el.style.bottom = '';
                el.style.left = '';
                el.style.right = '';
                gsap.set(el, { y: 0, height: '', clearProps: 'transform' });
                if (pos === 'tl') { el.style.top = '0'; el.style.left = '0'; }
                if (pos === 'bl') { el.style.bottom = '0'; el.style.left = '0'; }
                if (pos === 'tr') { el.style.top = '0'; el.style.right = '0'; }
                if (pos === 'br') { el.style.bottom = '0'; el.style.right = '0'; }
            };

            Object.entries(active).forEach(([pos, q]) => {
                q.el.classList.add('nav-buffer');
                restoreQuad(q.el, pos);
            });
            const newActive = _activeSet();
            if (newActive) {
                Object.entries(newActive).forEach(([pos, q]) => {
                    q.el.classList.remove('nav-buffer');
                    restoreQuad(q.el, pos);
                });
            }
            restoreQuad(bufferInEl, inPos);

            _navTween = null;
        }
    });

    /* ── PHASE 1 (0 → p1D): incoming stretches from anchor ── */

    tl.to(proxy, {
        inStretch: peak,
        duration: p1D,
        ease: 'power2.in',
    }, 0);
    // inAnchor stays at inAnchorHome → stretch grows toward outgoing

    /* ── PHASE 2 (p1D → end): de-stretch + slide + buffer ── */

    tl.to(proxy, {
        inStretch: 1,
        duration: p2D,
        ease: 'back.out(1.4)',
    }, p2S);

    tl.to(proxy, {
        inAnchor: inAnchorTarget,
        duration: p2D,
        ease: 'power3.out',
    }, p2S);

    tl.to(proxy, {
        bufferTop: inHomeTop,
        duration: p2D,
        ease: 'power2.out',
    }, p2S);

    _navTween = tl;
    return tl;
}


/* ═══════════════════════════════════════════════════════════════
   INTERNAL HELPERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Build the layout config object that computeLayout() expects,
 * from library node data + section definitions.
 */
/**
 * Create a DOM element for a netzText overlay.
 * Positions: 'above-main', 'below-main', 'above-sub-N'
 * The text sits on the nearest netz quad edge adjacent to the referenced element.
 */
function _createNetzTextEl(nt, mainRect, subGroup, palette) {
    if (!nt || !nt.text || !mainRect) return null;

    const el = document.createElement('div');
    el.className = 'netz-text';
    el.style.position = 'absolute';

    // Multi-line support
    const lines = nt.text.split('\n');
    lines.forEach((line, i) => {
        if (i > 0) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(line));
    });

    // Position based on nt.position
    const GAP = 6; // px gap from the referenced element edge
    if (nt.position === 'above-main') {
        el.style.left = mainRect.x + 'px';
        el.style.top = (mainRect.y - GAP) + 'px';
        el.style.transform = 'translateY(-100%)';
        el.style.maxWidth = mainRect.w + 'px';
    } else if (nt.position === 'below-main') {
        el.style.left = mainRect.x + 'px';
        el.style.top = (mainRect.y + mainRect.h + GAP) + 'px';
        el.style.maxWidth = mainRect.w + 'px';
    } else if (nt.position.startsWith('above-sub-')) {
        const subIdx = parseInt(nt.position.replace('above-sub-', ''), 10);
        const subRect = subGroup[subIdx];
        if (!subRect) return null;
        el.style.left = subRect.x + 'px';
        el.style.top = (subRect.y - GAP) + 'px';
        el.style.transform = 'translateY(-100%)';
        el.style.maxWidth = subRect.w + 'px';
    } else if (nt.position.startsWith('below-sub-')) {
        const subIdx = parseInt(nt.position.replace('below-sub-', ''), 10);
        const subRect = subGroup[subIdx];
        if (!subRect) return null;
        el.style.left = subRect.x + 'px';
        el.style.top = (subRect.y + subRect.h + GAP) + 'px';
        el.style.maxWidth = subRect.w + 'px';
    } else if (nt.position === 'left-of-main') {
        el.style.left = (mainRect.x - GAP) + 'px';
        el.style.top = mainRect.y + 'px';
        el.style.transform = 'translateX(-100%)';
        el.style.maxWidth = mainRect.w + 'px';
    } else if (nt.position === 'right-of-main') {
        el.style.left = (mainRect.x + mainRect.w + GAP) + 'px';
        el.style.top = mainRect.y + 'px';
        el.style.maxWidth = mainRect.w + 'px';
    } else if (nt.position.startsWith('left-of-sub-')) {
        const subIdx = parseInt(nt.position.replace('left-of-sub-', ''), 10);
        const subRect = subGroup[subIdx];
        if (!subRect) return null;
        el.style.left = (subRect.x - GAP) + 'px';
        el.style.top = subRect.y + 'px';
        el.style.transform = 'translateX(-100%)';
        el.style.maxWidth = subRect.w + 'px';
    } else if (nt.position.startsWith('right-of-sub-')) {
        const subIdx = parseInt(nt.position.replace('right-of-sub-', ''), 10);
        const subRect = subGroup[subIdx];
        if (!subRect) return null;
        el.style.left = (subRect.x + subRect.w + GAP) + 'px';
        el.style.top = subRect.y + 'px';
        el.style.maxWidth = subRect.w + 'px';
    }

    return el;
}

function _buildLayoutConfig(nodes, sections, chapterIdx, pageIdx) {
    const mainCount = nodes.length;
    const subsPerMain = [];
    const petsPerMain = [];
    const petsPerSub = [];
    const petData = [];
    const mainAspects = [];
    const subAspects = [];
    const subB2b = [];
    const mainFills = [];
    const subFills = [];

    for (let mi = 0; mi < mainCount; mi++) {
        const node = nodes[mi];
        const children = node.children || [];

        // Count subs (non-pet children)
        subsPerMain.push(children.length);

        // Main aspect: default 3/4, override from node data
        mainAspects.push(node.aspect || LAYOUT_CONST.MAIN_ASPECT);

        // Fill flag: text nodes (or manually set) fill their entire slot
        mainFills.push(!!node.fill);

        // Sub aspects + b2b flags + fill flags
        const sAsp = [];
        const sB2b = [];
        const sFill = [];
        let mainPetCount = 0;
        const mainPets = node.pets || [];
        mainPetCount = mainPets.length;

        for (let si = 0; si < children.length; si++) {
            const sub = children[si];
            sAsp.push(sub.aspect || LAYOUT_CONST.SUB_ASPECT);
            sB2b.push(!!sub.b2b);
            sFill.push(!!sub.fill);

            // Pets per sub
            const subPets = sub.pets || [];
            petsPerSub.push(subPets.length);
            subPets.forEach(p => petData.push(p));
        }
        subAspects.push(sAsp);
        subB2b.push(sB2b);
        subFills.push(sFill);

        // Main's own pets
        petsPerMain.push(mainPetCount);
        mainPets.forEach(p => petData.push(p));
    }

    // Section config: [{mainCount: N}, ...]
    const sectionDefs = (sections && sections.length > 1) ? sections : null;

    const cfg = {
        mainCount,
        subsPerMain,
        petsPerMain,
        petsPerSub,
        petData,
        mainAspects,
        subAspects,
        subB2b,
        mainFills,
        subFills
    };

    if (sectionDefs) {
        cfg.sections = sectionDefs;
    }

    return cfg;
}

/**
 * Render one page's layout elements into a container, offset by yOffset.
 */
function _renderPageIntoContainer(container, layout, nodes, palette, yOffset) {
    // Mains
    layout.mains.forEach((rect, i) => {
        const node = nodes[i];
        const el = _createNodeEl('main', rect, node, i, palette);
        _offsetEl(el, yOffset);
        container.appendChild(el);
    });

    // Subs
    layout.subs.forEach((group, mainIdx) => {
        group.forEach((rect, subIdx) => {
            const mainNode = nodes[mainIdx];
            const subNode = mainNode && mainNode.children ? mainNode.children[subIdx] : null;
            const el = _createNodeEl('sub', rect, subNode, subIdx, palette);
            _offsetEl(el, yOffset);
            container.appendChild(el);
        });
    });

    // Pets
    layout.pets.forEach((pet, i) => {
        const rect = { x: pet.x - pet.w / 2, y: pet.y - pet.h / 2, w: pet.w, h: pet.h };
        const el = _createNodeEl('pet', rect, pet.data, i, palette);
        _offsetEl(el, yOffset);
        container.appendChild(el);
    });

    // Netz
    layout.netz.forEach((nz) => {
        if (nz.type !== 'rect') return;
        const el = document.createElement('div');
        el.className = 'netz-quad';
        el.style.cssText = `left:${nz.x}px; top:${nz.y + yOffset}px; width:${nz.w}px; height:${nz.h}px;`;

        if (DEBUG) {
            const label = document.createElement('span');
            label.className = 'debug-label';
            label.textContent = `${nz.id} ${nz.w}×${nz.h}`;
            el.appendChild(label);
        }

        container.appendChild(el);
    });
}

/**
 * Create a content node DOM element (main, sub, or pet).
 * Renders real content: images, videos, text nodes.
 * Falls back to colored placeholder if no media URL.
 */
function _createNodeEl(type, rect, nodeData, index, palette) {
    const el = document.createElement('div');
    el.className = 'content-node';
    el.dataset.type = type;
    el.dataset.index = index;

    el.style.cssText = `
        left: ${rect.x}px;
        top: ${rect.y}px;
        width: ${rect.w}px;
        height: ${rect.h}px;
    `;

    const nodeType = nodeData ? (nodeData.type || 'image') : 'image';
    const imageUrl = nodeData ? nodeData.image : null;
    const videoUrl = nodeData ? nodeData.video : null;

    if (nodeType === 'video' && videoUrl) {
        /* ── Video ── */
        const vid = document.createElement('video');
        vid.src = videoUrl;
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        vid.setAttribute('playsinline', '');
        vid.preload = 'metadata';
        el.appendChild(vid);

    } else if (nodeType === 'text') {
        /* ── Text node ── */
        el.classList.add('text-node');
        el.style.backgroundColor = palette.secondary;

        let titleEl = null, bodyEl = null;
        if (nodeData && nodeData.title) {
            titleEl = document.createElement('h3');
            titleEl.textContent = nodeData.title;
            el.appendChild(titleEl);
        }
        if (nodeData && nodeData.text) {
            bodyEl = document.createElement('p');
            bodyEl.textContent = nodeData.text;
            el.appendChild(bodyEl);
        }

        // Math-based font-size + padding: adapts to box size + text length
        const padFrac = 0.08;
        const padH = Math.round(rect.w * padFrac); // horizontal padding
        const padV = Math.round(rect.h * padFrac); // vertical padding (based on HEIGHT, not width!)
        el.style.padding = `${padV}px ${padH}px`;

        const fullText = ((nodeData && nodeData.title) || '') + ' ' + ((nodeData && nodeData.text) || '');
        if (fullText.trim().length > 0) {
            const fs = _calcTextFontSize(rect.w, rect.h, fullText.trim(), { padFrac });
            if (DEBUG) console.log('[TextSize]', { boxW: rect.w, boxH: rect.h, innerH: Math.round(rect.h*(1-2*padFrac)), chars: fullText.trim().length, fontSize: fs });
            // Title gets ~1.3× body size
            if (bodyEl)  bodyEl.style.fontSize = fs + 'px';
            if (titleEl) titleEl.style.fontSize = Math.round(fs * 1.3) + 'px';
        }

    } else if (imageUrl) {
        /* ── Image ── */
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = (nodeData && nodeData.id) || '';
        img.loading = 'lazy';
        img.draggable = false;
        // PNGs get a netz-colored backdrop so transparency is visible;
        // other formats clear their loading background once loaded.
        const isPng = /\.png($|\?)/i.test(imageUrl);
        const netzBg = _hexAlpha(palette.primary, 0.7);
        el.style.backgroundColor = isPng ? netzBg : palette.surface;
        if (!isPng) {
            img.onload = () => { el.style.backgroundColor = ''; };
        }
        el.appendChild(img);

    } else {
        /* ── Fallback: colored placeholder ── */
        el.classList.add('placeholder');
        const colors = { main: palette.secondary, sub: palette.accent, pet: palette.primary };
        el.style.backgroundColor = _hexAlpha(colors[type] || '#888', type === 'pet' ? 0.4 : 0.6);
        const label = nodeData && nodeData.id ? nodeData.id : `${type}-${index}`;
        el.textContent = `${type.toUpperCase()} ${label}`;
    }

    return el;
}

/**
 * Offset an element's top position by yOffset.
 */
function _offsetEl(el, yOffset) {
    if (yOffset === 0) return;
    const currentTop = parseInt(el.style.top, 10) || 0;
    el.style.top = (currentTop + yOffset) + 'px';
}

/**
 * Convert hex color to rgba with alpha.
 */
function _hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Pre-blend a foreground hex color at a given opacity onto a background hex color.
 * Returns an opaque rgb() string that visually matches the semi-transparent result.
 * Used by strips so they're fully opaque (block content behind) yet look identical
 * to netz quads at 0.7 opacity.
 */
function _preblend(fgHex, alpha, bgHex = '#111111') {
    const fr = parseInt(fgHex.slice(1, 3), 16);
    const fg = parseInt(fgHex.slice(3, 5), 16);
    const fb = parseInt(fgHex.slice(5, 7), 16);
    const br = parseInt(bgHex.slice(1, 3), 16);
    const bg = parseInt(bgHex.slice(3, 5), 16);
    const bb = parseInt(bgHex.slice(5, 7), 16);
    const r = Math.round(br * (1 - alpha) + fr * alpha);
    const g = Math.round(bg * (1 - alpha) + fg * alpha);
    const b = Math.round(bb * (1 - alpha) + fb * alpha);
    return `rgb(${r},${g},${b})`;
}

/**
 * Handle resize: re-measure viewport.
 * (Actual re-render is triggered by app.js)
 */
function _onResize() {
    _W = window.innerWidth;
    _H = window.innerHeight;
    _sizeNavQuads();
}
