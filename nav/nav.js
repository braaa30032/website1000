/**
 * NAVIGATION LAYER – Three.js 3D Letters
 * 4 Quadrate in den Ecken des Bildschirms, gefuellt mit 3D-Buchstaben.
 * X-Achse (←→) = Kapitel, Y-Achse (↑↓) = Seiten
 * Kommuniziert mit ContentLayer via showPage/freeze/unfreeze
 *
 * Placeholder: Bis die .glb-Dateien fertig sind, werden die Buchstaben
 * als extrudierte BoxGeometry-Bloecke dargestellt.
 */

import * as THREE from 'three';
import { createEnvMap } from '../content/js/shared/three-utils.js?v=24';
import { ANIM, INPUT_TIMING, lerp, buildNavTransitionTimeline, registerRenderCallback, gsap } from '../content/js/shared/anim-config.js?v=24';
import {
    LETTER_DEPTH, LETTER_SPACING, LINE_SPACING, QUADRANT_FILL,
    letterCache, lettersAvailable, loadLetterGLBs, collectNeededChars,
    createLetter, layoutTextIntoLines, applyMaterialPreset,
    buildLetterGroup as _buildLetterGroup
} from '../content/js/shared/letter-system.js?v=24';
import { NAV_TEXT_MODE, LIBRARY, CHAPTER_DEFS, getPageCount, getActivePalette } from '../library.js?v=38';
import { splitFillBoxWords, computeFillBox, renderFillBox } from '../content/js/shared/helpers.js?v=1';

// ========== CONFIG ==========

const CONFIG = {
    // Shared animation params come from ANIM import
    // Letter loading comes from shared/letter-system.js (LETTER_BASE)
    // Nav-specific overrides:
    desaturationAmount: 0.3,
};

/* 2D-first rollout: keep nav text rendering in canvas mode only. */
const FORCE_NAV_2D = true;

// ========== THREE.JS SETUP ==========

let renderer, scene, camera;
let W = window.innerWidth;
let H = window.innerHeight;
let SQ = Math.min(W, H) / 4;

// Quadrant-Gruppen: jede ist eine THREE.Group mit 3D-Buchstaben
// X-Achse (Kapitel): prev, main, next, nextNext
// Y-Achse (Seiten):  topTop, top, bottom, bottomBottom
// Info:              info
const quadrants = {};

// Letter state now in shared/letter-system.js (letterCache, lettersAvailable)

// ========== NAV STATE ==========

const navState = {
    currentChapter: 0,
    currentPage: 0,
    isAnimating: false,
    needsRender: true,
    pendingSync: null,
};

// ========== CHAPTER DATA (aus Library) ==========

function getChapterLabel(chapterIdx, pageIdx) {
    if (chapterIdx < 0 || chapterIdx >= CHAPTER_DEFS.length) return '';
    return CHAPTER_DEFS[chapterIdx].name;
}

function getChapterColorHex(chapterIdx) {
    if (chapterIdx < 0 || chapterIdx >= CHAPTER_DEFS.length) return '#333333';
    return CHAPTER_DEFS[chapterIdx].color;
}

function getPageLabel(chapterIdx, pageIdx) {
    if (chapterIdx < 0 || chapterIdx >= CHAPTER_DEFS.length) return '';
    var ch = CHAPTER_DEFS[chapterIdx];
    return ch.name + ' – ' + (pageIdx + 1);
}

// ========== LAYOUT CALCULATIONS ==========

function recalcLayout() {
    W = window.innerWidth;
    H = window.innerHeight;
    SQ = Math.min(W, H) / 4;
}

