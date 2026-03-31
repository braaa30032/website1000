/* ═══════════════════════════════════════════════════════════════
   ENGINE.JS — CDS Website 6.1
   Pure DOM + CSS + GSAP  (no Three.js, no WebGL)

   Single file replaces:  app.js + nav.js + anim-config.js + helpers.js

   Layout rectangles from layout.js → CSS absolute positioning.
   GSAP timelines for 2-phase stretch-slide transitions.
   GSAP Observer for scroll / touch / wheel input.
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
let currentLayout  = null;
let panY = 0;
let isAnimating    = false;
let isFrozen       = false;
let overscrollAcc  = 0, overscrollDir = 0;
let _hScrollAcc = 0, _hScrollDir = 0, _hScrollCooldown = false;
let _scrollSwapping = false;
let _pointerDragging = false;
let _scrollLandAtEnd = false;
let pageNodes = [];

/* ── DOM refs ── */
let contentLayer, pageContainer;
let navEls = {};          // { tl, tr, bl, br }
let edgeEls = {};         // { top, bottom, left, right }
let flashEl;

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
 * Each line becomes a positioned <div> with its own font-size.
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

    /* Vertical offset */
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
            /* Build words right-to-left */
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
 * Handles both single-paragraph and multi-paragraph text.
 */
