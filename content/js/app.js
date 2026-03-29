/**
 * CONTENT LAYER (CDS) — ES Module v55
 * Three.js WebGL renderer for the main content grid.
 *
 * Changes from v54:
 * - ES module (imports from three, library, layout, shared)
 * - Removed duplicate ANIM config (uses shared/anim-config.js)
 * - Removed duplicate fill-box functions (uses shared/helpers.js)
 * - CDS transition no longer blocks on aspect preloading
 * - Render-on-dirty (no longer renders every frame)
 * - Exports ContentLayer on window for nav.js communication
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LIBRARY, getChapterCount, getPageCount, getMainNodesForPage, getPageSections } from '../../library.js';
import { computeLayout, LAYOUT_CONST } from './layout.js';
import { ANIM, lerp } from './shared/anim-config.js';
import { splitFillBoxWords, computeFillBox, renderFillBox } from './shared/helpers.js';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const MAIN_COLOR = '#E74C3C';
const SUB_COLOR  = '#F39C12';
const PET_COLOR  = '#8E44AD';
const NETZ_COLOR = '#D5D5D5';
const PET_Z      = 5;
const OVERSCROLL_THRESHOLD = 150;

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */
let W = window.innerWidth;
let H = window.innerHeight;
let dpr = window.devicePixelRatio || 1;
let renderer, scene, camera;
let currentChapter = 0, currentPage = 0;
let currentLayout = null, currentPageGroup = null;
let isAnimating = false, isFrozen = false;
let panY = 0, overscrollAcc = 0, overscrollDir = 0;
let _scrollLandAtEnd = false;
let _scrollSwapping = false;
let isPanning = false, panStartY = 0, panStartPanY = 0;
let fixedNavGroup = null;
let navColumnAnimGroup = null, navColumnAnimData = null;
let frameTemplate = null, frameBBox = null, frameReady = false;
let needsRender = true;
let pageNodes = [];
let flashEl;
let _landingEl = null;

const L = {
    frames3d: true, beams3d: true, images: true,
    netz3d: true, pets: true,
    outlines_content: true, outlines_nav: true, outlines_beam: true
};

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
function init() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H);
    renderer.setClearColor(0xffffff, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const container = document.getElementById('content-layer');
    container.appendChild(renderer.domElement);

    camera = new THREE.OrthographicCamera(0, W, 0, -H, 0.1, 4000);
    camera.position.set(0, 0, 500);

    scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(100, -200, 400);
    scene.add(dirLight);

    flashEl = document.getElementById('flash');
    _landingEl = document.getElementById('landing-banners');
    if (_landingEl) _landingEl.style.display = 'none';

    window.addEventListener('resize', _onResize);
    _setupPanning();
    _animate();
    showPage(0, 0);
}

/* ═══════════════════════════════════════════════════════════════
   GLB LOADING (lazy)
   ═══════════════════════════════════════════════════════════════ */
let _glbPromise = null;

function _ensureGLBs() {
    if (frameReady || _glbPromise) return;
    _glbPromise = _loadFrameGLB();
}

async function _loadFrameGLB() {
    try {
        const loader = new GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/frames/frame-simple.glb',
                resolve, undefined, reject
            );
        });
        const s = gltf.scene;
        s.rotation.x = Math.PI / 2;
        s.updateMatrixWorld(true);
        frameBBox = new THREE.Box3().setFromObject(s);
        frameTemplate = s;
        frameReady = true;
        needsRender = true;
        console.log('[CDS] Frame GLB ready');
    } catch (err) {
        console.warn('[CDS] GLB load failed:', err);
    }
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function _cloneScene(src) {
    const c = src.clone(true);
    c.traverse(ch => { if (ch.isMesh && ch.material) ch.material = ch.material.clone(); });
    return c;
}

function _colorize(group, hex) {
    const color = new THREE.Color(hex);
    group.traverse(ch => { if (ch.isMesh && ch.material && ch.material.color) ch.material.color.copy(color); });
}

function _disposeTree(obj) {
    obj.traverse(ch => {
        if (ch.geometry) ch.geometry.dispose();
        if (ch.material) {
            if (Array.isArray(ch.material)) ch.material.forEach(m => m.dispose());
            else ch.material.dispose();
        }
    });
}

/* ═══════════════════════════════════════════════════════════════
   3D BUILDERS
   ═══════════════════════════════════════════════════════════════ */
function _createFrame3d(rect, color, parentGroup) {
    if (!frameReady || !frameTemplate || !frameBBox) return;
    const clone = _cloneScene(frameTemplate);
    const bboxSize = new THREE.Vector3();
    frameBBox.getSize(bboxSize);
    const sx = rect.w / bboxSize.x;
    const sy = rect.h / bboxSize.y;
    clone.scale.set(sx, sy, Math.min(sx, sy));
    clone.position.set(rect.x + rect.w / 2, -(rect.y + rect.h / 2), 2);
    _colorize(clone, color);
    parentGroup.add(clone);
}

function _createNetzQuad3d(nq, parentGroup) {
    let geo;
    if (nq.type === 'rect') {
        geo = new THREE.PlaneGeometry(nq.w, nq.h);
    } else if (nq.pts) {
        const shape = new THREE.Shape();
        shape.moveTo(nq.pts[0][0], -nq.pts[0][1]);
        for (let i = 1; i < nq.pts.length; i++) shape.lineTo(nq.pts[i][0], -nq.pts[i][1]);
        geo = new THREE.ShapeGeometry(shape);
    } else return;

    const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(NETZ_COLOR), side: THREE.DoubleSide,
        transparent: true, opacity: 0.7
    });
    const mesh = new THREE.Mesh(geo, mat);
    if (nq.type === 'rect') mesh.position.set(nq.x + nq.w / 2, -(nq.y + nq.h / 2), 0);
    else mesh.position.z = 0;
    parentGroup.add(mesh);

    const edges = new THREE.EdgesGeometry(geo);
    const edgeMesh = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#999999' }));
    edgeMesh.position.copy(mesh.position);
    parentGroup.add(edgeMesh);
}

