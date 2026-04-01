/* ═══════════════════════════════════════════════════════════════
   ENGINE.JS — CDS Website 6.1 — Continuous Chapter Scroll

   One scroll container per chapter, ALL pages stacked vertically.
   GSAP timelines for chapter transitions (X-axis).
   Smooth scroll to page boundaries (Y-axis, nav animation only).
   Nav quadrants as 4 fixed DOM divs with fill-box text.
   ═══════════════════════════════════════════════════════════════ */

import gsap from 'gsap';
import { CSSPlugin } from 'gsap/CSSPlugin';
import Observer from 'gsap/Observer';
import {
    LIBRARY, getActivePalette, NAV_TEXT_MODE,
    getChapterCount, getPageCount, getMainNodesForPage, getPageSections,
    CHAPTER_DEFS
} from './library.js';
import { computeLayout, LAYOUT_CONST } from './layout.js';

gsap.registerPlugin(CSSPlugin, Observer);

/* ═══════════════════════════════════════════════════════════════
   ANIMATION CONFIG
   ═══════════════════════════════════════════════════════════════ */
const ANIM = {
    duration:      0.9,
    resetDelay:    0.2,
    ease:          'power2.inOut',
    stretchPeak:   2.2,
    phase1End:     0.35,
    phase1Retreat: 0.3,
};

const OVERSCROLL_THRESHOLD = 150;
const HSCROLL_THRESHOLD    = 200;

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */
let W = window.innerWidth;
let H = window.innerHeight;
let currentChapter = 0, currentPage = 0;
let currentLayout  = null;    // { SQ, totalContentHeight, navTL/TR/BL/BR }
let panY = 0;
let isAnimating    = false;
let isFrozen       = false;
let overscrollAcc  = 0, overscrollDir = 0;
let _hScrollAcc = 0, _hScrollDir = 0, _hScrollCooldown = false;
let _pointerDragging = false;

/* Chapter data */
let chapterContainer = null;   // the single DOM container for the current chapter
let pageBoundaries   = [];     // [{startY, endY, pageIdx}, ...]
let totalChapterHeight = 0;

/* ── DOM refs ── */
let contentLayer, flashEl;
let navEls  = {};   // { tl, tr, bl, br }
let edgeEls = {};   // { top, bottom, left, right }

/* ═══════════════════════════════════════════════════════════════
   FILL-BOX TEXT HELPERS  (from shared/helpers.js)
   ═══════════════════════════════════════════════════════════════ */

/** Split text: spaces separate, hyphens become own tokens */
function splitFillBoxWords(text) {
    var clean = text.replace(/<[^>]*>/g, '');
    var tokens = [], buf = '';
    for (var i = 0; i < clean.length; i++) {
        var ch = clean[i];
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
            if (buf) { tokens.push(buf); buf = ''; }
        } else if (ch === '-' || ch === '\u2010' || ch === '\u2011') {
            if (buf) { tokens.push(buf); buf = ''; }
            tokens.push('-');
        } else { buf += ch; }
    }
    if (buf) tokens.push(buf);
    return tokens;
}

/** Distribute words into numLines lines, balanced by visual width */
function distributeToLines(ctx, words, numLines) {
    if (numLines >= words.length) return words.map(function (w) { return [w]; });
    if (numLines <= 1) return [words.slice()];
    ctx.font = '100px sans-serif';
    var widths = words.map(function (w) { return ctx.measureText(w).width; });
    var totalW = widths.reduce(function (a, b) { return a + b; }, 0);
    var cumW = [], sum = 0;
    for (var i = 0; i < widths.length; i++) { sum += widths[i]; cumW.push(sum); }
    var breaks = [];
    for (var b = 1; b < numLines; b++) {
        var target = totalW * b / numLines;
        var lo = breaks.length > 0 ? breaks[breaks.length - 1] : 0;
        var hi = words.length - (numLines - b);
        var bestIdx = lo, bestDist = Infinity;
        for (var j = lo; j < hi; j++) {
            var d = Math.abs(cumW[j] - target);
            if (d < bestDist) { bestDist = d; bestIdx = j + 1; }
        }
        if (bestIdx <= lo) bestIdx = lo + 1;
        breaks.push(bestIdx);
    }
    var lines = [], prev = 0;
    for (var k = 0; k < breaks.length; k++) { lines.push(words.slice(prev, breaks[k])); prev = breaks[k]; }
    lines.push(words.slice(prev));
    return lines.filter(function (l) { return l.length > 0; });
}

/**
 * Compute fill-box layout: each line fills the width at its own font size.
 * Returns { lines: [{words, wordWidths, fontSize, lineH, gap}], totalH }
 */
function computeFillBox(ctx, words, usableW, usableH) {
    var maxLines = Math.min(words.length, 12);
    var bestTotalH = 0, bestResult = null;
    var ref = 200, LS = 1.08;
    for (var numLines = 1; numLines <= maxLines; numLines++) {
        var dist = distributeToLines(ctx, words, numLines);
        var totalH = 0, lineData = [], valid = true;
        for (var li = 0; li < dist.length; li++) {
            var lw = dist[li];
            ctx.font = ref + 'px sans-serif';
            var natW = lw.map(function (w) { return ctx.measureText(w).width; });
            var sumNat = natW.reduce(function (a, b) { return a + b; }, 0);
            if (sumNat <= 0) { valid = false; break; }
            var gapCount = lw.length - 1;
            var fontSize = ref * usableW / sumNat;
            var gap = gapCount > 0 ? fontSize * 0.06 : 0;
            fontSize = ref * (usableW - gap * gapCount) / sumNat;
            gap = gapCount > 0 ? fontSize * 0.06 : 0;
            fontSize = ref * (usableW - gap * gapCount) / sumNat;
            if (fontSize < 4) { valid = false; break; }
            var lineH = fontSize * LS;
            totalH += lineH;
            ctx.font = Math.round(fontSize) + 'px sans-serif';
            var ww = lw.map(function (w) { return ctx.measureText(w).width; });
            lineData.push({ words: lw, wordWidths: ww, fontSize: fontSize, lineH: lineH, gap: gap });
        }
        if (!valid || totalH > usableH + 1) continue;
        if (totalH > bestTotalH) { bestTotalH = totalH; bestResult = { lines: lineData, totalH: totalH }; }
    }
    return bestResult;
}

/** Hidden canvas for fill-box measurement (shared) */
var _measureCvs = null;
function _getMeasureCtx() {
    if (!_measureCvs) { _measureCvs = document.createElement('canvas'); }
    return _measureCvs.getContext('2d');
}