// Quadrant-Positionen in Weltkoordinaten (Zentrum jedes Quadrats)
// Kamera: orthografisch, 1 Unit = 1 Pixel
function getDefaultPositions() {
    return {
        // X-Achse Panels (obere Reihe)
        prev:       { x: -W/2 - SQ/2,   y: H/2 - SQ/2 },
        main:       { x: -W/2 + SQ/2,   y: H/2 - SQ/2 },
        next:       { x:  W/2 - SQ/2,   y: H/2 - SQ/2 },
        nextNext:   { x:  W/2 + SQ/2,   y: H/2 - SQ/2 },

        // Y-Achse Panels (linke Spalte)
        topTop:     { x: -W/2 + SQ/2,   y: H/2 + SQ/2 + SQ },
        top:        { x: -W/2 + SQ/2,   y: H/2 - SQ/2 },
        bottom:     { x: -W/2 + SQ/2,   y: -H/2 + SQ/2 },
        bottomBottom: { x: -W/2 + SQ/2, y: -H/2 - SQ/2 - SQ },

        // Info (unten rechts)
        info:       { x:  W/2 - SQ/2,   y: -H/2 + SQ/2 },
    };
}

// Quadrant-Groessen (Breite, Hoehe) — aendern sich bei Stretch-Animation
function getDefaultSizes() {
    return {
        prev: { w: SQ, h: SQ }, main: { w: SQ, h: SQ },
        next: { w: SQ, h: SQ }, nextNext: { w: SQ, h: SQ },
        topTop: { w: SQ, h: SQ }, top: { w: SQ, h: SQ },
        bottom: { w: SQ, h: SQ }, bottomBottom: { w: SQ, h: SQ },
        info: { w: SQ, h: SQ },
    };
}

let quadrantPositions = {};
let quadrantSizes = {};

// ========== INIT ==========

function navInit() {
    recalcLayout();

    /* Apply palette CSS custom properties to :root */
    const _p = getActivePalette();
    const _r = document.documentElement.style;
    _r.setProperty('--pal-primary',   _p.primary);
    _r.setProperty('--pal-secondary', _p.secondary);
    _r.setProperty('--pal-accent',    _p.accent);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0); // Vollstaendig transparent
    renderer.toneMapping = THREE.NoToneMapping;

    const container = document.getElementById('nav-viewport');
    container.insertBefore(renderer.domElement, container.firstChild);

    // Scene
    scene = new THREE.Scene();

    // Camera (orthografisch, Mitte = 0,0)
    camera = new THREE.OrthographicCamera(
        -W/2, W/2, H/2, -H/2, 0.1, 1000
    );
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);

    // Licht
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(200, 300, 400);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-200, -100, 300);
    scene.add(fillLight);

    // Environment Map fuer PBR-Reflexionen (einfacher Gradient)
    scene.environment = createEnvMap();

    // Quadrant-Gruppen erstellen
    createAllQuadrants();

    // Default-Positionen
    quadrantPositions = getDefaultPositions();
    quadrantSizes = getDefaultSizes();
    applyQuadrantTransforms();

    // Lade .glb-Buchstaben nur im 3D-Nav-Modus
    if (!FORCE_NAV_2D && (NAV_TEXT_MODE || '3d') === '3d') {
        loadLetterGLBs(collectNeededChars()).then(() => {
            updateAllQuadrantContent();
            navState.needsRender = true;
        });
    }

    // Events
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    _setupNavQuadClicks();

    // Initialen Content anzeigen
    updateAllQuadrantContent();
    updateStatusDisplay();

    // Render-Loop
    startRenderLoop();

    // --- Loading screen: hide THREE quadrants, run tile animation ---
    _runLoadingScreen();
}

/* ═══════════════════════════════════════════════════════════════
   LOADING SCREEN — flash 0/f/u/n on tiles, then shrink to corners
   ═══════════════════════════════════════════════════════════════ */
let _loadingActive = true;