function _createWireRect(rect, color, parentGroup, z) {
    const geo = new THREE.PlaneGeometry(rect.w, rect.h);
    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: new THREE.Color(color) }));
    line.position.set(rect.x + rect.w / 2, -(rect.y + rect.h / 2), z || 6);
    parentGroup.add(line);
}

/* ═══════════════════════════════════════════════════════════════
   FIXED NAV GROUP — opaque covers at z=8 to mask scrolling netz
   ═══════════════════════════════════════════════════════════════ */
function _buildFixedNavGroup(layout) {
    const group = new THREE.Group();
    group.name = 'fixedNav';

    [layout.navTL, layout.navTR, layout.navBL, layout.navBR].forEach(rect => {
        const geo = new THREE.PlaneGeometry(rect.w, rect.h);
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#D5D5D5'), side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(rect.x + rect.w / 2, -(rect.y + rect.h / 2), 8);
        group.add(mesh);
    });

    return group;
}

/* ═══════════════════════════════════════════════════════════════
   NAV COLUMN SQUEEZE ANIMATION
   ═══════════════════════════════════════════════════════════════ */
function _buildNavColumnAnimGroup(layout) {
    if (!layout.sectionRanges || layout.sectionRanges.length < 2) return null;

    const group = new THREE.Group();
    group.name = 'navColumnAnim';
    const SQ = layout.SQ;
    const innerH = H - 2 * SQ;

    const bgColor = new THREE.Color('#D5D5D5');
    const bgL = new THREE.Mesh(new THREE.PlaneGeometry(SQ, innerH), new THREE.MeshBasicMaterial({ color: bgColor, side: THREE.DoubleSide }));
    bgL.position.set(SQ / 2, -(SQ + innerH / 2), 7);
    group.add(bgL);
    const bgR = new THREE.Mesh(new THREE.PlaneGeometry(SQ, innerH), new THREE.MeshBasicMaterial({ color: bgColor, side: THREE.DoubleSide }));
    bgR.position.set(W - SQ / 2, -(SQ + innerH / 2), 7);
    group.add(bgR);

    function makeStrip(name) {
        const g = new THREE.Group(); g.name = name;
        const geo = new THREE.PlaneGeometry(SQ, innerH);
        g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(NETZ_COLOR), side: THREE.DoubleSide, transparent: true, opacity: 0.7 })));
        g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#999999' })));
        return g;
    }

    const strip0L = makeStrip('s0L'), strip0R = makeStrip('s0R');
    const strip1L = makeStrip('s1L'), strip1R = makeStrip('s1R');
    group.add(strip0L, strip0R, strip1L, strip1R);
    navColumnAnimData = { strip0L, strip0R, strip1L, strip1R, bgL, bgR, SQ, innerH };
    return group;
}

function _positionStrip(strip, cx, topY, dispH, natH, vis) {
    strip.visible = vis && dispH > 0.5;
    if (!strip.visible) return;
    strip.position.set(cx, -(topY + dispH / 2), 7.5);
    strip.scale.set(1, dispH / natH, 1);
}

function _updateNavColumnAnim() {
    if (!navColumnAnimData) return;
    const d = navColumnAnimData;
    const slotTop = d.SQ, slotBot = H - d.SQ, innerH = d.innerH;
    const cxL = d.SQ / 2, cxR = W - d.SQ / 2;
    const gapTopV = H - d.SQ - panY, gapBotV = H - panY;
    const transActive = panY > 0 && gapBotV > slotTop;

    if (!transActive) {
        if (panY <= 0) {
            _positionStrip(d.strip0L, cxL, slotTop, innerH, innerH, true);
            _positionStrip(d.strip0R, cxR, slotTop, innerH, innerH, true);
            _positionStrip(d.strip1L, cxL, 0, 0, innerH, false);
            _positionStrip(d.strip1R, cxR, 0, 0, innerH, false);
        } else {
            _positionStrip(d.strip0L, cxL, 0, 0, innerH, false);
            _positionStrip(d.strip0R, cxR, 0, 0, innerH, false);
            _positionStrip(d.strip1L, cxL, slotTop, innerH, innerH, true);
            _positionStrip(d.strip1R, cxR, slotTop, innerH, innerH, true);
        }
        return;
    }

    const strip0Space = Math.max(0, gapTopV - slotTop);
    const strip0Ratio = strip0Space / innerH;
    let s0top, s0h, s1top, s1h;

    if (strip0Ratio > 0.1) {
        s0top = slotTop; s0h = strip0Space; s1top = slotTop + strip0Space; s1h = slotBot - s1top;
    } else if (strip0Space > 0) {
        const tenP = innerH * 0.1, slideT = 1 - (strip0Space / (innerH * 0.1));
        s0h = tenP; s0top = slotTop - tenP * slideT;
        s1top = Math.max(slotTop, s0top + s0h); s1h = slotBot - s1top;
    } else {
        s0h = 0; s0top = slotTop; s1top = slotTop; s1h = innerH;
    }

    _positionStrip(d.strip0L, cxL, s0top, s0h, innerH, true);
    _positionStrip(d.strip0R, cxR, s0top, s0h, innerH, true);
    _positionStrip(d.strip1L, cxL, s1top, s1h, innerH, true);
    _positionStrip(d.strip1R, cxR, s1top, s1h, innerH, true);
}

/* ═══════════════════════════════════════════════════════════════
   REAL MEDIA: Image / Video / Text as Three.js planes
   ═══════════════════════════════════════════════════════════════ */