/**
 * Build fill-box text as DOM elements inside a container.
 */
function _buildFillBoxDom(text, container, hAlign, vAlign) {
    var ctx = _getMeasureCtx();
    var cW = parseFloat(container.style.width) || container.offsetWidth || 100;
    var cH = parseFloat(container.style.height) || container.offsetHeight || 100;
    var padRatio = 0.06;
    var padPx = Math.round(cW * padRatio);
    var usW = cW - 2 * padPx;
    var usH = cH - 2 * padPx;

    var words = splitFillBoxWords(text);
    if (words.length === 0) return;

    var layout = computeFillBox(ctx, words, usW, usH);
    if (!layout) return;

    var extraV = usH - layout.totalH;
    var yOff;
    if (vAlign === 'top') yOff = padPx;
    else if (vAlign === 'bottom') yOff = padPx + extraV;
    else yOff = padPx + extraV / 2;

    var wrapper = document.createElement('div');
    wrapper.className = 'fillbox';

    var cumY = 0;
    for (var li = 0; li < layout.lines.length; li++) {
        var line = layout.lines[li];
        var y = yOff + cumY;
        var goRight;
        if (hAlign === 'left') goRight = false;
        else if (hAlign === 'right') goRight = true;
        else goRight = (li % 2 !== 0);

        var lineEl = document.createElement('div');
        lineEl.className = 'fillbox-line';
        lineEl.style.top = y + 'px';
        lineEl.style.fontSize = Math.round(line.fontSize) + 'px';

        if (goRight) {
            lineEl.style.right = padPx + 'px';
            lineEl.style.textAlign = 'right';
            for (var wi = line.words.length - 1; wi >= 0; wi--) {
                var span = document.createElement('span');
                span.textContent = line.words[wi];
                if (wi < line.words.length - 1) span.style.marginRight = line.gap + 'px';
                lineEl.appendChild(span);
            }
        } else {
            lineEl.style.left = padPx + 'px';
            lineEl.style.textAlign = 'left';
            for (var wi2 = 0; wi2 < line.words.length; wi2++) {
                var span2 = document.createElement('span');
                span2.textContent = line.words[wi2];
                if (wi2 > 0) span2.style.marginLeft = line.gap + 'px';
                lineEl.appendChild(span2);
            }
        }

        wrapper.appendChild(lineEl);
        cumY += line.lineH;
    }

    container.appendChild(wrapper);
}

/**
 * Build fill-box text for content area (centered, alternating alignment).
 */
function _buildContentText(text, container) {
    var paragraphs = text.split('\n');
    var hasExplicitBreaks = paragraphs.length > 1;

    if (!hasExplicitBreaks) {
        _buildFillBoxDom(text, container, 'alternate', 'center');
    } else {
        var ctx = _getMeasureCtx();
        var cW = parseFloat(container.style.width) || container.offsetWidth || 100;
        var cH = parseFloat(container.style.height) || container.offsetHeight || 100;
        var padPx = Math.round(cW * 0.04);
        var usableW = cW - 2 * padPx;
        var usableH = cH - 2 * padPx;
        var ref = 200, LS = 1.35;

        var lines = paragraphs.filter(function (p) { return p.trim().length > 0; });
        if (lines.length === 0) return;

        ctx.font = ref + 'px sans-serif';
        var maxNatW = 0;
        for (var i = 0; i < lines.length; i++) {
            var w = ctx.measureText(lines[i]).width;
            if (w > maxNatW) maxNatW = w;
        }
        if (maxNatW <= 0) return;

        var fontSize = ref * usableW / maxNatW;
        var totalH = fontSize * LS * lines.length;
        if (totalH > usableH) fontSize = usableH / (LS * lines.length);
        if (fontSize < 4) return;

        var lineH = fontSize * LS;
        var blockH = lineH * lines.length;
        var yStart = padPx + (usableH - blockH) / 2;

        var wrapper = document.createElement('div');
        wrapper.className = 'fillbox';
        wrapper.style.color = getActivePalette().accent;

        for (var li = 0; li < lines.length; li++) {
            var lineEl = document.createElement('div');
            lineEl.className = 'fillbox-line';
            lineEl.style.top = (yStart + li * lineH) + 'px';
            lineEl.style.left = padPx + 'px';
            lineEl.style.fontSize = Math.round(fontSize) + 'px';
            lineEl.textContent = lines[li];
            wrapper.appendChild(lineEl);
        }

        container.appendChild(wrapper);
    }
}

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
function init() {
    console.log('[CDS 6.1] init() starting…', W + 'x' + H);
    W = window.innerWidth;
    H = window.innerHeight;

    /* Apply palette CSS custom properties */
    var pal = getActivePalette();
    var r = document.documentElement.style;
    r.setProperty('--pal-primary',   pal.primary);
    r.setProperty('--pal-secondary', pal.secondary);
    r.setProperty('--pal-accent',    pal.accent);

    /* DOM refs */
    contentLayer = document.getElementById('content-layer');
    flashEl      = document.getElementById('flash');
    navEls.tl    = document.getElementById('nav-tl');
    navEls.tr    = document.getElementById('nav-tr');
    navEls.bl    = document.getElementById('nav-bl');
    navEls.br    = document.getElementById('nav-br');
    edgeEls.top    = document.getElementById('edge-top');
    edgeEls.bottom = document.getElementById('edge-bottom');
    edgeEls.left   = document.getElementById('edge-left');
    edgeEls.right  = document.getElementById('edge-right');

    /* Events */
    window.addEventListener('resize', _onResize);
    _setupInput();
    _setupNavClicks();

    /* Show first chapter */
    showChapter(0);
}

/* ═══════════════════════════════════════════════════════════════
   DATA BRIDGE: LIBRARY → Layout Config
   ═══════════════════════════════════════════════════════════════ */
function _buildPageConfig(nodes, aspects, sectionDefs) {
    var subsPerMainArr = [], petsPerMainArr = [], petsPerSubArr = [], petDataArr = [];
    var subB2bArr = [];
    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        subsPerMainArr.push(n.children ? n.children.length : 0);
        petsPerMainArr.push(n.pets ? n.pets.length : 0);
        if (n.pets) n.pets.forEach(function (p) { petDataArr.push(p); });
        var b2bs = [];
        if (n.children) n.children.forEach(function (ch) {
            petsPerSubArr.push(ch.pets ? ch.pets.length : 0);
            b2bs.push(!!ch.b2b);
        });
        subB2bArr.push(b2bs);
    }
    return {
        mainCount: nodes.length, subsPerMain: subsPerMainArr,
        petsPerMain: petsPerMainArr, petsPerSub: petsPerSubArr, petData: petDataArr,
        mainAspects: aspects ? aspects.mainAspects : null,
        subAspects: aspects ? aspects.subAspects : null,
        subB2b: subB2bArr,
        sections: sectionDefs || null
    };
}