function _runLoadingScreen() {
    _loadingActive = true;
    navState.isAnimating = true; /* block input during loading */

    /* Hide THREE.js quadrants during loading */
    PANEL_NAMES_ALL.forEach(n => { quadrants[n].visible = false; });
    navState.needsRender = true;

    /* Keep CDS content layer VISIBLE so landing page renders behind tiles */
    const cdsEl = document.getElementById('content-layer');
    if (window.ContentLayer) {
        ContentLayer.showPage(navState.currentChapter, navState.currentPage);
    }

    const SPIN_ORDER = ['load-tl', 'load-tr', 'load-bl', 'load-br'];
    const ROTATIONS  = 1;
    const FADE_IN_MS = 160;
    const HOLD_MS    = 360;
    const FADE_OUT_MS = 160;

    const allTiles = SPIN_ORDER.map(id => document.getElementById(id));

    function flashTile(tileEl, onDone) {
        tileEl.classList.add('lit');
        gsap.delayedCall((FADE_IN_MS + HOLD_MS) / 1000, () => {
            tileEl.classList.remove('lit');
            gsap.delayedCall(FADE_OUT_MS / 1000, onDone);
        });
    }

    function runSpinStep(step, onAllDone) {
        const totalSteps = 4 * ROTATIONS;
        if (step >= totalSteps) { onAllDone(); return; }
        const tileEl = allTiles[step % 4];
        flashTile(tileEl, () => runSpinStep(step + 1, onAllDone));
    }

    function runShrink() {
        /* Compute target size as CSS values matching SQ */
        const sq = Math.min(window.innerWidth, window.innerHeight) / 4;
        const sqW = (sq / window.innerWidth * 100) + '%';
        const sqH = (sq / window.innerHeight * 100) + '%';

        gsap.delayedCall(0.2, () => {
            allTiles.forEach(t => {
                t.classList.add('shrink');
                t.style.width = sqW;
                t.style.height = sqH;
            });

            /* After shrink transition completes → reveal everything */
            gsap.delayedCall(0.95, () => {
                allTiles.forEach(t => t.classList.add('gone'));
                _loadingActive = false;
                navState.isAnimating = false;

                /* Restore nav panels after loading (they were force-hidden) */
                resetToDefaults();
                updateAllQuadrantContent();
                setAxisVisibility('x');
                navState.needsRender = true;
            });
        });
    }

    /* Start: brief pause, then spin */
    gsap.delayedCall(0.4, () => runSpinStep(0, runShrink));
}


// ========== QUADRANT CREATION ==========

const PANEL_NAMES_ALL = [
    'prev', 'main', 'next', 'nextNext',
    'topTop', 'top', 'bottom', 'bottomBottom',
    'info'
];

function createAllQuadrants() {
    PANEL_NAMES_ALL.forEach(name => {
        const group = new THREE.Group();
        group.name = name;
        group.userData = { text: '', chapterIdx: -1, pageIdx: -1 };
        scene.add(group);
        quadrants[name] = group;
    });
}







// ========== CONTENT ASSIGNMENT ==========

function getContentForPanel(panelName) {
    const ch = navState.currentChapter;
    const pg = navState.currentPage;
    const totalChapters = CHAPTER_DEFS.length;

    switch (panelName) {
        // X-Achse
        case 'prev':
            return ch > 0 ? { chapterIdx: ch-1, pageIdx: 0 } : { chapterIdx: ch, pageIdx: pg, endLabel: 'end' };
        case 'main':
            return { chapterIdx: ch, pageIdx: pg };
        case 'next':
            return ch < totalChapters-1 ? { chapterIdx: ch+1, pageIdx: 0 } : { chapterIdx: ch, pageIdx: pg, endLabel: 'end' };
        case 'nextNext':
            return ch < totalChapters-2 ? { chapterIdx: ch+2, pageIdx: 0 } : null;

        // Y-Achse
        case 'topTop':
            return pg > 1 ? { chapterIdx: ch, pageIdx: pg-2 } : null;
        case 'top':
            return { chapterIdx: ch, pageIdx: pg };
        case 'bottom': {
            const maxPg = getPageCount(ch) - 1;
            return pg < maxPg ? { chapterIdx: ch, pageIdx: pg+1 } : { chapterIdx: ch, pageIdx: pg, endLabel: 'end' };
        }
        case 'bottomBottom': {
            const maxPg2 = getPageCount(ch) - 1;
            return pg < maxPg2 - 1 ? { chapterIdx: ch, pageIdx: pg+2 } : null;
        }

        // Info
        case 'info':
            return { chapterIdx: ch, pageIdx: pg };
    }
    return null;
}