function _createMediaPlane(rect, nodeData, parentGroup, is3d) {
    if (!nodeData) return;
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    const boxW = is3d ? rect.w / 3 : rect.w;
    const boxH = is3d ? rect.h / 3 : rect.h;
    const mediaZ = is3d ? 1 : 3;

    if (nodeData.type === 'image' && (nodeData.image || nodeData.url)) {
        const url = nodeData.image || nodeData.url;
        if (boxW < 2 || boxH < 2) return;
        const planeGeo = new THREE.PlaneGeometry(boxW, boxH);
        const planeMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(nodeData.color || '#888'),
            side: THREE.DoubleSide, transparent: true, opacity: 0.3
        });
        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        planeMesh.position.set(cx, -cy, mediaZ);
        parentGroup.add(planeMesh);

        const texLoader = new THREE.TextureLoader();
        texLoader.setCrossOrigin('anonymous');
        texLoader.load(url, tex => {
            tex.colorSpace = THREE.SRGBColorSpace;
            const iw = tex.image ? tex.image.width : 1;
            const ih = tex.image ? tex.image.height : 1;
            const imgAspect = (iw || 1) / (ih || 1);
            const boxAspect = boxW / boxH;
            let fw, fh;
            if (is3d) {
                if (imgAspect > boxAspect) { fw = boxW; fh = boxW / imgAspect; } else { fh = boxH; fw = boxH * imgAspect; }
            } else {
                if (imgAspect > boxAspect) { fh = boxH; fw = boxH * imgAspect; } else { fw = boxW; fh = boxW / imgAspect; }
                const uvW = boxW / fw, uvH = boxH / fh;
                tex.offset.set((1 - uvW) / 2, (1 - uvH) / 2);
                tex.repeat.set(uvW, uvH);
                fw = boxW; fh = boxH;
            }
            planeMesh.geometry.dispose();
            planeMesh.geometry = new THREE.PlaneGeometry(fw, fh);
            planeMat.map = tex; planeMat.color.set(0xffffff); planeMat.opacity = 1.0; planeMat.needsUpdate = true;
            needsRender = true;
        }, undefined, err => {
            console.warn('[CDS] ❌ FAILED ' + url.split('/').pop(), err);
            planeMat.opacity = 0.5; needsRender = true;
        });
    } else if (nodeData.type === 'video' && (nodeData.video || nodeData.url)) {
        const vUrl = nodeData.video || nodeData.url;
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; video.src = vUrl;
        video.loop = true; video.muted = true; video.playsInline = true; video.autoplay = true;
        video.play().catch(() => {});
        const vTex = new THREE.VideoTexture(video);
        vTex.colorSpace = THREE.SRGBColorSpace;
        const vMesh = new THREE.Mesh(new THREE.PlaneGeometry(boxW, boxH), new THREE.MeshBasicMaterial({ map: vTex, side: THREE.DoubleSide }));
        vMesh.position.set(cx, -cy, mediaZ);
        parentGroup.add(vMesh);
        /* Video textures need continuous rendering while playing */
        const videoRenderLoop = () => { if (video.readyState >= video.HAVE_CURRENT_DATA) needsRender = true; if (!video.paused && !video.ended) requestAnimationFrame(videoRenderLoop); };
        video.addEventListener('playing', videoRenderLoop);
        video.addEventListener('loadedmetadata', () => {
            const vw = video.videoWidth || 1, vh = video.videoHeight || 1;
            const va = vw / vh, ba = boxW / boxH;
            let fw, fh;
            if (is3d) { if (va > ba) { fw = boxW; fh = boxW / va; } else { fh = boxH; fw = boxH * va; } }
            else { if (va > ba) { fh = boxH; fw = boxH * va; } else { fw = boxW; fh = boxW / va; }
                const uvW = boxW / fw, uvH = boxH / fh; vTex.offset.set((1 - uvW) / 2, (1 - uvH) / 2); vTex.repeat.set(uvW, uvH); fw = boxW; fh = boxH; }
            vMesh.geometry.dispose(); vMesh.geometry = new THREE.PlaneGeometry(fw, fh); needsRender = true;
        });
    } else if (nodeData.type === 'text') {
        _createTextPlane(rect, nodeData, parentGroup, mediaZ);
    }
}

/* ═══════════════════════════════════════════════════════════════
   TEXT PLANE (uses shared fill-box helpers)
   ═══════════════════════════════════════════════════════════════ */
function _createTextPlane(rect, nodeData, parentGroup, z) {
    const text = nodeData.title || nodeData.text || '';
    if (!text) return;
    const W_RECT = rect.w, H_RECT = rect.h;
    if (W_RECT < 10 || H_RECT < 10) return;
    const sc = 2;
    const cvs = document.createElement('canvas');
    cvs.width = Math.round(W_RECT * sc); cvs.height = Math.round(H_RECT * sc);
    const ctx = cvs.getContext('2d');
    const words = splitFillBoxWords(text);
    if (words.length === 0) return;
    const PAD = Math.round(cvs.width * 0.04);
    const layout = computeFillBox(ctx, words, cvs.width - 2 * PAD, cvs.height - 2 * PAD);
    if (!layout) return;
    ctx.fillStyle = nodeData.color || '#222';
    renderFillBox(ctx, layout, PAD, PAD, cvs.width, cvs.height, 'alternate', 'center');
    const tTex = new THREE.CanvasTexture(cvs);
    const tMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(W_RECT, H_RECT),
        new THREE.MeshBasicMaterial({ map: tTex, transparent: true, side: THREE.DoubleSide })
    );
    tMesh.position.set(rect.x + W_RECT / 2, -(rect.y + H_RECT / 2), z || 3);
    parentGroup.add(tMesh);
}

/* ═══════════════════════════════════════════════════════════════
   PAGE GROUP BUILDING
   ═══════════════════════════════════════════════════════════════ */