/* ═══════════════════════════════════════════════════════════════
   COLUMNS PAGE HELPERS
   ═══════════════════════════════════════════════════════════════ */
function _isColumnsPage(ch, pg) {
    var lib = LIBRARY[ch];
    if (!lib) return false;
    var page = lib.pages[pg];
    return page && page.length === 1 && page[0] && page[0].layout === 'columns';
}

/** Compute dimensions for a columns page (without building DOM) */
function _computeColumnsLayout(ch, pg, SQ) {
    var page = LIBRARY[ch].pages[pg];
    var colData = page[0];
    var numCols = colData.columns.length;
    var innerW = W - 2 * SQ;
    var gap = 2;
    var colW = Math.floor((innerW - (numCols - 1) * gap) / numCols);
    var subCols = 3;
    var subGap = 1;
    var subW = Math.floor((colW - (subCols - 1) * subGap) / subCols);

    var maxH = 0;
    for (var ci = 0; ci < numCols; ci++) {
        var items = colData.columns[ci].items;
        var rows = Math.ceil(items.length / subCols);
        var colH = SQ + rows * (subW + subGap);
        if (colH > maxH) maxH = colH;
    }

    return {
        height: maxH + SQ,
        colData: colData,
        baseUrl: colData.baseUrl,
        colW: colW, numCols: numCols,
        subCols: subCols, subGap: subGap, subW: subW, gap: gap
    };
}

/** Append columns page content to a container at the given Y offset */
function _appendColumnsContent(container, colLayout, yOffset, SQ) {
    var baseUrl = colLayout.baseUrl || colLayout.colData.baseUrl;
    var colData = colLayout.colData;

    for (var ci = 0; ci < colLayout.numCols; ci++) {
        var items = colData.columns[ci].items;
        var colGroup = document.createElement('div');
        colGroup.className = 'column-group';
        colGroup.style.left = (SQ + ci * (colLayout.colW + colLayout.gap)) + 'px';
        colGroup.style.top = yOffset + 'px';
        colGroup.style.width = colLayout.colW + 'px';

        var cy = SQ;
        for (var ti = 0; ti < items.length; ti++) {
            var col3 = ti % colLayout.subCols;
            var px = col3 * (colLayout.subW + colLayout.subGap);

            var thumb = document.createElement('div');
            thumb.className = 'column-thumb';
            thumb.style.left = px + 'px';
            thumb.style.top = cy + 'px';
            thumb.style.width = colLayout.subW + 'px';
            thumb.style.height = colLayout.subW + 'px';

            var img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            img.loading = 'lazy';
            img.src = baseUrl + items[ti];
            (function (thumbEl, sw) {
                img.onload = function () {
                    var aspect = (this.naturalWidth || 1) / (this.naturalHeight || 1);
                    thumbEl.style.height = Math.round(sw / aspect) + 'px';
                };
            })(thumb, colLayout.subW);
            thumb.appendChild(img);
            colGroup.appendChild(thumb);

            if (col3 === colLayout.subCols - 1 || ti === items.length - 1) {
                cy += colLayout.subW + colLayout.subGap;
            }
        }
        container.appendChild(colGroup);
    }
}

/* ═══════════════════════════════════════════════════════════════
   CHAPTER BUILDING — builds ALL pages as one scrollable container
   ═══════════════════════════════════════════════════════════════ */

/**
 * Build chapter data + DOM without inserting into the document.
 * Returns { container, pageBoundaries, totalHeight, layout }.
 */
function _buildChapter(ch) {
    var SQ = Math.round(Math.min(W, H) * LAYOUT_CONST.SQ_RATIO);
    var pageCount = getPageCount(ch);
    var boundaries = [];
    var cumY = 0;
    var allPageData = [];

    for (var pg = 0; pg < pageCount; pg++) {
        if (_isColumnsPage(ch, pg)) {
            var colData = _computeColumnsLayout(ch, pg, SQ);
            allPageData.push({ type: 'columns', data: colData, yOffset: cumY, pg: pg });
            boundaries.push({ startY: cumY, endY: cumY + colData.height, pageIdx: pg });
            cumY += colData.height;
        } else {
            var nodes = getMainNodesForPage(ch, pg);
            var sectionDefs = getPageSections(ch, pg);
            var cfg = _buildPageConfig(nodes, null, sectionDefs);
            var layout = computeLayout(cfg, W, H);
            allPageData.push({ type: 'normal', layout: layout, nodes: nodes, yOffset: cumY, pg: pg });
            boundaries.push({ startY: cumY, endY: cumY + layout.totalContentHeight, pageIdx: pg });
            cumY += layout.totalContentHeight;
        }
    }

    var chLayout = {
        SQ: SQ,
        totalContentHeight: cumY,
        navTL: { x: 0, y: 0, w: SQ, h: SQ },
        navTR: { x: W - SQ, y: 0, w: SQ, h: SQ },
        navBL: { x: 0, y: H - SQ, w: SQ, h: SQ },
        navBR: { x: W - SQ, y: H - SQ, w: SQ, h: SQ }
    };

    var container = _buildChapterDom(allPageData, SQ, cumY);

    return {
        container: container,
        pageBoundaries: boundaries,
        totalHeight: cumY,
        layout: chLayout
    };
}

/**
 * Show a chapter: build + insert into DOM + set scroll position.
 * @param {number} ch — chapter index
 * @param {object} [opts] — { landAtEnd, targetPage }
 */
function showChapter(ch, opts) {
    opts = opts || {};
    currentChapter = ch;

    var result = _buildChapter(ch);
    pageBoundaries = result.pageBoundaries;
    totalChapterHeight = result.totalHeight;
    currentLayout = result.layout;

    _clearPage();
    chapterContainer = result.container;
    contentLayer.appendChild(chapterContainer);

    if (opts.landAtEnd) {
        panY = Math.max(0, totalChapterHeight - H);
    } else if (opts.targetPage !== undefined && pageBoundaries[opts.targetPage]) {
        panY = pageBoundaries[opts.targetPage].startY;
    } else {
        panY = 0;
    }

    _clampPan();
    _applyPan();
    _updateCurrentPage();
    _updateNavQuads();
    _updateEdgeStrips();

    console.log('[CDS 6.1] showChapter(' + ch + ') pages=' + pageBoundaries.length +
        ' totalH=' + totalChapterHeight);
}