// ========== UPDATE QUADRANT CONTENT ==========

function updateAllQuadrantContent() {
    PANEL_NAMES_ALL.forEach(name => {
        updateQuadrantContent(name);
    });
    navState.needsRender = true;
}

function updateQuadrantContent(panelName) {
    const group = quadrants[panelName];
    const content = getContentForPanel(panelName);

    // Alte Meshes entfernen (deep dispose fuer verschachtelte Groups)
    function disposeObject(obj) {
        if (obj.children) {
            while (obj.children.length > 0) {
                disposeObject(obj.children[0]);
                obj.remove(obj.children[0]);
            }
        }
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
            } else if (obj.material.dispose) {
                obj.material.dispose();
            }
        }
    }
    while (group.children.length > 0) {
        const child = group.children[0];
        disposeObject(child);
        group.remove(child);
    }

    if (!content) {
        group.visible = false;
        return;
    }
    group.visible = true;

    /* ── Background square (palette secondary = 30%) ── */
    const bgGeo = new THREE.PlaneGeometry(SQ, SQ);
    const bgMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(getActivePalette().secondary), side: THREE.DoubleSide
    });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.z = -1; // behind text content
    bgMesh.userData.isBg = true;
    group.add(bgMesh);

    const navMode = FORCE_NAV_2D ? '2d' : (NAV_TEXT_MODE || '3d');

    if (navMode === '3d') {
        /* ── 3D Letters ── */
        const text = content.endLabel || getChapterLabel(content.chapterIdx, content.pageIdx);
        const letterGroup = _buildLetterGroup(text, SQ, SQ, color, content.chapterIdx);
        group.add(letterGroup);

        group.userData.text = text;
    } else {
        /* ── 2D Canvas fill-box text ── */
        const text2d = _getNavQuadLabel(panelName, content);
        if (text2d) {
            const texMesh = _buildCanvasTextMesh(text2d, SQ, SQ, panelName);
            if (texMesh) group.add(texMesh);
        }
        group.userData.text = text2d || '';
    }

    group.userData.chapterIdx = content.chapterIdx;
    group.userData.pageIdx = content.pageIdx;

    // Entsaettigung fuer nicht-aktive Panels
    const isActive = (panelName === 'main' || panelName === 'top' || panelName === 'info');
    group.traverse(child => {
        if (child.isMesh && child.material && !child.userData.isSpace && !child.userData.isBg) {
            if (!isActive) {
                const hsl = {};
                child.material.color.getHSL(hsl);
                child.material.color.setHSL(hsl.h, hsl.s * CONFIG.desaturationAmount, hsl.l);
            }
        }
    });
}

// ========== 2D CANVAS TEXT FOR NAV QUADS ==========

/* Determine the text label for a given nav panel */
function _getNavQuadLabel(panelName, content) {
    /* "end" boundary labels */
    if (content.endLabel) return content.endLabel;

    const ch = content.chapterIdx;
    const pg = content.pageIdx;
    const chName = getChapterLabel(ch, pg);
    // Map panel names to quadrant positions
    // TL = main/top → page label
    // TR = next     → chapter name
    // BL = bottom   → citation
    // BR = info     → '0fun'
    const pageNames = (LIBRARY[ch] && LIBRARY[ch].pageNames) ? LIBRARY[ch].pageNames : null;
    const pageLabel = pageNames && pageNames[pg] ? pageNames[pg] : 'page ' + (pg + 1);
    switch (panelName) {
        case 'main': case 'top':
            return pageLabel;
        case 'next': case 'nextNext': case 'prev':
            return chName;
        case 'bottom': case 'bottomBottom': case 'topTop':
            return pageLabel;
        case 'info':
            return '0fun';
        default:
            return chName;
    }
}