function _buildPageGroup(layout, chIdx, pgIdx, skipNav, nodes) {
    skipNav = skipNav || {};
    const _nodes = nodes || pageNodes || [];
    const pg = new THREE.Group();
    pg.name = 'page-ch' + chIdx + '-p' + pgIdx;

    const fg = new THREE.Group(); fg.name = 'frames'; pg.add(fg);
    const ig = new THREE.Group(); ig.name = 'images'; pg.add(ig);
    const ng = new THREE.Group(); ng.name = 'netz'; pg.add(ng);
    const ocg = new THREE.Group(); ocg.name = 'outlines-content'; pg.add(ocg);
    const ong = new THREE.Group(); ong.name = 'outlines-nav'; pg.add(ong);
    const ptg = new THREE.Group(); ptg.name = 'pets'; pg.add(ptg);

    const SQ = layout.SQ;

    /* Nav quad wireframes */
    [{ rect: layout.navTL, skip: skipNav.left || skipNav.top },
     { rect: layout.navTR, skip: skipNav.right || skipNav.top },
     { rect: layout.navBL, skip: skipNav.left || skipNav.bottom },
     { rect: layout.navBR, skip: skipNav.right || skipNav.bottom }
    ].forEach(e => { if (!e.skip) _createWireRect(e.rect, '#E74C3C', ong, 6); });

    /* Mains */
    let _any3d = false;
    layout.mains.forEach((m, mi) => {
        const node = _nodes[mi];
        const is3d = node && node.render3d;
        if (is3d) _any3d = true;
        _createWireRect(m, MAIN_COLOR, ocg, 6);
        if (is3d) _createFrame3d(m, (node.color || MAIN_COLOR), fg);
        if (node) _createMediaPlane(m, node, ig, is3d);
    });

    /* Subs */
    layout.subs.forEach((group, gi) => {
        group.forEach((s, si) => {
            _createWireRect(s, SUB_COLOR, ocg, 6);
            let subNode = null;
            if (_nodes[gi] && _nodes[gi].children && _nodes[gi].children[si]) subNode = _nodes[gi].children[si];
            const subIs3d = subNode && subNode.render3d;
            if (subIs3d) { _any3d = true; _createFrame3d(s, subNode.color || SUB_COLOR, fg); }
            if (subNode) _createMediaPlane(s, subNode, ig, subIs3d);
        });
    });

    if (_any3d) _ensureGLBs();

    /* Pets */
    if (layout.pets) {
        layout.pets.forEach(pet => {
            let petNode = null;
            if (pet.parentType === 'main' && _nodes[pet.parentIndex]) {
                const mn = _nodes[pet.parentIndex];
                if (mn.pets && mn.pets[pet.petIndex]) petNode = mn.pets[pet.petIndex];
            } else if (pet.parentType === 'sub' && _nodes[pet.parentIndex]) {
                const mn = _nodes[pet.parentIndex];
                if (mn.children && mn.children[pet.subIndex]) {
                    const sn = mn.children[pet.subIndex];
                    if (sn.pets && sn.pets[pet.petIndex]) petNode = sn.pets[pet.petIndex];
                }
            }
            if (petNode && (petNode.image || petNode.video || petNode.type === 'text')) {
                const petGrp = new THREE.Group(); petGrp.position.z = PET_Z;
                _createMediaPlane({ x: pet.x - pet.w / 2, y: pet.y - pet.h / 2, w: pet.w, h: pet.h }, petNode, petGrp, false);
                petGrp.traverse(ch => { if (ch.position && ch !== petGrp) ch.position.z = 0; });
                ptg.add(petGrp);
            } else {
                const meshP = new THREE.Mesh(new THREE.PlaneGeometry(pet.w, pet.h),
                    new THREE.MeshBasicMaterial({ color: new THREE.Color(petNode ? petNode.color : PET_COLOR), side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
                meshP.position.set(pet.x, -pet.y, PET_Z);
                ptg.add(meshP);
            }
            const edgesLine = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(pet.w, pet.h)),
                new THREE.LineBasicMaterial({ color: new THREE.Color(petNode ? petNode.color : PET_COLOR) }));
            edgesLine.position.set(pet.x, -pet.y, PET_Z + 0.1);
            ptg.add(edgesLine);
        });
    }

    /* Netz */
    layout.netz.forEach(nq => { if (!_isNetzInSkippedZone(nq, SQ, skipNav, W)) _createNetzQuad3d(nq, ng); });

    fg.visible = !!L.frames3d; ig.visible = !!L.images; ng.visible = !!L.netz3d;
    ptg.visible = !!L.pets; ocg.visible = !!L.outlines_content; ong.visible = !!L.outlines_nav;
    pg.userData.layout = layout; pg.userData.chapterIdx = chIdx; pg.userData.pageIdx = pgIdx;
    return pg;
}

function _isNetzInSkippedZone(nq, SQ, skipNav, viewW) {
    if (!skipNav) return false;
    let cx, cy, cr, cb;
    if (nq.type === 'rect') { cx = nq.x; cy = nq.y; cr = nq.x + nq.w; cb = nq.y + nq.h; }
    else if (nq.pts) { cx = Infinity; cy = Infinity; cr = -Infinity; cb = -Infinity; nq.pts.forEach(p => { cx = Math.min(cx, p[0]); cy = Math.min(cy, p[1]); cr = Math.max(cr, p[0]); cb = Math.max(cb, p[1]); }); }
    else return false;
    if (skipNav.left && cr <= SQ + 1) return true;
    if (skipNav.right && cx >= viewW - SQ - 1) return true;
    if (skipNav.top && cb <= SQ + 1) return true;
    if (skipNav.bottom && cy >= H - SQ - 1) return true;
    return false;
}

/* ═══════════════════════════════════════════════════════════════
   ASPECT RATIO PRELOADING
   ═══════════════════════════════════════════════════════════════ */
const _aspectCache = {};

function _loadAspect(url) {
    if (_aspectCache[url] !== undefined) return Promise.resolve(_aspectCache[url]);
    return new Promise(resolve => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => { _aspectCache[url] = (img.naturalWidth || 1) / (img.naturalHeight || 1); resolve(_aspectCache[url]); };
        img.onerror = () => { _aspectCache[url] = LAYOUT_CONST.MAIN_ASPECT; resolve(LAYOUT_CONST.MAIN_ASPECT); };
        img.src = url;
    });
}