/**
 * Build the combined DOM container for all pages in a chapter.
 */
function _buildChapterDom(allPageData, SQ, totalH) {
    var pal = getActivePalette();
    var container = document.createElement('div');
    container.className = 'page-container';
    container.style.width  = W + 'px';
    container.style.height = totalH + 'px';

    /* Collect ALL content rects (with global Y offsets) for unified netz */
    var allMainRects = [];
    var allSubRects  = [];
    var columnsBlockers = [];

    for (var i = 0; i < allPageData.length; i++) {
        var pd = allPageData[i];
        var yOff = pd.yOffset;

        if (pd.type === 'columns') {
            /* Columns page — custom DOM, block area for netz */
            _appendColumnsContent(container, pd.data, yOff, SQ);
            columnsBlockers.push({
                x: SQ, y: yOff, r: W - SQ, b: yOff + pd.data.height
            });
        } else {
            /* Normal page — build mains, subs, pets, netz-text overlays */
            var layout = pd.layout;
            var nodes  = pd.nodes;

            /* ── Mains ── */
            layout.mains.forEach(function (m, mi) {
                var node = nodes[mi];
                if (!node) return;
                var oRect = {
                    x: m.x, y: m.y + yOff, w: m.w, h: m.h,
                    r: m.r, b: m.b + yOff
                };
                allMainRects.push(oRect);
                var el = _createMediaElement(oRect, node);
                if (el) container.appendChild(el);
            });

            /* ── Subs ── */
            layout.subs.forEach(function (group, gi) {
                group.forEach(function (s, si) {
                    var node = nodes[gi] && nodes[gi].children && nodes[gi].children[si]
                        ? nodes[gi].children[si] : null;
                    if (!node) return;
                    var oRect = {
                        x: s.x, y: s.y + yOff, w: s.w, h: s.h,
                        r: s.r, b: s.b + yOff
                    };
                    allSubRects.push(oRect);
                    var el = _createMediaElement(oRect, node);
                    if (el) container.appendChild(el);
                });
            });

            /* ── Pets ── */
            if (layout.pets) {
                layout.pets.forEach(function (pet) {
                    var petNode = null;
                    if (pet.parentType === 'main' && nodes[pet.parentIndex]) {
                        var mn = nodes[pet.parentIndex];
                        if (mn.pets && mn.pets[pet.petIndex]) petNode = mn.pets[pet.petIndex];
                    } else if (pet.parentType === 'sub' && nodes[pet.parentIndex]) {
                        var mn2 = nodes[pet.parentIndex];
                        if (mn2.children && mn2.children[pet.subIndex]) {
                            var sn = mn2.children[pet.subIndex];
                            if (sn.pets && sn.pets[pet.petIndex]) petNode = sn.pets[pet.petIndex];
                        }
                    }
                    if (petNode && (petNode.image || petNode.video || petNode.type === 'text')) {
                        var el = _createMediaElement(
                            { x: pet.x - pet.w / 2, y: pet.y - pet.h / 2 + yOff,
                              w: pet.w, h: pet.h },
                            petNode
                        );
                        if (el) { el.classList.add('pet-node'); container.appendChild(el); }
                    }
                });
            }

            /* ── Netz text overlays ── */
            nodes.forEach(function (node, mi) {
                if (!node.netzTexts || node.netzTexts.length === 0) return;
                var mainRect = layout.mains[mi];
                if (!mainRect) return;
                var subRects = layout.subs[mi] || [];
                node.netzTexts.forEach(function (nt) {
                    var matched = _findNetzByPosition(
                        layout.netz, nt.position, mainRect, subRects, layout.SQ
                    );
                    if (matched && matched.type === 'rect') {
                        var el = document.createElement('div');
                        el.className = 'content-node';
                        el.style.left   = matched.x + 'px';
                        el.style.top    = (matched.y + yOff) + 'px';
                        el.style.width  = matched.w + 'px';
                        el.style.height = matched.h + 'px';
                        el.style.backgroundColor = pal.primary;
                        el.style.zIndex = '1';
                        _buildContentText(nt.text, el);
                        container.appendChild(el);
                    }
                });
            });
        }
    }

    /* ── Unified netz for entire chapter ── */
    var netz = _buildChapterNetz(allMainRects, allSubRects, columnsBlockers, SQ, totalH);
    netz.forEach(function (nq) {
        if (nq.type !== 'rect') return;
        var el = document.createElement('div');
        el.className = 'netz-quad';
        el.style.left   = nq.x + 'px';
        el.style.top    = nq.y + 'px';
        el.style.width  = nq.w + 'px';
        el.style.height = nq.h + 'px';
        /* Debug label — show ID + size (only on quads large enough to read) */
        if (nq.w > 40 && nq.h > 16) {
            var lbl = document.createElement('span');
            lbl.className = 'netz-label';
            lbl.textContent = nq.id + ' ' + Math.round(nq.w) + '\u00d7' + Math.round(nq.h);
            el.appendChild(lbl);
        }
        container.appendChild(el);
    });

    return container;
}

function _clearPage() {
    if (chapterContainer && chapterContainer.parentNode) {
        chapterContainer.parentNode.removeChild(chapterContainer);
    }
    chapterContainer = null;
}

/* ═══════════════════════════════════════════════════════════════
   NETZ HELPERS  (unified chapter netz — no nav-quad blockers)
   ═══════════════════════════════════════════════════════════════ */
function _netzUSort(a) {
    var s = {}, r = [];
    a.forEach(function (v) { if (!s[v]) { s[v] = 1; r.push(v); } });
    r.sort(function (a, b) { return a - b; });
    return r;
}

function _netzOverAny(x, y, r, b, occ) {
    for (var i = 0; i < occ.length; i++) {
        var o = occ[i];
        if (x < o.r - 1 && r > o.x + 1 && y < o.b - 1 && b > o.y + 1) return true;
    }
    return false;
}

function _netzMergeV(netz) {
    var changed = true;
    while (changed) {
        changed = false;
        netz.sort(function (a, b) { return (a.x - b.x) || (a.w - b.w) || (a.y - b.y); });
        for (var i = 0; i < netz.length - 1; i++) {
            var a = netz[i], b = netz[i + 1];
            if (a.type === 'rect' && b.type === 'rect' &&
                a.x === b.x && a.w === b.w && a.y + a.h === b.y) {
                netz[i] = { id: a.id, type: 'rect', x: a.x, y: a.y, w: a.w, h: a.h + b.h };
                netz.splice(i + 1, 1); changed = true; i--;
            }
        }
    }
    return netz;
}