/* Build a THREE.Mesh with canvas-rendered fill-box text (uses shared helpers) */
function _buildCanvasTextMesh(text, areaW, areaH, panelName) {
    const words = splitFillBoxWords(text);
    if (words.length === 0) return null;

    const sc = 2;
    const cvs = document.createElement('canvas');
    cvs.width = Math.round(areaW * sc);
    cvs.height = Math.round(areaH * sc);
    const ctx = cvs.getContext('2d');

    const pad = 0.06;
    const padPx = Math.round(cvs.width * pad);
    const usW = cvs.width - 2 * padPx;
    const usH = cvs.height - 2 * padPx;
    const layout = computeFillBox(ctx, words, usW, usH);
    if (!layout) return null;

    /* Position-aware alignment */
    const isLeft = (panelName === 'main' || panelName === 'top' || panelName === 'prev' || panelName === 'topTop');
    const isTop = (panelName === 'main' || panelName === 'top' || panelName === 'prev' ||
                   panelName === 'next' || panelName === 'topTop' || panelName === 'nextNext');
    const hAlign = isLeft ? 'left' : 'right';
    const vAlign = isTop ? 'top' : 'bottom';

    ctx.fillStyle = getActivePalette().accent;
    renderFillBox(ctx, layout, padPx, padPx, cvs.width, cvs.height, hAlign, vAlign);

    const tex = new THREE.CanvasTexture(cvs);
    const geo = new THREE.PlaneGeometry(areaW, areaH);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = 0.5; // in front of background
    return mesh;
}

// ========== QUADRANT TRANSFORMS ==========

function applyQuadrantTransforms() {
    PANEL_NAMES_ALL.forEach(name => {
        const group = quadrants[name];
        const pos = quadrantPositions[name];
        const size = quadrantSizes[name];
        if (!pos || !size) return;

        group.position.x = pos.x;
        group.position.y = pos.y;

        // Stretch: Skalierung anpassen wenn Groesse != SQ
        // (Bei Animation aendert sich w/h)
        group.scale.x = (group.scale.x || 1); // Wird vom Letter-Layout gesetzt
        // Nur X-Stretch bei X-Animation, Y-Stretch bei Y-Animation
        // wird in den Animations-Funktionen direkt gesetzt
    });
}

// ========== Z-INDEX / VISIBILITY ==========

let activeAxis = 'x';

function setAxisVisibility(axis) {
    activeAxis = axis;
    /* Ensure base visibility is restored after loading / transitions */
    ['prev', 'next', 'nextNext', 'topTop', 'bottom', 'bottomBottom', 'info'].forEach(n => {
        quadrants[n].visible = true;
    });

    // Bei X aktiv: main sichtbar, top versteckt (sie teilen oben-links)
    // Bei Y aktiv: top sichtbar, main versteckt
    if (axis === 'x') {
        quadrants.main.visible = true;
        quadrants.top.visible = false;
        // X-panels vor Y-panels
        ['prev', 'main', 'next', 'nextNext'].forEach(n => { quadrants[n].renderOrder = 10; });
        ['topTop', 'top', 'bottom', 'bottomBottom'].forEach(n => { quadrants[n].renderOrder = 5; });
    } else {
        quadrants.main.visible = false;
        quadrants.top.visible = true;
        ['prev', 'main', 'next', 'nextNext'].forEach(n => { quadrants[n].renderOrder = 5; });
        ['topTop', 'top', 'bottom', 'bottomBottom'].forEach(n => { quadrants[n].renderOrder = 10; });
    }
    navState.needsRender = true;
}

// ========== NAV QUAD CLICK ==========