function _loadVideoAspect(url) {
    if (_aspectCache[url] !== undefined) return Promise.resolve(_aspectCache[url]);
    return new Promise(resolve => {
        const v = document.createElement('video'); v.crossOrigin = 'anonymous'; v.preload = 'metadata';
        v.onloadedmetadata = () => { _aspectCache[url] = (v.videoWidth || 1) / (v.videoHeight || 1); resolve(_aspectCache[url]); v.src = ''; };
        v.onerror = () => { _aspectCache[url] = LAYOUT_CONST.MAIN_ASPECT; resolve(LAYOUT_CONST.MAIN_ASPECT); v.src = ''; };
        v.src = url;
    });
}

function _getNodeAspect(node, fallback) {
    const url = node.image || node.url || node.video;
    if (!url) return Promise.resolve(fallback);
    if (node.type === 'video') return _loadVideoAspect(url);
    if (node.type === 'image') return _loadAspect(url);
    return Promise.resolve(fallback);
}

function _preloadPageAspects(nodes) {
    const promises = [], structure = [];
    for (let i = 0; i < nodes.length; i++) {
        promises.push(_getNodeAspect(nodes[i], LAYOUT_CONST.MAIN_ASPECT));
        const cc = (nodes[i].children || []).length; structure.push(cc);
        for (let j = 0; j < cc; j++) promises.push(_getNodeAspect(nodes[i].children[j], LAYOUT_CONST.SUB_ASPECT));
    }
    return Promise.all(promises).then(results => {
        const mainAspects = [], subAspects = [];
        let idx = 0;
        for (let i = 0; i < nodes.length; i++) {
            mainAspects.push(results[idx++]);
            const ca = []; for (let j = 0; j < structure[i]; j++) ca.push(results[idx++]);
            subAspects.push(ca);
        }
        return { mainAspects, subAspects };
    });
}

/* ═══════════════════════════════════════════════════════════════
   DATA BRIDGE: LIBRARY → Layout Config
   ═══════════════════════════════════════════════════════════════ */
function _buildPageConfig(nodes, aspects, sectionDefs) {
    const subsPerMainArr = [], petsPerMainArr = [], petsPerSubArr = [], petDataArr = [];
    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        subsPerMainArr.push(n.children ? n.children.length : 0);
        petsPerMainArr.push(n.pets ? n.pets.length : 0);
        if (n.pets) n.pets.forEach(p => petDataArr.push(p));
        if (n.children) n.children.forEach(ch => petsPerSubArr.push(ch.pets ? ch.pets.length : 0));
    }
    return {
        mainCount: nodes.length, subsPerMain: subsPerMainArr,
        petsPerMain: petsPerMainArr, petsPerSub: petsPerSubArr, petData: petDataArr,
        mainAspects: aspects ? aspects.mainAspects : null,
        subAspects: aspects ? aspects.subAspects : null,
        sections: sectionDefs || null
    };
}

/* ═══════════════════════════════════════════════════════════════
   RENDER CURRENT PAGE
   ═══════════════════════════════════════════════════════════════ */