/**
 * Build a single netz grid for the entire chapter.
 * No nav-quad blockers — nav quads are fixed overlays on top.
 */
function _buildChapterNetz(mainRects, subRects, columnsBlockers, SQ, totalH) {
    var xC = [0, SQ, W - SQ, W];
    var yC = [0, totalH];

    mainRects.forEach(function (m) { xC.push(m.x, m.r); yC.push(m.y, m.b); });
    subRects.forEach(function (s) { xC.push(s.x, s.r); yC.push(s.y, s.b); });
    columnsBlockers.forEach(function (b) { xC.push(b.x, b.r); yC.push(b.y, b.b); });

    xC = _netzUSort(xC);
    yC = _netzUSort(yC);

    var occ = [];
    mainRects.forEach(function (m) { occ.push({ x: m.x, y: m.y, r: m.r, b: m.b }); });
    subRects.forEach(function (s) { occ.push({ x: s.x, y: s.y, r: s.r, b: s.b }); });
    columnsBlockers.forEach(function (b) { occ.push(b); });

    var netz = [], nI = 0;
    for (var xi = 0; xi < xC.length - 1; xi++) {
        for (var yi = 0; yi < yC.length - 1; yi++) {
            var cx = xC[xi], cy = yC[yi], cw = xC[xi + 1] - cx, ch = yC[yi + 1] - cy;
            if (cw < 2 || ch < 2) continue;
            if (!_netzOverAny(cx, cy, cx + cw, cy + ch, occ)) {
                netz.push({ id: 'n' + (nI++), type: 'rect', x: cx, y: cy, w: cw, h: ch });
            }
        }
    }
    return _netzMergeV(netz);
}

/* ═══════════════════════════════════════════════════════════════
   MEDIA ELEMENT CREATION
   ═══════════════════════════════════════════════════════════════ */
function _createMediaElement(rect, nodeData) {
    if (!nodeData) return null;
    var pal = getActivePalette();
    var el = document.createElement('div');
    el.className = 'content-node';
    el.style.left   = rect.x + 'px';
    el.style.top    = rect.y + 'px';
    el.style.width  = rect.w + 'px';
    el.style.height = rect.h + 'px';

    if (nodeData.type === 'image' && (nodeData.image || nodeData.url)) {
        var url = nodeData.image || nodeData.url;
        if (url.toLowerCase().split('?')[0].endsWith('.png')) {
            el.style.backgroundColor = pal.primary;
        }
        var img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.loading = 'lazy';
        img.src = url;
        el.appendChild(img);
    } else if (nodeData.type === 'video' && (nodeData.video || nodeData.url)) {
        var vUrl = nodeData.video || nodeData.url;
        var video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = vUrl;
        video.loop = true; video.muted = true; video.playsInline = true; video.autoplay = true;
        video.play().catch(function () {});
        el.appendChild(video);
    } else if (nodeData.type === 'text') {
        el.style.backgroundColor = pal.primary;
        var text = nodeData.title || nodeData.text || '';
        if (text) _buildContentText(text, el);
    }

    return el;
}

/* ═══════════════════════════════════════════════════════════════
   NETZ TEXT POSITION MATCHING
   ═══════════════════════════════════════════════════════════════ */
function _findNetzByPosition(netzArr, position, mainRect, subRects, SQ) {
    var rects = netzArr.filter(function (n) { return n.type === 'rect'; });
    if (position === 'above-main') return _bestNetz(rects, mainRect, 'above');
    if (position === 'below-main') return _bestNetz(rects, mainRect, 'below');
    if (position.indexOf('above-sub-') === 0) {
        var si = parseInt(position.replace('above-sub-', ''), 10);
        return subRects[si] ? _bestNetz(rects, subRects[si], 'above') : null;
    }
    if (position.indexOf('below-sub-') === 0) {
        var si2 = parseInt(position.replace('below-sub-', ''), 10);
        return subRects[si2] ? _bestNetz(rects, subRects[si2], 'below') : null;
    }
    return null;
}

function _bestNetz(rects, ref, dir) {
    var refL = ref.x, refR = ref.r || (ref.x + ref.w);
    var refT = ref.y, refB = ref.b || (ref.y + ref.h);
    var best = null, bestDist = Infinity;
    for (var i = 0; i < rects.length; i++) {
        var nq = rects[i];
        var nL = nq.x, nR = nq.x + nq.w, nT = nq.y, nB = nq.y + nq.h;
        var overlapX = Math.min(nR, refR) - Math.max(nL, refL);
        if (overlapX < 2) continue;
        if (dir === 'above') {
            var dist = Math.abs(nB - refT);
            if (dist < 5 && dist < bestDist) { bestDist = dist; best = nq; }
        } else if (dir === 'below') {
            var dist2 = Math.abs(nT - refB);
            if (dist2 < 5 && dist2 < bestDist) { bestDist = dist2; best = nq; }
        }
    }
    return best;
}

/* ═══════════════════════════════════════════════════════════════
   PAGE TRACKING  (dynamic page detection from scroll position)
   ═══════════════════════════════════════════════════════════════ */
function _updateCurrentPage() {
    var oldPage = currentPage;
    currentPage = 0;
    for (var i = 0; i < pageBoundaries.length; i++) {
        if (panY >= pageBoundaries[i].startY) {
            currentPage = pageBoundaries[i].pageIdx;
        }
    }
    if (currentPage !== oldPage) {
        _updateNavQuads();
    }
}

/* ═══════════════════════════════════════════════════════════════
   NAV QUADRANTS
   ═══════════════════════════════════════════════════════════════ */