function _buildContentText(text, container) {
    var paragraphs = text.split('\n');
    var hasExplicitBreaks = paragraphs.length > 1;

    if (!hasExplicitBreaks) {
        /* Single paragraph → fill-box (each word fills the width) */
        _buildFillBoxDom(text, container, 'alternate', 'center');
    } else {
        /* Multi-paragraph → uniform font size, preserve line breaks */
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

    /* Show first page */
    showPage(0, 0);
}

/* ═══════════════════════════════════════════════════════════════
   ASPECT RATIO PRELOADING
   ═══════════════════════════════════════════════════════════════ */
var _aspectCache = {};

function _loadAspect(url) {
    if (_aspectCache[url] !== undefined) return Promise.resolve(_aspectCache[url]);
    return new Promise(function (resolve) {
        var img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = function () { _aspectCache[url] = (img.naturalWidth || 1) / (img.naturalHeight || 1); resolve(_aspectCache[url]); };
        img.onerror = function () { _aspectCache[url] = LAYOUT_CONST.MAIN_ASPECT; resolve(LAYOUT_CONST.MAIN_ASPECT); };
        img.src = url;
    });
}

function _loadVideoAspect(url) {
    if (_aspectCache[url] !== undefined) return Promise.resolve(_aspectCache[url]);
    return new Promise(function (resolve) {
        var v = document.createElement('video'); v.crossOrigin = 'anonymous'; v.preload = 'metadata';
        v.onloadedmetadata = function () { _aspectCache[url] = (v.videoWidth || 1) / (v.videoHeight || 1); resolve(_aspectCache[url]); v.src = ''; };
        v.onerror = function () { _aspectCache[url] = LAYOUT_CONST.MAIN_ASPECT; resolve(LAYOUT_CONST.MAIN_ASPECT); v.src = ''; };
        v.src = url;
    });
}

function _getNodeAspect(node, fallback) {
    var url = node.image || node.url || node.video;
    if (!url) return Promise.resolve(fallback);
    if (node.type === 'video') return _loadVideoAspect(url);
    if (node.type === 'image') return _loadAspect(url);
    return Promise.resolve(fallback);
}

function _preloadPageAspects(nodes) {
    var promises = [], structure = [];
    for (var i = 0; i < nodes.length; i++) {
        promises.push(_getNodeAspect(nodes[i], LAYOUT_CONST.MAIN_ASPECT));
        var cc = (nodes[i].children || []).length; structure.push(cc);
        for (var j = 0; j < cc; j++) promises.push(_getNodeAspect(nodes[i].children[j], LAYOUT_CONST.SUB_ASPECT));
    }
    return Promise.all(promises).then(function (results) {
        var mainAspects = [], subAspects = [], idx = 0;
        for (var i = 0; i < nodes.length; i++) {
            mainAspects.push(results[idx++]);
            var ca = []; for (var j = 0; j < structure[i]; j++) ca.push(results[idx++]);
            subAspects.push(ca);
        }
        return { mainAspects: mainAspects, subAspects: subAspects };
    });
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
   COLUMNS PAGE (special intro grid)
   ═══════════════════════════════════════════════════════════════ */
function _isColumnsPage(ch, pg) {
    var lib = LIBRARY[ch];
    if (!lib) return false;
    var page = lib.pages[pg];
    return page && page.length === 1 && page[0] && page[0].layout === 'columns';
}

function _renderColumnsPage() {
    var page = LIBRARY[currentChapter].pages[currentPage];
    var colData = page[0];
    var baseUrl = colData.baseUrl;
    var maxThumbW = colData.thumbnail || 128;
    var numCols = colData.columns.length;
    var SQ = Math.min(W, H) / 4;
    var innerW = W - 2 * SQ;
    var gap = 2;
    var colW = Math.floor((innerW - (numCols - 1) * gap) / numCols);
    var subCols = 3;
    var subGap = 1;

    /* Build container */
    var container = document.createElement('div');
    container.className = 'page-container columns-page';
    container.style.width = W + 'px';

    var maxH = 0;

    for (var ci = 0; ci < numCols; ci++) {
        var items = colData.columns[ci].items;
        var colGroup = document.createElement('div');
        colGroup.className = 'column-group';
        colGroup.style.left = (SQ + ci * (colW + gap)) + 'px';
        colGroup.style.width = colW + 'px';

        var subW = Math.floor((colW - (subCols - 1) * subGap) / subCols);
        var cy = SQ;

        for (var ti = 0; ti < items.length; ti++) {
            var col3 = ti % subCols;
            var px = col3 * (subW + subGap);

            var thumb = document.createElement('div');
            thumb.className = 'column-thumb';
            thumb.style.left = px + 'px';
            thumb.style.top = cy + 'px';
            thumb.style.width = subW + 'px';
            /* Height will be set after image loads, default square for now */
            thumb.style.height = subW + 'px';

            var img = document.createElement('img');
            img.crossOrigin = 'anonymous';
            img.loading = 'lazy';
            img.src = baseUrl + items[ti];
            /* Adjust height on load */
            (function (thumbEl, sw) {
                img.onload = function () {
                    var aspect = (this.naturalWidth || 1) / (this.naturalHeight || 1);
                    thumbEl.style.height = Math.round(sw / aspect) + 'px';
                };
            })(thumb, subW);
            thumb.appendChild(img);
            colGroup.appendChild(thumb);

            /* Advance Y on row completion */
            if (col3 === subCols - 1 || ti === items.length - 1) {
                cy += subW + subGap; /* approximate; exact would need aspect preload */
            }
        }
        container.appendChild(colGroup);
        if (cy > maxH) maxH = cy;
    }

    container.style.height = (maxH + SQ) + 'px';

    /* Swap into DOM */
    _clearPage();
    pageContainer = container;
    contentLayer.appendChild(pageContainer);

    currentLayout = {
        SQ: SQ,
        totalContentHeight: maxH + SQ,
        navTL: { x: 0, y: 0, w: SQ, h: SQ },
        navTR: { x: W - SQ, y: 0, w: SQ, h: SQ },
        navBL: { x: 0, y: H - SQ, w: SQ, h: SQ },
        navBR: { x: W - SQ, y: H - SQ, w: SQ, h: SQ }
    };

    panY = 0;
    _applyPan();
    _updateNavQuads();
}

/* ═══════════════════════════════════════════════════════════════
   PAGE BUILDING  (normal pages)
   ═══════════════════════════════════════════════════════════════ */
function showPage(ch, pg) {
    currentChapter = ch;
    currentPage    = pg;
    renderCurrentPage();
}

function renderCurrentPage() {
    if (_isColumnsPage(currentChapter, currentPage)) {
        _renderColumnsPage();
        return;
    }

    var nodes = getMainNodesForPage(currentChapter, currentPage);
    pageNodes = nodes;
    var sectionDefs = getPageSections(currentChapter, currentPage);
    var landAtEnd = _scrollLandAtEnd;
    _scrollLandAtEnd = false;

    console.log('[CDS 6.1] renderCurrentPage ch=' + currentChapter + ' pg=' + currentPage + ' nodes=' + nodes.length);

    /* Render immediately with default aspects (no waiting for images) */
    var cfg = _buildPageConfig(nodes, null, sectionDefs);
    var layout = computeLayout(cfg, W, H);
    currentLayout = layout;

    _clearPage();
    pageContainer = _buildPageDom(layout, nodes);
    contentLayer.appendChild(pageContainer);

    if (landAtEnd) {
        panY = Math.max(0, layout.totalContentHeight - H);
    } else {
        panY = 0;
    }
    _applyPan();
    _updateNavQuads();
    _updateEdgeStrips();

    console.log('[CDS 6.1] page built ✓ mains=' + layout.mains.length + ' totalH=' + layout.totalContentHeight);

    /* Optionally re-layout with real aspect ratios once images load */
    var snapCh = currentChapter, snapPg = currentPage;
    _preloadPageAspects(nodes).then(function (aspects) {
        if (currentChapter !== snapCh || currentPage !== snapPg) return;
        var cfg2 = _buildPageConfig(nodes, aspects, sectionDefs);
        var layout2 = computeLayout(cfg2, W, H);
        if (Math.abs(layout2.totalContentHeight - layout.totalContentHeight) < 2) return;
        currentLayout = layout2;
        _clearPage();
        pageContainer = _buildPageDom(layout2, nodes);
        contentLayer.appendChild(pageContainer);
        _clampPan();
        _applyPan();
        console.log('[CDS 6.1] re-layout with real aspects, totalH=' + layout2.totalContentHeight);
    }).catch(function (err) {
        console.warn('[CDS 6.1] aspect preload failed (non-critical):', err.message);
    });
}

function _clearPage() {
    if (pageContainer && pageContainer.parentNode) {
        pageContainer.parentNode.removeChild(pageContainer);
    }
    pageContainer = null;
}

/**
 * Build a page's DOM from layout rectangles and library node data.
 * Returns a .page-container div with absolutely-positioned children.
 */
function _buildPageDom(layout, nodes) {
    var pal = getActivePalette();
    var container = document.createElement('div');
    container.className = 'page-container';
    container.style.width  = W + 'px';
    container.style.height = layout.totalContentHeight + 'px';

    /* ── Netz quads (background fill areas) ── */
    layout.netz.forEach(function (nq) {
        if (nq.type !== 'rect') return;
        var el = document.createElement('div');
        el.className = 'netz-quad';
        el.style.left   = nq.x + 'px';
        el.style.top    = nq.y + 'px';
        el.style.width  = nq.w + 'px';
        el.style.height = nq.h + 'px';
        container.appendChild(el);
    });

    /* ── Mains ── */
    layout.mains.forEach(function (m, mi) {
        var node = nodes[mi];
        if (!node) return;
        var el = _createMediaElement(m, node);
        if (el) container.appendChild(el);
    });

    /* ── Subs ── */
    layout.subs.forEach(function (group, gi) {
        group.forEach(function (s, si) {
            var node = nodes[gi] && nodes[gi].children && nodes[gi].children[si]
                ? nodes[gi].children[si] : null;
            if (!node) return;
            var el = _createMediaElement(s, node);
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
                    { x: pet.x - pet.w / 2, y: pet.y - pet.h / 2, w: pet.w, h: pet.h },
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
            var matched = _findNetzByPosition(layout.netz, nt.position, mainRect, subRects, layout.SQ);
            if (matched && matched.type === 'rect') {
                var el = document.createElement('div');
                el.className = 'content-node';
                el.style.left   = matched.x + 'px';
                el.style.top    = matched.y + 'px';
                el.style.width  = matched.w + 'px';
                el.style.height = matched.h + 'px';
                el.style.backgroundColor = pal.primary;
                el.style.zIndex = '1';
                _buildContentText(nt.text, el);
                container.appendChild(el);
            }
        });
    });

    return container;
}

/**
 * Create a single media element (image, video, or text) inside an abs-positioned div.
 */
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
        /* PNG images get background fill */
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
   NAV QUADRANTS
   ═══════════════════════════════════════════════════════════════ */
function _updateNavQuads() {
    var SQ = currentLayout ? currentLayout.SQ : Math.round(Math.min(W, H) * 0.25);

    /* Position & size each quad */
    _positionNavQuad(navEls.tl, 0, 0, SQ, SQ);
    _positionNavQuad(navEls.tr, W - SQ, 0, SQ, SQ);
    _positionNavQuad(navEls.bl, 0, H - SQ, SQ, SQ);
    _positionNavQuad(navEls.br, W - SQ, H - SQ, SQ, SQ);

    /* Fill each quad with text content */
    var ch = currentChapter, pg = currentPage;
    var chName = CHAPTER_DEFS[ch] ? CHAPTER_DEFS[ch].name : '';
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

    /* BR: previous chapter / 0fun (navigate left) */
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
    /* Remove old fill-box content */
    var old = el.querySelector('.fillbox');
    if (old) el.removeChild(old);
    _buildFillBoxDom(text, el, hAlign, vAlign);
}

/* ═══════════════════════════════════════════════════════════════
   EDGE STRIPS (between nav corners)
   ═══════════════════════════════════════════════════════════════ */
function _updateEdgeStrips() {
    var SQ = currentLayout ? currentLayout.SQ : Math.round(Math.min(W, H) * 0.25);

    /* Top: between TL and TR */
    edgeEls.top.style.left   = SQ + 'px';
    edgeEls.top.style.top    = '0px';
    edgeEls.top.style.width  = (W - 2 * SQ) + 'px';
    edgeEls.top.style.height = SQ + 'px';

    /* Bottom: between BL and BR */
    edgeEls.bottom.style.left   = SQ + 'px';
    edgeEls.bottom.style.top    = (H - SQ) + 'px';
    edgeEls.bottom.style.width  = (W - 2 * SQ) + 'px';
    edgeEls.bottom.style.height = SQ + 'px';

    /* Left: between TL and BL */
    edgeEls.left.style.left   = '0px';
    edgeEls.left.style.top    = SQ + 'px';
    edgeEls.left.style.width  = SQ + 'px';
    edgeEls.left.style.height = (H - 2 * SQ) + 'px';

    /* Right: between TR and BR */
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

    /* GSAP Observer: unified input with lockAxis */
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
    if (pageContainer) {
        pageContainer.style.transform = 'translateY(' + (-panY) + 'px)';
    }
}

function _clampPan() {
    var maxPan = currentLayout ? Math.max(0, currentLayout.totalContentHeight - H) : 0;
    panY = Math.max(0, Math.min(maxPan, panY));
}

/* ── Overscroll (vertical → page change) ── */
function _handleOverscroll(delta) {
    if (!delta) return;
    var dir = delta > 0 ? 1 : -1;
    if (dir !== overscrollDir) { overscrollAcc = 0; overscrollDir = dir; }
    overscrollAcc += Math.abs(delta);
    if (overscrollAcc >= OVERSCROLL_THRESHOLD) {
        overscrollAcc = 0; overscrollDir = 0;
        _scrollSwap(dir);
    }
}
function _resetOverscroll() { overscrollAcc = 0; overscrollDir = 0; }

/* ── Horizontal scroll accumulator (→ chapter change) ── */
function _handleHScroll(deltaX) {
    if (_hScrollCooldown || isAnimating || isFrozen || _scrollSwapping) return;
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
function _navigateX(direction) {
    if (isAnimating || isFrozen) return;
    var newCh = currentChapter + direction;
    if (newCh < 0 || newCh >= getChapterCount()) { _flashBoundary(); return; }
    var newPg = (direction === -1 && _scrollLandAtEnd)
        ? Math.max(0, getPageCount(newCh) - 1) : 0;
    _performTransition('x', direction, newCh, newPg);
}

function _navigateY(direction) {
    if (isAnimating || isFrozen) return;
    var maxPg = getPageCount(currentChapter) - 1;
    var newPg = currentPage + direction;
    if (newPg < 0) {
        if (currentChapter > 0) { _scrollLandAtEnd = true; _navigateX(-1); }
        else _flashBoundary();
        return;
    }
    if (newPg > maxPg) {
        if (currentChapter < getChapterCount() - 1) { _navigateX(1); }
        else _flashBoundary();
        return;
    }
    _performTransition('y', direction, currentChapter, newPg);
}

/* ── Scroll-triggered page swap (instant, no content animation) ── */
function _scrollSwap(direction) {
    if (isAnimating || isFrozen || _scrollSwapping) return;
    _scrollSwapping = true;

    var ch = LIBRARY[currentChapter];
    var newCh = currentChapter, newPg = currentPage + direction;

    if (newPg < 0) {
        if (currentChapter > 0) { newCh = currentChapter - 1; newPg = Math.max(0, getPageCount(newCh) - 1); }
        else { _flashBoundary(); _scrollSwapping = false; return; }
    } else if (newPg >= ch.pages.length) {
        if (currentChapter < getChapterCount() - 1) { newCh = currentChapter + 1; newPg = 0; }
        else { _flashBoundary(); _scrollSwapping = false; return; }
    }

    overscrollAcc = 0; overscrollDir = 0;
    currentChapter = newCh;
    currentPage = newPg;

    if (direction === -1) _scrollLandAtEnd = true;
    renderCurrentPage();

    gsap.delayedCall(0.4, function () { _scrollSwapping = false; });
}

/* ═══════════════════════════════════════════════════════════════
   TRANSITIONS — 2-phase stretch-slide on DOM transforms
   ═══════════════════════════════════════════════════════════════ */
function _performTransition(axis, direction, newCh, newPg) {
    isAnimating = true;

    /* Build incoming page off-screen */
    var newNodes = getMainNodesForPage(newCh, newPg);
    var newSectionDefs = getPageSections(newCh, newPg);
    var newCfg = _buildPageConfig(newNodes, null, newSectionDefs);
    var inLayout = computeLayout(newCfg, W, H);
    var SQ = inLayout.SQ;

    var inPage = _buildPageDom(inLayout, newNodes);
    var outPage = pageContainer;

    /* Transition wrapper */
    var wrapper = document.createElement('div');
    wrapper.className = 'transition-wrapper';

    /* Move outgoing page into wrapper */
    if (outPage && outPage.parentNode) outPage.parentNode.removeChild(outPage);
    if (outPage) {
        outPage.style.position = 'absolute';
        outPage.style.top  = '0';
        outPage.style.left = '0';
        wrapper.appendChild(outPage);
    }

    /* Position incoming page */
    var viewSize = axis === 'x' ? W : H;
    var dockOffset = viewSize - SQ;
    inPage.style.position = 'absolute';
    inPage.style.top  = '0';
    inPage.style.left = '0';
    if (axis === 'x') {
        inPage.style.transform = 'translateX(' + (direction * dockOffset) + 'px)';
    } else {
        inPage.style.transform = 'translateY(' + (-direction * dockOffset) + 'px)';
    }
    wrapper.appendChild(inPage);
    contentLayer.appendChild(wrapper);

    /* Compute animation parameters */
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

    /* Set transform-origin for stretch effect */
    if (axis === 'x') {
        inPage.style.transformOrigin = direction === 1 ? 'left center' : 'right center';
    } else {
        inPage.style.transformOrigin = direction === 1 ? 'center top' : 'center bottom';
    }

    var tl = gsap.timeline({
        onComplete: function () {
            _finishTransition(wrapper, inPage, inLayout, newNodes, newCh, newPg);
        }
    });

    /* Proxy objects for GSAP tweens */
    var wrapperPos = { v: 0 };
    var inStretch  = { v: 1 };
    var inOffset   = direction * dockOffset;

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
            var t = 'translate' + dim + '(' + inOffset + 'px) scale' + dim + '(' + inStretch.v + ')';
            inPage.style.transform = t;
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
            var t = 'translate' + dim + '(' + inOffset + 'px) scale' + dim + '(' + inStretch.v + ')';
            inPage.style.transform = t;
        }
    }, p1Dur);

    /* ── Nav quad animation in parallel ── */
    _animateNavQuads(axis, direction, SQ, dur);
}