function _setupNavQuadClicks() {
    /* Listen on document – nav-viewport has pointer-events:none so we
       cannot attach click listeners there. */
    document.addEventListener('click', e => {
        if (!_canAcceptNavInput()) return;
        const sq = Math.min(W, H) / 4;
        const cx = e.clientX, cy = e.clientY;

        const inTR = cx > W - sq && cy < sq;
        const inTL = cx < sq && cy < sq;
        const inBL = cx < sq && cy > H - sq;
        const inBR = cx > W - sq && cy > H - sq;

        if (inTR) {
            navigateX(1);
        } else if (inTL) {
            navigateY(-1);
        } else if (inBL) {
            navigateY(1);
        } else if (inBR) {
            navigateX(-1);
        }
    });
}

// ========== INPUT ==========

function handleKeyDown(event) {
    if (!_canAcceptNavInput()) return;
    if (event.key === 'ArrowRight')  { event.preventDefault(); navigateX(1); }
    else if (event.key === 'ArrowLeft')  { event.preventDefault(); navigateX(-1); }
    else if (event.key === 'ArrowDown')  { event.preventDefault(); navigateY(1); }
    else if (event.key === 'ArrowUp')    { event.preventDefault(); navigateY(-1); }
}

// ========== NAVIGATION ==========

function _canAcceptNavInput() {
    return !(navState.isAnimating || _loadingActive);
}

function _getBoundaryFlashSide(axis, direction) {
    if (axis === 'x') return direction > 0 ? 'right' : 'left';
    return direction > 0 ? 'bottom' : 'top';
}

function _resolveNavigationTarget(axis, direction) {
    if (axis === 'x') {
        const newCh = navState.currentChapter + direction;
        if (newCh < 0 || newCh >= CHAPTER_DEFS.length) {
            return { ok: false, side: _getBoundaryFlashSide('x', direction) };
        }
        return { ok: true, newCh, newPg: 0 };
    }

    const maxPage = getPageCount(navState.currentChapter) - 1;
    const newPg = navState.currentPage + direction;
    if (newPg < 0 || newPg > maxPage) {
        return { ok: false, side: _getBoundaryFlashSide('y', direction) };
    }
    return { ok: true, newCh: navState.currentChapter, newPg };
}

function _navigate(axis, direction) {
    if (!_canAcceptNavInput()) return;

    const target = _resolveNavigationTarget(axis, direction);
    if (!target.ok) {
        flashBorder(target.side);
        return;
    }

    navState.isAnimating = true;
    navState.pendingSync = null;

    let cdsAccepted = true;
    if (window.ContentLayer && ContentLayer.transitionTo) {
        cdsAccepted = !!ContentLayer.transitionTo(target.newCh, target.newPg);
    }

    if (!cdsAccepted) {
        navState.isAnimating = false;
        return;
    }

    setAxisVisibility(axis);

    const animFn = axis === 'x' ? animateX : animateY;
    animFn(direction).then(() => {
        gsap.delayedCall(ANIM.resetDelay, () => {
            _commitNavState(target.newCh, target.newPg, 'x');
            navState.isAnimating = false;
            _flushPendingSync();
        });
    });
}

function navigateX(direction) {
    _navigate('x', direction);
}

function navigateY(direction) {
    _navigate('y', direction);
}

// ========== HELPERS ==========

function flashBorder(side) {
    const el = document.body;
    const shadows = {
        'right': 'inset -20px 0 30px rgba(255,0,0,0.5)',
        'left': 'inset 20px 0 30px rgba(255,0,0,0.5)',
        'bottom': 'inset 0 -20px 30px rgba(255,0,0,0.5)',
        'top': 'inset 0 20px 30px rgba(255,0,0,0.5)'
    };
    el.style.boxShadow = shadows[side] || '';
    gsap.delayedCall(INPUT_TIMING.navBoundaryFlash, () => { el.style.boxShadow = 'none'; });
}