function _updateNavQuads() {
    var SQ = currentLayout ? currentLayout.SQ : Math.round(Math.min(W, H) * 0.25);

    _positionNavQuad(navEls.tl, 0, 0, SQ, SQ);
    _positionNavQuad(navEls.tr, W - SQ, 0, SQ, SQ);
    _positionNavQuad(navEls.bl, 0, H - SQ, SQ, SQ);
    _positionNavQuad(navEls.br, W - SQ, H - SQ, SQ, SQ);

    var ch = currentChapter, pg = currentPage;
    var pageNames = LIBRARY[ch] && LIBRARY[ch].pageNames ? LIBRARY[ch].pageNames : null;
    var pageLabel = pageNames && pageNames[pg] ? pageNames[pg] : 'page ' + (pg + 1);

    /* TL: current page label (navigate up) */
    _fillNavQuad(navEls.tl, pageLabel, 'left', 'top');

    /* TR: next chapter name (navigate right) */
    var nextCh = ch + 1;
    if (nextCh < getChapterCount()) {
        _fillNavQuad(navEls.tr, CHAPTER_DEFS[nextCh].name, 'right', 'top');
        navEls.tr.classList.remove('inactive');
    } else {
        _fillNavQuad(navEls.tr, 'end', 'right', 'top');
        navEls.tr.classList.add('inactive');
    }

    /* BL: next page label (navigate down) */
    var nextPg = pg + 1;
    if (nextPg < getPageCount(ch)) {
        var nextPageLabel = pageNames && pageNames[nextPg] ? pageNames[nextPg] : 'page ' + (nextPg + 1);
        _fillNavQuad(navEls.bl, nextPageLabel, 'left', 'bottom');
        navEls.bl.classList.remove('inactive');
    } else {
        _fillNavQuad(navEls.bl, 'end', 'left', 'bottom');
        navEls.bl.classList.add('inactive');
    }

    /* BR: previous chapter (navigate left) */
    var prevCh = ch - 1;
    if (prevCh >= 0) {
        _fillNavQuad(navEls.br, CHAPTER_DEFS[prevCh].name, 'right', 'bottom');
        navEls.br.classList.remove('inactive');
    } else {
        _fillNavQuad(navEls.br, '0fun', 'right', 'bottom');
        navEls.br.classList.add('inactive');
    }
}

function _positionNavQuad(el, x, y, w, h) {
    el.style.left   = x + 'px';
    el.style.top    = y + 'px';
    el.style.width  = w + 'px';
    el.style.height = h + 'px';
}

function _fillNavQuad(el, text, hAlign, vAlign) {
    var old = el.querySelector('.fillbox');
    if (old) el.removeChild(old);
    _buildFillBoxDom(text, el, hAlign, vAlign);
}

/* ═══════════════════════════════════════════════════════════════
   EDGE STRIPS
   ═══════════════════════════════════════════════════════════════ */
function _updateEdgeStrips() {
    var SQ = currentLayout ? currentLayout.SQ : Math.round(Math.min(W, H) * 0.25);

    edgeEls.top.style.left   = SQ + 'px';
    edgeEls.top.style.top    = '0px';
    edgeEls.top.style.width  = (W - 2 * SQ) + 'px';
    edgeEls.top.style.height = SQ + 'px';

    edgeEls.bottom.style.left   = SQ + 'px';
    edgeEls.bottom.style.top    = (H - SQ) + 'px';
    edgeEls.bottom.style.width  = (W - 2 * SQ) + 'px';
    edgeEls.bottom.style.height = SQ + 'px';

    edgeEls.left.style.left   = '0px';
    edgeEls.left.style.top    = SQ + 'px';
    edgeEls.left.style.width  = SQ + 'px';
    edgeEls.left.style.height = (H - 2 * SQ) + 'px';

    edgeEls.right.style.left   = (W - SQ) + 'px';
    edgeEls.right.style.top    = SQ + 'px';
    edgeEls.right.style.width  = SQ + 'px';
    edgeEls.right.style.height = (H - 2 * SQ) + 'px';
}

/* ═══════════════════════════════════════════════════════════════
   NAV QUAD CLICKS
   ═══════════════════════════════════════════════════════════════ */
function _setupNavClicks() {
    navEls.tl.addEventListener('click', function () {
        if (isAnimating) return;
        if (currentPage > 0) _navigateY(-1);
    });
    navEls.tr.addEventListener('click', function () {
        if (isAnimating) return;
        if (currentChapter < getChapterCount() - 1) _navigateX(1);
    });
    navEls.bl.addEventListener('click', function () {
        if (isAnimating) return;
        if (currentPage < getPageCount(currentChapter) - 1) _navigateY(1);
    });
    navEls.br.addEventListener('click', function () {
        if (isAnimating) return;
        if (currentChapter > 0) _navigateX(-1);
    });
}

/* ═══════════════════════════════════════════════════════════════
   INPUT / SCROLLING
   ═══════════════════════════════════════════════════════════════ */