function _finishTransition(wrapper, inPage, inLayout, newNodes, newCh, newPg) {
    /* Remove transition wrapper */
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);

    /* Install clean page */
    currentChapter = newCh;
    currentPage    = newPg;
    currentLayout  = inLayout;
    pageNodes      = newNodes;

    /* Re-render with real aspects (preloaded), the transition used default aspects */
    renderCurrentPage();

    gsap.delayedCall(ANIM.resetDelay, function () {
        isAnimating = false;
    });
}

/* ═══════════════════════════════════════════════════════════════
   NAV QUAD TRANSITION ANIMATION
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
    /* X transition: TR (next) and BR (prev) are the active nav quads */
    if (direction === 1) {
        /* Going right → TR stretches in, slides to TL position visually */
        var tr = navEls.tr;
        /* Phase 1: stretch TR */
        gsap.to(tr, {
            scaleX: peak,
            duration: p1Dur,
            ease: 'power2.in',
            transformOrigin: 'left top',
        });
        /* Phase 2: destretch */
        gsap.to(tr, {
            scaleX: 1,
            duration: p2Dur,
            delay: p1Dur,
            ease: 'back.out(1.4)',
            onComplete: function () { _updateNavQuads(); }
        });
    } else {
        /* Going left → BR stretches in */
        var br = navEls.br;
        gsap.to(br, {
            scaleX: peak,
            duration: p1Dur,
            ease: 'power2.in',
            transformOrigin: 'right bottom',
        });
        gsap.to(br, {
            scaleX: 1,
            duration: p2Dur,
            delay: p1Dur,
            ease: 'back.out(1.4)',
            onComplete: function () { _updateNavQuads(); }
        });
    }
}