function renderCurrentPage() {
    const nodes = getMainNodesForPage(currentChapter, currentPage);
    pageNodes = nodes;
    const sectionDefs = getPageSections(currentChapter, currentPage);
    /* Capture and reset scroll-land flag before async work */
    const landAtEnd = _scrollLandAtEnd;
    _scrollLandAtEnd = false;

    _preloadPageAspects(nodes).then(aspects => {
        const cfg = _buildPageConfig(nodes, aspects, sectionDefs);
        const layout = computeLayout(cfg, W, H);
        console.log('[CDS] ch=' + currentChapter + ' pg=' + currentPage +
            ' mains=' + layout.mains.length + ' totalH=' + layout.totalContentHeight);
        currentLayout = layout;

        if (currentPageGroup) { scene.remove(currentPageGroup); _disposeTree(currentPageGroup); }
        if (fixedNavGroup) { scene.remove(fixedNavGroup); _disposeTree(fixedNavGroup); fixedNavGroup = null; }
        if (navColumnAnimGroup) { scene.remove(navColumnAnimGroup); _disposeTree(navColumnAnimGroup); navColumnAnimGroup = null; navColumnAnimData = null; }

        currentPageGroup = _buildPageGroup(layout, currentChapter, currentPage, null, nodes);
        scene.add(currentPageGroup);
        fixedNavGroup = _buildFixedNavGroup(layout);
        scene.add(fixedNavGroup);
        if (layout.sectionRanges && layout.sectionRanges.length > 1) {
            navColumnAnimGroup = _buildNavColumnAnimGroup(layout);
            if (navColumnAnimGroup) scene.add(navColumnAnimGroup);
        }
        /* Scroll-up landing: jump to end of page instead of top */
        if (landAtEnd) {
            const maxPan = Math.max(0, layout.totalContentHeight - H);
            panY = maxPan;
        } else {
            panY = 0;
        }
        _applyPan(); _updateInfo(); _updateLandingBanners(); needsRender = true;
    }).catch(err => console.error('[CDS] renderCurrentPage FAILED:', err));
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════ */
function showPage(ch, pg) { currentChapter = ch; currentPage = pg; if (renderer) renderCurrentPage(); }
function freeze() { isFrozen = true; }
function unfreeze() { isFrozen = false; }

function transitionTo(ch, pg) {
    if (isAnimating) return;
    if (ch === currentChapter && pg === currentPage) return;
    let axis, direction;
    if (ch !== currentChapter) { axis = 'x'; direction = ch > currentChapter ? 1 : -1; }
    else { axis = 'y'; direction = pg > currentPage ? 1 : -1; }
    _performTransition(axis, direction, ch, pg);
}

/* ═══════════════════════════════════════════════════════════════
   TRANSITIONS — NON-BLOCKING (no aspect preload in animation path)
   ═══════════════════════════════════════════════════════════════ */
function _animateCoupledTransition(container, axis, direction, inGroup, outGroup, slideDistance, inLocalPos, SQ) {
    return new Promise(resolve => {
        const t0 = performance.now();
        let duration = ANIM.duration;
        if (axis === 'x') { const distX = W - SQ, distY = H - SQ; if (distY > 0) duration = ANIM.duration * Math.sqrt(distX / distY); }
        const peak = ANIM.stretchPeak, p1End = ANIM.phase1End, retreat = ANIM.phase1Retreat;
        const totalSlide = slideDistance;
        const inScaleOrig = { x: inGroup.scale.x, y: inGroup.scale.y };
        const dim = axis, pageExtent = axis === 'x' ? W : -H;
        const anchorFar = (direction === -1), gapDir = -Math.sign(inLocalPos);

        function frame(now) {
            const raw = Math.min((now - t0) / duration, 1);
            const t = ANIM.easing(raw);
            if (t < p1End) {
                const p1 = t / p1End;
                container.position[axis] = lerp(0, totalSlide * retreat, p1);
                const stretch = 1 + (peak - 1) * p1;
                inGroup.scale[dim] = inScaleOrig[dim] * stretch;
                inGroup.position[dim] = inLocalPos + (anchorFar ? -pageExtent * (stretch - 1) : 0) + gapDir * SQ * (stretch - 1);
            } else {
                const p2 = (t - p1End) / (1 - p1End);
                container.position[axis] = lerp(totalSlide * retreat, totalSlide, p2);
                const stretch2 = lerp(peak, 1, p2);
                inGroup.scale[dim] = inScaleOrig[dim] * stretch2;
                inGroup.position[dim] = inLocalPos + (anchorFar ? -pageExtent * (stretch2 - 1) : 0) + gapDir * SQ * (stretch2 - 1);
            }
            needsRender = true;
            if (raw < 1) requestAnimationFrame(frame);
            else { container.position[axis] = totalSlide; inGroup.scale.set(inScaleOrig.x, inScaleOrig.y, 1); inGroup.position[dim] = inLocalPos; resolve(); }
        }
        requestAnimationFrame(frame);
    });
}

function _performTransition(axis, direction, newChapter, newPage) {
    isAnimating = true; needsRender = true;
    if (_landingEl) _landingEl.style.display = 'none';
    if (fixedNavGroup) { scene.remove(fixedNavGroup); _disposeTree(fixedNavGroup); fixedNavGroup = null; }
    if (navColumnAnimGroup) { scene.remove(navColumnAnimGroup); _disposeTree(navColumnAnimGroup); navColumnAnimGroup = null; navColumnAnimData = null; }

    const newNodes = getMainNodesForPage(newChapter, newPage);
    const newSectionDefs = getPageSections(newChapter, newPage);

    /* Build layout with DEFAULT aspects — NO blocking preload! */
    const newCfg = _buildPageConfig(newNodes, null, newSectionDefs);
    const inLayout = computeLayout(newCfg, W, H);
    const SQ = inLayout.SQ;

    const skip = axis === 'x'
        ? (direction === 1 ? { left: true } : { right: true })
        : (direction === 1 ? { top: true } : { bottom: true });
    const inGroup = _buildPageGroup(inLayout, newChapter, newPage, skip, newNodes);
    const outGroup = currentPageGroup;
    const container = new THREE.Group(); container.name = 'transitionContainer';
    scene.remove(outGroup); outGroup.position.set(0, 0, 0);
    container.add(outGroup);
    const viewSize = axis === 'x' ? W : H;
    const dockOffset = viewSize - SQ;
    const inLocalPos = axis === 'x' ? direction * dockOffset : -direction * dockOffset;
    if (axis === 'x') inGroup.position.set(inLocalPos, 0, 0); else inGroup.position.set(0, inLocalPos, 0);
    container.add(inGroup); scene.add(container);
    const totalSlide = axis === 'x' ? -direction * dockOffset : direction * dockOffset;

    _animateCoupledTransition(container, axis, direction, inGroup, outGroup, totalSlide, inLocalPos, SQ)
        .then(() => {
            setTimeout(() => {
                container.remove(inGroup); container.remove(outGroup);
                scene.remove(container); _disposeTree(outGroup); _disposeTree(inGroup);
                currentChapter = newChapter; currentPage = newPage;
                renderCurrentPage(); isAnimating = false;
                /* Sync nav.js state (labels, navState) after scroll-triggered transitions */
                if (window.NavLayer && NavLayer.syncState) {
                    NavLayer.syncState(newChapter, newPage);
                }
            }, ANIM.resetDelay);
        });
}

function _transitionChapter(direction) {
    if (isAnimating || isFrozen) return;
    const newCh = currentChapter + direction;
    if (newCh < 0 || newCh >= getChapterCount()) { _flashBoundary(); return; }
    /* When scrolling back across chapter boundary, land on last page of previous chapter */
    const newPg = (direction === -1 && _scrollLandAtEnd) ? Math.max(0, getPageCount(newCh) - 1) : 0;
    _performTransition('x', direction, newCh, newPg);
}

function _transitionPage(direction) {
    if (isAnimating || isFrozen) return;
    const ch = LIBRARY[currentChapter];
    const newPg = currentPage + direction;
    if (newPg < 0 || newPg >= ch.pages.length) {
        if (direction === 1 && currentChapter < getChapterCount() - 1) { _transitionChapter(1); return; }
        if (direction === -1 && currentChapter > 0) { _transitionChapter(-1); return; }
        _flashBoundary(); return;
    }
    _performTransition('y', direction, currentChapter, newPg);
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL-TRIGGERED PAGE SWAP — instant CDS, nav-only animation
   ═══════════════════════════════════════════════════════════════ */
function _scrollSwap(direction) {
    if (isAnimating || isFrozen || _scrollSwapping) return;
    if (window.NavLayer && NavLayer.isAnimating && NavLayer.isAnimating()) return;

    const ch = LIBRARY[currentChapter];
    let newCh = currentChapter;
    let newPg = currentPage + direction;
    let axis = 'y';
    let navDir = direction;

    if (newPg < 0) {
        if (currentChapter > 0) {
            newCh = currentChapter - 1;
            newPg = Math.max(0, getPageCount(newCh) - 1);
            axis = 'x'; navDir = -1;
        } else { _flashBoundary(); return; }
    } else if (newPg >= ch.pages.length) {
        if (currentChapter < getChapterCount() - 1) {
            newCh = currentChapter + 1;
            newPg = 0;
            axis = 'x'; navDir = 1;
        } else { _flashBoundary(); return; }
    }

    _scrollSwapping = true;
    overscrollAcc = 0; overscrollDir = 0;
    if (_landingEl) _landingEl.style.display = 'none';

    /* ── Tear down current page ── */
    if (currentPageGroup) { scene.remove(currentPageGroup); _disposeTree(currentPageGroup); }
    if (fixedNavGroup) { scene.remove(fixedNavGroup); _disposeTree(fixedNavGroup); fixedNavGroup = null; }
    if (navColumnAnimGroup) { scene.remove(navColumnAnimGroup); _disposeTree(navColumnAnimGroup); navColumnAnimGroup = null; navColumnAnimData = null; }

    /* ── Build new page synchronously (default aspects, no blocking preload) ── */
    const newNodes = getMainNodesForPage(newCh, newPg);
    const newSectionDefs = getPageSections(newCh, newPg);
    const newCfg = _buildPageConfig(newNodes, null, newSectionDefs);
    const newLayout = computeLayout(newCfg, W, H);

    pageNodes = newNodes;
    currentLayout = newLayout;
    currentChapter = newCh;
    currentPage = newPg;

    currentPageGroup = _buildPageGroup(newLayout, newCh, newPg, null, newNodes);
    scene.add(currentPageGroup);
    fixedNavGroup = _buildFixedNavGroup(newLayout);
    scene.add(fixedNavGroup);
    if (newLayout.sectionRanges && newLayout.sectionRanges.length > 1) {
        navColumnAnimGroup = _buildNavColumnAnimGroup(newLayout);
        if (navColumnAnimGroup) scene.add(navColumnAnimGroup);
    }

    /* Scroll position: backward → bottom of page, forward → top */
    if (direction === -1) {
        panY = Math.max(0, newLayout.totalContentHeight - H);
    } else {
        panY = 0;
    }
    _applyPan(); _updateInfo(); _updateLandingBanners();
    needsRender = true;

    /* ── Trigger nav-only animation (no CDS animation) ── */
    if (window.NavLayer && NavLayer.animateTransition) {
        NavLayer.animateTransition(axis, navDir, newCh, newPg);
    }

    /* Cooldown before next scroll swap */
    setTimeout(() => { _scrollSwapping = false; }, 400);
}

/* ═══════════════════════════════════════════════════════════════
   SCROLLING / PANNING
   ═══════════════════════════════════════════════════════════════ */
function _applyPan() { if (currentPageGroup) currentPageGroup.position.y = panY; _updateNavColumnAnim(); needsRender = true; }
function _clampPan() { let maxPan = 0; if (currentLayout && currentLayout.totalContentHeight) maxPan = Math.max(0, currentLayout.totalContentHeight - H); panY = Math.max(0, Math.min(maxPan, panY)); }
function _handleOverscroll(delta) { if (!delta) return; const dir = delta > 0 ? 1 : -1; if (dir !== overscrollDir) { overscrollAcc = 0; overscrollDir = dir; } overscrollAcc += Math.abs(delta); if (overscrollAcc >= OVERSCROLL_THRESHOLD) { overscrollAcc = 0; overscrollDir = 0; _scrollSwap(dir); } }
function _resetOverscroll() { overscrollAcc = 0; overscrollDir = 0; }

function _setupPanning() {
    document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', e => e.preventDefault(), { passive: false });
    document.addEventListener('wheel', e => {
        e.preventDefault(); if (isAnimating || isFrozen) return;
        const dY = e.deltaY, oldPanY = panY; panY += dY; _clampPan(); _applyPan();
        if (panY === oldPanY && dY !== 0) _handleOverscroll(dY); else _resetOverscroll();
    }, { passive: false });

    const el = renderer.domElement;
    el.addEventListener('mousedown', e => { if (isAnimating || isFrozen) return; isPanning = true; panStartY = e.clientY; panStartPanY = panY; el.style.cursor = 'grabbing'; e.preventDefault(); });
    window.addEventListener('mousemove', e => { if (!isPanning || isAnimating || isFrozen) return; const dy = e.clientY - panStartY; const oldPanY = panY; panY = panStartPanY - dy; _clampPan(); _applyPan(); if (panY === oldPanY && dy !== 0) _handleOverscroll(-dy); else _resetOverscroll(); });
    window.addEventListener('mouseup', () => { isPanning = false; if (el) el.style.cursor = ''; _resetOverscroll(); });

    let touchStartY = 0, touchStartPanY2 = 0;
    el.addEventListener('touchstart', e => { if (isAnimating || isFrozen || e.touches.length !== 1) return; isPanning = true; touchStartY = e.touches[0].clientY; touchStartPanY2 = panY; }, { passive: true });
    el.addEventListener('touchmove', e => { if (!isPanning || isAnimating || isFrozen || e.touches.length !== 1) return; e.preventDefault(); const dy = e.touches[0].clientY - touchStartY; const oldPanY = panY; panY = touchStartPanY2 - dy; _clampPan(); _applyPan(); if (panY === oldPanY && dy !== 0) _handleOverscroll(-dy); else _resetOverscroll(); }, { passive: false });
    el.addEventListener('touchend', () => { isPanning = false; _resetOverscroll(); });
}

/* ═══════════════════════════════════════════════════════════════
   BOUNDARY FLASH / RENDER LOOP / RESIZE / INFO
   ═══════════════════════════════════════════════════════════════ */
function _flashBoundary() { if (!flashEl) return; flashEl.classList.add('active'); setTimeout(() => flashEl.classList.remove('active'), 50); }

function _animate() {
    requestAnimationFrame(_animate);
    if (needsRender && renderer && scene && camera) { renderer.render(scene, camera); needsRender = false; }
}

function _onResize() {
    W = window.innerWidth; H = window.innerHeight;
    if (renderer) renderer.setSize(W, H);
    if (camera) { camera.right = W; camera.bottom = -H; camera.updateProjectionMatrix(); }
    needsRender = true; if (currentLayout) renderCurrentPage();
    _updateLandingBanners();
}

function _updateInfo() {
    const el = document.getElementById('cds-info');
    if (!el) return;
    const ch = LIBRARY[currentChapter];
    const pgCount = ch ? ch.pages.length : 0;
    const glbStatus = (frameReady ? '✅' : '⏳') + 'Frame';
    let secInfo = '';
    if (currentLayout && currentLayout.sectionRanges && currentLayout.sectionRanges.length > 1)
        secInfo = '  |  ' + currentLayout.sectionRanges.length + ' Sections';
    el.textContent = (ch ? ch.name : '?') + ' — Seite ' + (currentPage + 1) + '/' + pgCount +
        '  |  ' + pageNodes.length + ' Mains' + secInfo + '  |  ' + glbStatus;
}

function updateLayerVisibility(key, visible) {
    L[key] = visible; needsRender = true;
    if (!currentPageGroup) return;
    currentPageGroup.children.forEach(g => {
        if (g.name === 'frames') g.visible = !!L.frames3d;
        if (g.name === 'images') g.visible = !!L.images;
        if (g.name === 'netz') g.visible = !!L.netz3d;
        if (g.name === 'pets') g.visible = !!L.pets;
        if (g.name === 'outlines-content') g.visible = !!L.outlines_content;
        if (g.name === 'outlines-nav') g.visible = !!L.outlines_nav;
    });
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE ANIMATED STRIPES (chapter 0, page 0 only)
   ═══════════════════════════════════════════════════════════════ */
function _updateLandingBanners() {
    if (!_landingEl) return;
    if (currentChapter === 0 && currentPage === 0 && !isAnimating) {
        _landingEl.style.display = 'block';
        _fitLandingBanners();
    } else {
        _landingEl.style.display = 'none';
    }
}

function _fitLandingBanners() {
    const SQ = Math.min(W, H) / 4;

    /* ── Horizontal banner (top strip, full width, height = SQ) ── */
    const bh = document.getElementById('landing-h');
    const th = document.getElementById('landing-txt-h');
    const htDiv = bh.querySelector('.landing-h-text');
    bh.style.height = SQ + 'px';
    htDiv.style.left = SQ + 'px';
    htDiv.style.right = SQ + 'px';
    htDiv.style.width = '';
    th.style.transform = 'none';
    th.style.fontSize = SQ + 'px';

    /* ── Vertical banner (left strip, width = SQ, full height) ── */
    const bv = document.getElementById('landing-v');
    const tv = document.getElementById('landing-txt-v');
    bv.style.width = SQ + 'px';
    bv.style.height = '100%';
    tv.style.fontSize = SQ + 'px';
    tv.style.transform = 'none';
    tv.style.left = '0px';
    tv.style.top = '0px';

    const midH = H - 2 * SQ;
    const midCY = SQ + midH / 2;

    requestAnimationFrame(() => {
        /* Horizontal: scaleX text to fill area between corners */
        const twH = th.scrollWidth;
        const areaW = W - 2 * SQ;
        if (twH > 0) th.style.transform = 'scaleX(' + (areaW / twH) + ')';

        /* Vertical: rotate 90° and scaleX to fill middle section */
        const twV = tv.scrollWidth;
        const sx = midH / twV;
        tv.style.left = (SQ / 2 - twV / 2) + 'px';
        tv.style.top  = (midCY - SQ / 2) + 'px';
        tv.style.transform = 'rotate(90deg) scaleX(' + (twV > 0 ? sx : 1) + ')';
    });
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT ContentLayer on window
   ═══════════════════════════════════════════════════════════════ */
window.ContentLayer = {
    showPage(ch, pg) {
        if (!renderer) { const _ch = ch, _pg = pg; const _wait = setInterval(() => { if (renderer) { clearInterval(_wait); showPage(_ch, _pg); } }, 100); return; }
        showPage(ch, pg);
    },
    transitionTo(ch, pg) { if (!renderer) return; transitionTo(ch, pg); },
    freeze, unfreeze, updateLayerVisibility,
    getState() { return { chapter: currentChapter, page: currentPage, isAnimating }; }
};

/* ═══════════════════════════════════════════════════════════════
   BOOTSTRAP
   ═══════════════════════════════════════════════════════════════ */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