function _setupInput() {
    /* Prevent Safari pinch/zoom gestures */
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function (e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gestureend', function (e) { e.preventDefault(); }, { passive: false });

    Observer.create({
        target: contentLayer,
        type: 'wheel,touch',
        lockAxis: true,
        tolerance: 10,
        preventDefault: true,

        onDragStart: function () { _pointerDragging = true; },

        onChangeX: function (self) {
            if (isAnimating || isFrozen) return;
            _resetOverscroll();
            if (!_pointerDragging) _handleHScroll(self.deltaX);
        },

        onChangeY: function (self) {
            if (isAnimating || isFrozen) return;
            _resetHScroll();
            var dy = _pointerDragging ? -self.deltaY : self.deltaY;
            var oldPanY = panY;
            panY += dy;
            _clampPan();
            _applyPan();
            if (panY === oldPanY && dy !== 0) _handleOverscroll(dy);
            else _resetOverscroll();
        },

        onDragEnd: function (self) {
            _pointerDragging = false;
            if (isAnimating || isFrozen) return;
            var totalDX = self.x - self.startX;
            if (self.axis === 'x' && Math.abs(totalDX) > 50) {
                var dir = totalDX < 0 ? 1 : -1;
                _navigateX(dir);
            }
            _resetOverscroll();
            _resetHScroll();
        },
    });

    /* Keyboard */
    document.addEventListener('keydown', function (e) {
        if (isAnimating) return;
        if (e.key === 'ArrowRight')  { e.preventDefault(); _navigateX(1); }
        else if (e.key === 'ArrowLeft')  { e.preventDefault(); _navigateX(-1); }
        else if (e.key === 'ArrowDown')  { e.preventDefault(); _navigateY(1); }
        else if (e.key === 'ArrowUp')    { e.preventDefault(); _navigateY(-1); }
    });
}

function _applyPan() {
    if (chapterContainer) {
        chapterContainer.style.transform = 'translateY(' + (-panY) + 'px)';
    }
    _updateCurrentPage();
}

function _clampPan() {
    var maxPan = Math.max(0, totalChapterHeight - H);
    panY = Math.max(0, Math.min(maxPan, panY));
}

/* ── Overscroll → chapter change ── */
function _handleOverscroll(delta) {
    if (!delta) return;
    var dir = delta > 0 ? 1 : -1;
    if (dir !== overscrollDir) { overscrollAcc = 0; overscrollDir = dir; }
    overscrollAcc += Math.abs(delta);
    if (overscrollAcc >= OVERSCROLL_THRESHOLD) {
        overscrollAcc = 0; overscrollDir = 0;
        /* At bottom scrolling down → next chapter (dir=1)
           At top scrolling up → prev chapter (dir=-1) */
        _navigateX(dir);
    }
}
function _resetOverscroll() { overscrollAcc = 0; overscrollDir = 0; }

/* ── Horizontal scroll → chapter change ── */
function _handleHScroll(deltaX) {
    if (_hScrollCooldown || isAnimating || isFrozen) return;
    var dir = deltaX > 0 ? 1 : -1;
    if (dir !== _hScrollDir) { _hScrollAcc = 0; _hScrollDir = dir; }
    _hScrollAcc += Math.abs(deltaX);
    if (_hScrollAcc >= HSCROLL_THRESHOLD) {
        _hScrollAcc = 0; _hScrollDir = 0;
        _hScrollCooldown = true;
        gsap.delayedCall(0.6, function () { _hScrollCooldown = false; });
        _navigateX(dir);
    }
}
function _resetHScroll() { _hScrollAcc = 0; _hScrollDir = 0; }

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════════ */

/** Navigate to adjacent chapter (X-axis transition) */
function _navigateX(direction) {
    if (isAnimating || isFrozen) return;
    var newCh = currentChapter + direction;
    if (newCh < 0 || newCh >= getChapterCount()) { _flashBoundary(); return; }
    /* Going left → land at end of previous chapter */
    var landAtEnd = (direction === -1);
    _performTransition('x', direction, newCh, landAtEnd);
}

/** Navigate to adjacent page (smooth scroll within chapter) */
function _navigateY(direction) {
    if (isAnimating || isFrozen) return;
    var targetPg = currentPage + direction;

    if (targetPg < 0) {
        /* At first page, try previous chapter */
        if (currentChapter > 0) {
            _performTransition('x', -1, currentChapter - 1, true);
        } else {
            _flashBoundary();
        }
        return;
    }

    if (targetPg >= getPageCount(currentChapter)) {
        /* At last page, try next chapter */
        if (currentChapter < getChapterCount() - 1) {
            _performTransition('x', 1, currentChapter + 1, false);
        } else {
            _flashBoundary();
        }
        return;
    }

    /* Smooth-scroll to the target page boundary */
    var boundary = pageBoundaries[targetPg];
    if (!boundary) return;

    var targetY = boundary.startY;
    isAnimating = true;

    var proxy = { v: panY };
    gsap.to(proxy, {
        v: targetY,
        duration: 0.5,
        ease: 'power2.inOut',
        onUpdate: function () {
            panY = proxy.v;
            _clampPan();
            _applyPan();
        },
        onComplete: function () {
            panY = targetY;
            _clampPan();
            _applyPan();
            _updateCurrentPage();
            _updateNavQuads();
            gsap.delayedCall(ANIM.resetDelay, function () { isAnimating = false; });
        }
    });

    /* Vertical nav animation for page-change feedback */
    var SQ = currentLayout ? currentLayout.SQ : Math.round(Math.min(W, H) * 0.25);
    _animateNavQuads('y', direction, SQ, 0.5);
}

/* ═══════════════════════════════════════════════════════════════
   TRANSITIONS — chapter change with 2-phase stretch-slide
   ═══════════════════════════════════════════════════════════════ */
function _performTransition(axis, direction, newCh, landAtEnd) {
    isAnimating = true;

    /* Build incoming chapter off-screen */
    var result = _buildChapter(newCh);
    var inContainer = result.container;
    var SQ = result.layout.SQ;
    var targetPanY = landAtEnd ? Math.max(0, result.totalHeight - H) : 0;

    var outContainer = chapterContainer;

    /* Transition wrapper */
    var wrapper = document.createElement('div');
    wrapper.className = 'transition-wrapper';

    /* Move outgoing into wrapper (preserves its current translateY(-panY) transform) */
    if (outContainer && outContainer.parentNode) {
        outContainer.parentNode.removeChild(outContainer);
    }
    if (outContainer) {
        outContainer.style.position = 'absolute';
        outContainer.style.top  = '0';
        outContainer.style.left = '0';
        wrapper.appendChild(outContainer);
    }

    /* Position incoming container */
    var viewSize = axis === 'x' ? W : H;
    var dockOffset = viewSize - SQ;
    inContainer.style.position = 'absolute';
    inContainer.style.top  = '0';
    inContainer.style.left = '0';

    /* Include target panY so incoming shows correct scroll position during transition */
    if (axis === 'x') {
        inContainer.style.transform =
            'translateX(' + (direction * dockOffset) + 'px) translateY(' + (-targetPanY) + 'px)';
    } else {
        inContainer.style.transform =
            'translateY(' + (-direction * dockOffset - targetPanY) + 'px)';
    }
    wrapper.appendChild(inContainer);
    contentLayer.appendChild(wrapper);

    /* Animation parameters */
    var dur = ANIM.duration;
    if (axis === 'x') {
        var distX = W - SQ, distY = H - SQ;
        if (distY > 0) dur = ANIM.duration * Math.sqrt(distX / distY);
    }

    var p1Dur = dur * ANIM.phase1End;
    var p2Dur = dur * (1 - ANIM.phase1End);
    var peak  = ANIM.stretchPeak;
    var retreat = ANIM.phase1Retreat;

    var dim = axis === 'x' ? 'X' : 'Y';
    var slideTotal = axis === 'x' ? -direction * dockOffset : direction * dockOffset;

    /* Transform origin for stretch effect */
    if (axis === 'x') {
        inContainer.style.transformOrigin = direction === 1 ? 'left center' : 'right center';
    } else {
        inContainer.style.transformOrigin = direction === 1 ? 'center top' : 'center bottom';
    }

    var tl = gsap.timeline({
        onComplete: function () {
            /* Remove transition wrapper */
            if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);

            /* Install new chapter */
            currentChapter = newCh;
            pageBoundaries = result.pageBoundaries;
            totalChapterHeight = result.totalHeight;
            currentLayout = result.layout;
            chapterContainer = inContainer;

            /* Reset container styles and insert into content layer */
            inContainer.style.position = '';
            inContainer.style.top  = '';
            inContainer.style.left = '';
            inContainer.style.transform = '';
            inContainer.style.transformOrigin = '';
            contentLayer.appendChild(inContainer);

            /* Set scroll position */
            panY = targetPanY;
            _clampPan();
            _applyPan();
            _updateCurrentPage();
            _updateNavQuads();
            _updateEdgeStrips();

            gsap.delayedCall(ANIM.resetDelay, function () { isAnimating = false; });
        }
    });

    /* Proxy objects for GSAP tweens */
    var wrapperPos = { v: 0 };
    var inStretch  = { v: 1 };
    var inOffset   = direction * dockOffset;

    /* Build transform string helper */
    function _inTransform(stretch) {
        if (axis === 'x') {
            return 'translateX(' + inOffset + 'px) translateY(' + (-targetPanY) + 'px) scaleX(' + stretch + ')';
        } else {
            return 'translateY(' + (-direction * dockOffset - targetPanY) + 'px) scaleY(' + stretch + ')';
        }
    }

    /* ── Phase 1: stretch + retreat ── */
    tl.to(wrapperPos, {
        v: slideTotal * retreat,
        duration: p1Dur,
        ease: 'power1.in',
        onUpdate: function () {
            wrapper.style.transform = 'translate' + dim + '(' + wrapperPos.v + 'px)';
        }
    }, 0);

    tl.to(inStretch, {
        v: peak,
        duration: p1Dur,
        ease: 'power2.in',
        onUpdate: function () {
            inContainer.style.transform = _inTransform(inStretch.v);
        }
    }, 0);

    /* ── Phase 2: destretch + slide to final ── */
    tl.to(wrapperPos, {
        v: slideTotal,
        duration: p2Dur,
        ease: 'power3.out',
        onUpdate: function () {
            wrapper.style.transform = 'translate' + dim + '(' + wrapperPos.v + 'px)';
        }
    }, p1Dur);

    tl.to(inStretch, {
        v: 1,
        duration: p2Dur,
        ease: 'back.out(1.4)',
        onUpdate: function () {
            inContainer.style.transform = _inTransform(inStretch.v);
        }
    }, p1Dur);

    /* ── Nav quad animation in parallel ── */
    _animateNavQuads(axis, direction, SQ, dur);
}