function resetToDefaults() {
    recalcLayout();
    quadrantPositions = getDefaultPositions();
    quadrantSizes = getDefaultSizes();
    applyQuadrantTransforms();
    // Scale zuruecksetzen nach Animation
    // (Letter-Scale ist auf dem letterGroup-Child, nicht auf dem Quadrant-Group)
    PANEL_NAMES_ALL.forEach(name => {
        quadrants[name].scale.set(1, 1, 1);
    });
}

function updateStatusDisplay() {
    const el = document.getElementById('statusDisplay');
    if (!el) return;
    const def = CHAPTER_DEFS[navState.currentChapter];
    const totalPages = getPageCount(navState.currentChapter);
    el.textContent = def.name + ' | ' + (navState.currentPage + 1) + '/' + totalPages;
}

function _commitNavState(ch, pg, axisAfter) {
    navState.currentChapter = ch;
    navState.currentPage = pg;
    resetToDefaults();
    setAxisVisibility(axisAfter || 'x');
    updateAllQuadrantContent();
    updateStatusDisplay();
}

function _flushPendingSync() {
    if (!navState.pendingSync) return;
    const p = navState.pendingSync;
    navState.pendingSync = null;
    _commitNavState(p.ch, p.pg, 'x');
}

// ========== ANIMATIONS ==========

function animateX(direction) {
    return new Promise(resolve => {
        const defaults = getDefaultPositions();
        const tl = buildNavTransitionTimeline({
            axis: 'x', direction, quadrants, defaults, SQ,
            viewW: W, viewH: H,
            onUpdate: () => { navState.needsRender = true; }
        });
        tl.then(resolve);
    });
}

function animateY(direction) {
    return new Promise(resolve => {
        const defaults = getDefaultPositions();
        const tl = buildNavTransitionTimeline({
            axis: 'y', direction, quadrants, defaults, SQ,
            viewW: W, viewH: H,
            onUpdate: () => { navState.needsRender = true; }
        });
        tl.then(resolve);
    });
}

// ========== RENDER LOOP (via shared gsap.ticker) ==========

function startRenderLoop() {
    registerRenderCallback(() => {
        if (navState.needsRender || navState.isAnimating) {
            renderer.render(scene, camera);
            navState.needsRender = false;
        }
    });
}

// ========== RESIZE ==========

function handleResize() {
    recalcLayout();
    W = window.innerWidth;
    H = window.innerHeight;

    renderer.setSize(W, H);
    camera.left = -W/2;
    camera.right = W/2;
    camera.top = H/2;
    camera.bottom = -H/2;
    camera.updateProjectionMatrix();

    resetToDefaults();
    updateAllQuadrantContent();
    navState.needsRender = true;
}

// ========== NAV-ONLY TRANSITION (called by CDS on scroll swap) ==========

/**
 * Run nav stretch-slide animation WITHOUT triggering a CDS transition.
 * Used by app.js _scrollSwap() so the CDS swaps instantly while nav animates.
 */
function animateTransition(axis, direction, newCh, newPg) {
    if (navState.isAnimating) return false;
    navState.isAnimating = true;
    navState.pendingSync = null;
    setAxisVisibility(axis);

    const animFn = axis === 'x' ? animateX : animateY;
    animFn(direction).then(() => {
        gsap.delayedCall(ANIM.resetDelay, () => {
            _commitNavState(newCh, newPg, 'x');
            navState.isAnimating = false;
            _flushPendingSync();
        });
    });

    return true;
}

// ========== PUBLIC API ==========

window.NavLayer = {
    navigateX: navigateX,
    navigateY: navigateY,
    animateTransition: animateTransition,
    isAnimating: () => navState.isAnimating,
    /** Called by app.js after scroll-triggered transitions to sync nav state & labels */
    syncState: function(ch, pg) {
        /* If nav is mid-animation, queue sync and apply after animation commit. */
        if (navState.isAnimating) {
            navState.pendingSync = { ch, pg };
            return;
        }
        _commitNavState(ch, pg, 'x');
        navState.needsRender = true;
    },
};

// ========== START ==========

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', navInit);
} else {
    navInit();
}