function _animateNavY(direction, SQ, peak, retreat, p1Dur, p2Dur) {
    if (direction === 1) {
        /* Going down → BL stretches upward */
        var bl = navEls.bl;
        gsap.to(bl, {
            scaleY: peak,
            duration: p1Dur,
            ease: 'power2.in',
            transformOrigin: 'left bottom',
        });
        gsap.to(bl, {
            scaleY: 1,
            duration: p2Dur,
            delay: p1Dur,
            ease: 'back.out(1.4)',
            onComplete: function () { _updateNavQuads(); }
        });
    } else {
        /* Going up → TL stretches downward */
        var tl = navEls.tl;
        gsap.to(tl, {
            scaleY: peak,
            duration: p1Dur,
            ease: 'power2.in',
            transformOrigin: 'left top',
        });
        gsap.to(tl, {
            scaleY: 1,
            duration: p2Dur,
            delay: p1Dur,
            ease: 'back.out(1.4)',
            onComplete: function () { _updateNavQuads(); }
        });
    }
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
    if (!isAnimating) renderCurrentPage();
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

window.addEventListener('error', function(e) { _showError(e.message + ' @ ' + e.filename + ':' + e.lineno); });
window.addEventListener('unhandledrejection', function(e) { _showError('Promise: ' + (e.reason ? (e.reason.message || e.reason) : 'unknown')); });

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _safeInit);
} else {
    _safeInit();
}