/* ═══════════════════════════════════════════════════════════════
   NAV QUAD TRANSITION ANIMATION  (basic — will be enhanced in Step 3)
   ═══════════════════════════════════════════════════════════════ */
function _animateNavQuads(axis, direction, SQ, dur) {
    var peak    = ANIM.stretchPeak;
    var retreat = ANIM.phase1Retreat;
    var p1Dur   = dur * ANIM.phase1End;
    var p2Dur   = dur * (1 - ANIM.phase1End);

    if (axis === 'x') {
        _animateNavX(direction, SQ, peak, retreat, p1Dur, p2Dur);
    } else {
        _animateNavY(direction, SQ, peak, retreat, p1Dur, p2Dur);
    }
}

function _animateNavX(direction, SQ, peak, retreat, p1Dur, p2Dur) {
    /* Both right-side quads (TR + BR) participate in X transitions.
       Active quad stretches at full peak; companion stretches at ~40%. */
    var activeQuad, compQuad, activeOrigin, compOrigin;
    if (direction === 1) {
        activeQuad = navEls.tr;  compQuad = navEls.br;
        activeOrigin = 'left top';  compOrigin = 'left bottom';
    } else {
        activeQuad = navEls.br;  compQuad = navEls.tr;
        activeOrigin = 'right bottom';  compOrigin = 'right top';
    }

    /* Phase 1: stretch */
    gsap.to(activeQuad, {
        scaleX: peak, duration: p1Dur, ease: 'power2.in',
        transformOrigin: activeOrigin,
    });
    gsap.to(compQuad, {
        scaleX: 1 + (peak - 1) * 0.4, duration: p1Dur, ease: 'power1.in',
        transformOrigin: compOrigin,
    });

    /* Phase 2: destretch */
    gsap.to(activeQuad, {
        scaleX: 1, duration: p2Dur, delay: p1Dur, ease: 'back.out(1.4)',
        onComplete: function () { _updateNavQuads(); }
    });
    gsap.to(compQuad, {
        scaleX: 1, duration: p2Dur, delay: p1Dur, ease: 'power2.out',
    });
}

function _animateNavY(direction, SQ, peak, retreat, p1Dur, p2Dur) {
    /* Both left-side quads (TL + BL) participate in Y transitions.
       Active quad stretches at full peak; companion stretches at ~30%.
       Y-axis companion is gentler than X-axis (matches original). */
    var activeQuad, compQuad, activeOrigin, compOrigin;
    if (direction === 1) {
        /* Going down → BL stretches upward, TL companion */
        activeQuad = navEls.bl;  compQuad = navEls.tl;
        activeOrigin = 'left bottom';  compOrigin = 'left top';
    } else {
        /* Going up → TL stretches downward, BL companion */
        activeQuad = navEls.tl;  compQuad = navEls.bl;
        activeOrigin = 'left top';  compOrigin = 'left bottom';
    }

    /* Phase 1: stretch */
    gsap.to(activeQuad, {
        scaleY: peak, duration: p1Dur, ease: 'power2.in',
        transformOrigin: activeOrigin,
    });
    gsap.to(compQuad, {
        scaleY: 1 + (peak - 1) * 0.3, duration: p1Dur, ease: 'power1.in',
        transformOrigin: compOrigin,
    });

    /* Phase 2: destretch */
    gsap.to(activeQuad, {
        scaleY: 1, duration: p2Dur, delay: p1Dur, ease: 'back.out(1.4)',
        onComplete: function () { _updateNavQuads(); }
    });
    gsap.to(compQuad, {
        scaleY: 1, duration: p2Dur, delay: p1Dur, ease: 'power2.out',
    });
}

/* ═══════════════════════════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════════════════════════ */
function _flashBoundary() {
    if (!flashEl) return;
    flashEl.classList.add('active');
    gsap.delayedCall(0.15, function () { flashEl.classList.remove('active'); });
}

function _onResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    if (!isAnimating) {
        showChapter(currentChapter, { targetPage: currentPage });
    }
}

/* ═══════════════════════════════════════════════════════════════
   BOOTSTRAP
   ═══════════════════════════════════════════════════════════════ */
function _showError(msg) {
    console.error('[CDS 6.1 ERROR]', msg);
    var d = document.createElement('pre');
    d.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9999;background:#000;color:#f44;padding:12px;font-size:13px;max-width:90vw;white-space:pre-wrap;border-radius:6px';
    d.textContent = '[CDS 6.1] ' + msg;
    document.body.appendChild(d);
}

function _safeInit() {
    try { init(); }
    catch (e) { _showError(e.message + '\n' + e.stack); }
}

window.addEventListener('error', function (e) {
    _showError(e.message + ' @ ' + e.filename + ':' + e.lineno);
});
window.addEventListener('unhandledrejection', function (e) {
    _showError('Promise: ' + (e.reason ? (e.reason.message || e.reason) : 'unknown'));
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _safeInit);
} else {
    _safeInit();
}
