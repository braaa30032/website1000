/* ═══════════════════════════════════════════════════════════════
   CONTENT DISPLAY SYSTEM (CDS)  — Three.js WebGL Engine
   Ported from scroll-demo.html, wired to real LIBRARY data.
   
   Exposes: window.ContentLayer = { showPage, freeze, unfreeze }
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ── Constants ── */
var MAIN_COLOR   = '#F1C40F';
var SUB_COLOR    = '#76D7EA';
var PET_COLOR    = '#0044FF';
var NETZ_COLOR   = '#D8D8D8';
var NETZ_STROKE  = '#888888';
var PET_Z        = 7;

var OVERSCROLL_THRESHOLD = 150;

/* ── Three.js imports (via importmap) ── */
/* We load Three as a global from the import map via a tiny module loader
   since this file is a classic script. The actual Three namespace is
   made available by content3d-boot.js (a tiny module that does
   `import * as THREE from 'three'; window.THREE = THREE;`).
   
   For now we use a polling approach until THREE is available. */

/* ── DOM refs ── */
var flashEl = document.getElementById('flash');

/* ── State ── */
var W, H, dpr;
var renderer, scene, camera;
var currentPageGroup = null;
var currentLayout    = null;
var currentChapter   = 0;
var currentPage      = 0;
var isAnimating      = false;
var isFrozen         = false;

/* Scroll state */
var panY = 0, isPanning = false;
var panStartY = 0, panStartPanY = 0;
var overscrollAcc = 0, overscrollDir = 0;

/* Fixed nav & squeeze animation state */
var fixedNavGroup = null;
var navColumnAnimGroup = null;
var navColumnAnimData = null;

/* GLB state — lazy loaded only when a render3d element is encountered */
var frameTemplate = null, frameBBox = null, frameNativeSize = null, innerFrameSize = null;
var frameReady = false;
var _glbRequested = false;  /* true once we start loading GLBs */

/* Layer visibility (synced with control panel) */
var L = {
    frames3d: true, images: true,
    netz3d: true, pets: true,
    outlines_content: true, outlines_nav: true
};

/* Cached page data from LIBRARY for current page */
var pageNodes = [];  // result from getMainNodesForPage

/* ═══════════════════════════════════════════════════════════════
   INIT — called once THREE is available
   ═══════════════════════════════════════════════════════════════ */
function init() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = window.devicePixelRatio || 1;

    /* Renderer */
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false });
    renderer.setPixelRatio(Math.min(dpr, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:auto;';
    renderer.domElement.id = 'cds-canvas';

    var container = document.getElementById('content-layer');
    container.appendChild(renderer.domElement);

    /* Scene */
    scene = new THREE.Scene();

    /* Camera: ortho, pixel-matched, top-left origin, Y-down */
    camera = new THREE.OrthographicCamera(0, W, 0, -H, 0.1, 4000);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);

    /* Lighting (minimal for 2D default; 3D elements use envmap on demand) */
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    var dl = new THREE.DirectionalLight(0xffffff, 0.4);
    dl.position.set(200, -200, 600);
    scene.add(dl);

    /* GLBs loaded lazily — only when a render3d element is encountered */

    /* Panning / scrolling */
    _setupPanning();

    /* Render loop */
    _animate();

    /* Resize */
    window.addEventListener('resize', _onResize);

    /* First render — wait a frame for layout.js to be ready */
    requestAnimationFrame(function () {
        showPage(0, 0);
    });
}

/* ═══════════════════════════════════════════════════════════════
   ENV MAP
   ═══════════════════════════════════════════════════════════════ */
function _createEnvMap() {
    var size = 256;
    var data = new Float32Array(size * size * 4);
    for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
            var i = (y * size + x) * 4;
            var t = y / size;
            data[i]     = 0.85 + 0.15 * t;
            data[i + 1] = 0.85 + 0.15 * t;
            data[i + 2] = 0.9 + 0.1 * t;
            data[i + 3] = 1.0;
        }
    }
    var tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.needsUpdate = true;
    return tex;
}

/* ═══════════════════════════════════════════════════════════════
   GLB LOADING — lazy, only triggered when render3d element found
   ═══════════════════════════════════════════════════════════════ */
function _ensureGLBs() {
    if (_glbRequested) return;
    _glbRequested = true;
    /* Create envmap for 3D materials */
    if (!scene.environment) scene.environment = _createEnvMap();
    _loadFrameGLB();
}

function _loadFrameGLB() {
    import('three/addons/loaders/GLTFLoader.js').then(function(mod) {
        var loader = new mod.GLTFLoader();
        _doLoadFrame(loader);
    });
}

function _doLoadFrame(loader) {
    loader.load('content/assets/rahmen.glb', function(gltf) {
        frameTemplate = gltf.scene;
        frameTemplate.rotation.x = Math.PI / 2;
        frameTemplate.updateMatrixWorld(true);
        frameBBox       = new THREE.Box3().setFromObject(frameTemplate);
        frameNativeSize = frameBBox.getSize(new THREE.Vector3());
        innerFrameSize  = new THREE.Vector3(frameNativeSize.x / 3, frameNativeSize.y / 3, frameNativeSize.z);
        frameReady = true;
        _rerenderIfReady();
    }, undefined, function(err) {
        console.warn('[CDS] Frame load failed:', err);
    });
}

function _rerenderIfReady() {
    if (currentLayout) renderCurrentPage();
}

/* ═══════════════════════════════════════════════════════════════
   CLONE / COLORIZE / DISPOSE HELPERS
   ═══════════════════════════════════════════════════════════════ */
function _cloneScene(source) {
    var clone = source.clone(true);
    clone.traverse(function(child) {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
        }
    });
    return clone;
}

function _colorize(obj, hex) {
    var c = new THREE.Color(hex);
    obj.traverse(function(child) {
        if (child.isMesh && child.material) child.material.color.copy(c);
    });
}

function _disposeTree(obj) {
    obj.traverse(function(child) {
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function(m) {
                    if (m.map) m.map.dispose();
                    if (m.normalMap) m.normalMap.dispose();
                    if (m.roughnessMap) m.roughnessMap.dispose();
                    if (m.metalnessMap) m.metalnessMap.dispose();
                    if (m.envMap) m.envMap.dispose();
                    m.dispose();
                });
            }
        }
    });
}

function _clearGroup(group) {
    if (!group) return;
    while (group.children.length > 0) {
        var child = group.children[0];
        group.remove(child);
        _disposeTree(child);
    }
}

/* ═══════════════════════════════════════════════════════════════
   3D BUILDERS
   ═══════════════════════════════════════════════════════════════ */

function _createFrame3d(rect, color, parentGroup) {
    if (!frameTemplate || !frameBBox) return;
    var model = _cloneScene(frameTemplate);
    var center = frameBBox.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -center.y, -center.z);
    var group = new THREE.Group();
    group.add(model);
    var sx = rect.w / frameNativeSize.x;
    var sy = rect.h / frameNativeSize.y;
    var sz = Math.max(sx, sy) * 0.5;
    group.scale.set(sx, sy, sz);
    group.position.set(rect.x + rect.w / 2, -(rect.y + rect.h / 2), 2);
    _colorize(group, color);
    parentGroup.add(group);
}

function _createNetzQuad3d(nq, parentGroup) {
    if (nq.type === 'rect') {
        var geo = new THREE.PlaneGeometry(nq.w, nq.h);
        var mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(NETZ_COLOR), side: THREE.DoubleSide,
            transparent: true, opacity: 0.85
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(nq.x + nq.w/2, -(nq.y + nq.h/2), -5);
        parentGroup.add(mesh);
        /* Edges slightly in front of fill to prevent z-fighting */
        var edges = new THREE.EdgesGeometry(geo);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: NETZ_STROKE }));
        line.position.set(nq.x + nq.w/2, -(nq.y + nq.h/2), -4.8);
        parentGroup.add(line);
    } else if (nq.pts) {
        var shape = new THREE.Shape();
        shape.moveTo(nq.pts[0][0], -nq.pts[0][1]);
        for (var i = 1; i < nq.pts.length; i++) shape.lineTo(nq.pts[i][0], -nq.pts[i][1]);
        var geoP = new THREE.ShapeGeometry(shape);
        var matP = new THREE.MeshBasicMaterial({
            color: new THREE.Color(NETZ_COLOR), side: THREE.DoubleSide,
            transparent: true, opacity: 0.85
        });
        var meshP = new THREE.Mesh(geoP, matP);
        meshP.position.z = -5;
        parentGroup.add(meshP);
    }
}

function _createWireRect(rect, color, parentGroup, z) {
    var hw = rect.w / 2, hh = rect.h / 2;
    var cx = rect.x + hw, cy = rect.y + hh;
    var pts = [
        new THREE.Vector3(-hw, hh, 0), new THREE.Vector3(hw, hh, 0),
        new THREE.Vector3(hw, -hh, 0), new THREE.Vector3(-hw, -hh, 0),
        new THREE.Vector3(-hw, hh, 0),
    ];
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color) });
    var line = new THREE.Line(geo, mat);
    line.position.set(cx, -cy, z || 6);
    parentGroup.add(line);

    var planeGeo = new THREE.PlaneGeometry(rect.w, rect.h);
    var planeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color), side: THREE.DoubleSide,
        transparent: true, opacity: 0.15
    });
    var plane = new THREE.Mesh(planeGeo, planeMat);
    plane.position.set(cx, -cy, (z || 6) - 0.1);
    parentGroup.add(plane);
}

function _createWirePoly(pts, color, parentGroup, z) {
    var verts = pts.map(function(p) { return new THREE.Vector3(p[0], -p[1], z || 6); });
    verts.push(verts[0].clone());
    var geo = new THREE.BufferGeometry().setFromPoints(verts);
    var mat = new THREE.LineBasicMaterial({ color: new THREE.Color(color) });
    parentGroup.add(new THREE.Line(geo, mat));

    var shape = new THREE.Shape();
    shape.moveTo(pts[0][0], -pts[0][1]);
    for (var i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
    var sg = new THREE.ShapeGeometry(shape);
    var sm = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color), side: THREE.DoubleSide,
        transparent: true, opacity: 0.15
    });
    var m = new THREE.Mesh(sg, sm);
    m.position.z = (z || 6) - 0.1;
    parentGroup.add(m);
}

/* ═══════════════════════════════════════════════════════════════
   FIXED NAV GROUP — opaque covers at z=8 to mask scrolling netz.
   Nav quad visuals (background, wireframe, text) are rendered by nav.js.
   ═══════════════════════════════════════════════════════════════ */
function _buildFixedNavGroup(layout, chIdx, skipNav) {
    skipNav = skipNav || {};
    var group = new THREE.Group();
    group.name = 'fixedNav';

    var navEntries = [
        { key: 'TL', rect: layout.navTL, skip: skipNav.left  || skipNav.top },
        { key: 'TR', rect: layout.navTR, skip: skipNav.right || skipNav.top },
        { key: 'BL', rect: layout.navBL, skip: skipNav.left  || skipNav.bottom },
        { key: 'BR', rect: layout.navBR, skip: skipNav.right || skipNav.bottom },
    ];

    navEntries.forEach(function(e) {
        if (e.skip) return;
        var rect = e.rect;
        /* Opaque cover at z=8 to mask scrolling netz underneath nav quads */
        var geo = new THREE.PlaneGeometry(rect.w, rect.h);
        var mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color('#D5D5D5'),
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(rect.x + rect.w/2, -(rect.y + rect.h/2), 8);
        group.add(mesh);
    });

    return group;
}

/* ═══════════════════════════════════════════════════════════════
   NAV COLUMN SQUEEZE ANIMATION
   Vertical netz strips in nav columns get squeeze/stretch during scroll.
   Phase 1: Strip 0 compresses, strip 1 stretches from below.
   Phase 2: Strip 0 slides out behind top nav quad.
   Phase 3: Strip 1 fills entire slot.
   ═══════════════════════════════════════════════════════════════ */
function _buildNavColumnAnimGroup(layout) {
    if (!layout.sectionRanges || layout.sectionRanges.length < 2) return null;

    var group = new THREE.Group();
    group.name = 'navColumnAnim';

    var SQ = layout.SQ;
    var innerH = H - 2 * SQ;
    var stripW = SQ;

    /* Background covers — solid #D5D5D5 at z=7 to mask scrolling netz in nav columns */
    var bgColor = new THREE.Color('#D5D5D5');
    var bgL = new THREE.Mesh(
        new THREE.PlaneGeometry(SQ, innerH),
        new THREE.MeshBasicMaterial({ color: bgColor, side: THREE.DoubleSide })
    );
    bgL.position.set(SQ / 2, -(SQ + innerH / 2), 7);
    group.add(bgL);

    var bgR = new THREE.Mesh(
        new THREE.PlaneGeometry(SQ, innerH),
        new THREE.MeshBasicMaterial({ color: bgColor, side: THREE.DoubleSide })
    );
    bgR.position.set(W - SQ / 2, -(SQ + innerH / 2), 7);
    group.add(bgR);

    /* Create a strip mesh (netz fill + outline edges) */
    function makeStrip(name) {
        var g = new THREE.Group();
        g.name = name;
        var geo = new THREE.PlaneGeometry(stripW, innerH);
        var mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(NETZ_COLOR),
            side: THREE.DoubleSide, transparent: true, opacity: 0.7
        });
        g.add(new THREE.Mesh(geo, mat));
        var edges = new THREE.EdgesGeometry(geo);
        g.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#999999' })));
        return g;
    }

    var strip0L = makeStrip('s0L');
    var strip0R = makeStrip('s0R');
    var strip1L = makeStrip('s1L');
    var strip1R = makeStrip('s1R');
    group.add(strip0L, strip0R, strip1L, strip1R);

    navColumnAnimData = { strip0L: strip0L, strip0R: strip0R, strip1L: strip1L, strip1R: strip1R, bgL: bgL, bgR: bgR, SQ: SQ, innerH: innerH };
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
    var d = navColumnAnimData;
    var slotTop = d.SQ;
    var slotBot = H - d.SQ;
    var innerH = d.innerH;
    var cxL = d.SQ / 2;
    var cxR = W - d.SQ / 2;

    /* Gap in content-space: [H - SQ, H]. In viewport: [H-SQ-panY, H-panY]. */
    var gapTopV = H - d.SQ - panY;
    var gapBotV = H - panY;

    /* Transition active when gap overlaps the slot */
    var transActive = panY > 0 && gapBotV > slotTop;

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

    /* Strip 0's available space in the slot (above the gap) */
    var strip0Space = Math.max(0, gapTopV - slotTop);
    var strip0Ratio = strip0Space / innerH;

    var s0top, s0h, s1top, s1h;

    if (strip0Ratio > 0.1) {
        /* Phase 1: strip 0 compresses, anchored at slotTop */
        s0top = slotTop;
        s0h   = strip0Space;
        s1top = slotTop + strip0Space;
        s1h   = slotBot - s1top;
    } else if (strip0Space > 0) {
        /* Phase 2: strip 0 frozen at 10%, slides behind top nav quad */
        var tenP   = innerH * 0.1;
        var slideT = 1 - (strip0Space / (innerH * 0.1));
        s0h   = tenP;
        s0top = slotTop - tenP * slideT;
        s1top = Math.max(slotTop, s0top + s0h);
        s1h   = slotBot - s1top;
    } else {
        /* Phase 3: strip 0 gone, strip 1 fills slot */
        s0h   = 0;
        s0top = slotTop;
        s1top = slotTop;
        s1h   = innerH;
    }

    _positionStrip(d.strip0L, cxL, s0top, s0h, innerH, true);
    _positionStrip(d.strip0R, cxR, s0top, s0h, innerH, true);
    _positionStrip(d.strip1L, cxL, s1top, s1h, innerH, true);
    _positionStrip(d.strip1R, cxR, s1top, s1h, innerH, true);
}

/* ═══════════════════════════════════════════════════════════════
   REAL MEDIA: Image / Video / Text as Three.js planes
   
   2D mode (default): content fills 100% of rect, cover-fit (crop)
   3D mode (render3d: true): content is 1/3 of rect, contain-fit
   ═══════════════════════════════════════════════════════════════ */
function _createMediaPlane(rect, nodeData, parentGroup, is3d) {
    if (!nodeData) return;

    var cx = rect.x + rect.w / 2;
    var cy = rect.y + rect.h / 2;

    /* 2D: full rect. 3D: 1/3 box (inside GLB frame) */
    var boxW = is3d ? rect.w / 3 : rect.w;
    var boxH = is3d ? rect.h / 3 : rect.h;
    var mediaZ = is3d ? 1 : 3;  /* 2D media in front of wireframes */

    if (nodeData.type === 'image' && (nodeData.image || nodeData.url)) {
        var url = nodeData.image || nodeData.url;
        var texLoader = new THREE.TextureLoader();
        texLoader.setCrossOrigin('anonymous');

        if (boxW < 2 || boxH < 2) return;
        var planeGeo = new THREE.PlaneGeometry(boxW, boxH);
        var planeMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(nodeData.color || '#888'),
            side: THREE.DoubleSide, transparent: true, opacity: 0.3
        });
        var planeMesh = new THREE.Mesh(planeGeo, planeMat);
        planeMesh.position.set(cx, -cy, mediaZ);
        parentGroup.add(planeMesh);

        texLoader.load(url, function(tex) {
            tex.colorSpace = THREE.SRGBColorSpace;
            var iw = tex.image ? tex.image.width  : 1;
            var ih = tex.image ? tex.image.height : 1;
            var imgAspect = (iw || 1) / (ih || 1);
            var boxAspect = boxW / boxH;
            var fw, fh;

            if (is3d) {
                /* Contain-fit: image fits inside box, no crop */
                if (imgAspect > boxAspect) { fw = boxW; fh = boxW / imgAspect; }
                else { fh = boxH; fw = boxH * imgAspect; }
            } else {
                /* Cover-fit: image covers entire box, crop overflow */
                if (imgAspect > boxAspect) { fh = boxH; fw = boxH * imgAspect; }
                else { fw = boxW; fh = boxW / imgAspect; }
                /* UV crop to visible area */
                var uvW = boxW / fw, uvH = boxH / fh;
                var uvX = (1 - uvW) / 2, uvY = (1 - uvH) / 2;
                tex.offset.set(uvX, uvY);
                tex.repeat.set(uvW, uvH);
                fw = boxW; fh = boxH;
            }

            planeMesh.geometry.dispose();
            planeMesh.geometry = new THREE.PlaneGeometry(fw, fh);
            planeMat.map = tex;
            planeMat.color.set(0xffffff);
            planeMat.opacity = 1.0;
            planeMat.needsUpdate = true;
        }, undefined, function(err) {
            console.warn('[CDS] ❌ FAILED ' + url.split('/').pop(), err);
            planeMat.opacity = 0.5;
        });
    } else if (nodeData.type === 'video' && (nodeData.video || nodeData.url)) {
        var vUrl = nodeData.video || nodeData.url;
        var video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = vUrl;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.play().catch(function() {});

        var vTex = new THREE.VideoTexture(video);
        vTex.colorSpace = THREE.SRGBColorSpace;
        var vGeo = new THREE.PlaneGeometry(boxW, boxH);
        var vMat = new THREE.MeshBasicMaterial({ map: vTex, side: THREE.DoubleSide });
        var vMesh = new THREE.Mesh(vGeo, vMat);
        vMesh.position.set(cx, -cy, mediaZ);
        parentGroup.add(vMesh);
        video.addEventListener('loadedmetadata', function() {
            var vw = video.videoWidth || 1;
            var vh = video.videoHeight || 1;
            var va = vw / vh;
            var ba = boxW / boxH;
            var fw, fh;
            if (is3d) {
                if (va > ba) { fw = boxW; fh = boxW / va; } else { fh = boxH; fw = boxH * va; }
            } else {
                if (va > ba) { fh = boxH; fw = boxH * va; } else { fw = boxW; fh = boxW / va; }
                var uvW = boxW / fw, uvH = boxH / fh;
                vTex.offset.set((1 - uvW) / 2, (1 - uvH) / 2);
                vTex.repeat.set(uvW, uvH);
                fw = boxW; fh = boxH;
            }
            vMesh.geometry.dispose();
            vMesh.geometry = new THREE.PlaneGeometry(fw, fh);
        });
    } else if (nodeData.type === 'text') {
        _createTextPlane(rect, nodeData, parentGroup, mediaZ);
    }
}

/* ═══════════════════════════════════════════════════════════════
   FILL-BOX TEXT — each line fills container width independently.
   Words split on spaces/hyphens (hyphens become own words).
   Different lines get different font sizes based on content.
   Lines alternate left/right alignment to trace container edges.
   ═══════════════════════════════════════════════════════════════ */

/* Split text: spaces separate, hyphens separate AND become own words */
function _splitFillBoxWords(text) {
    var clean = text.replace(/<[^>]*>/g, '');
    var tokens = [];
    var buf = '';
    for (var i = 0; i < clean.length; i++) {
        var ch = clean[i];
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
            if (buf) { tokens.push(buf); buf = ''; }
        } else if (ch === '-' || ch === '\u2010' || ch === '\u2011') {
            if (buf) { tokens.push(buf); buf = ''; }
            tokens.push('-');
        } else {
            buf += ch;
        }
    }
    if (buf) tokens.push(buf);
    return tokens;
}

/* Distribute words into numLines lines, balanced by visual width */
function _distributeToLines(ctx, words, numLines) {
    if (numLines >= words.length) return words.map(function(w) { return [w]; });
    if (numLines <= 1) return [words.slice()];
    ctx.font = '100px sans-serif';
    var widths = words.map(function(w) { return ctx.measureText(w).width; });
    var totalW = widths.reduce(function(a, b) { return a + b; }, 0);
    /* Cumulative widths for balanced breakpoint search */
    var cumW = [];
    var sum = 0;
    for (var i = 0; i < widths.length; i++) { sum += widths[i]; cumW.push(sum); }
    var breaks = [];
    for (var b = 1; b < numLines; b++) {
        var target = totalW * b / numLines;
        var lo = (breaks.length > 0 ? breaks[breaks.length - 1] : 0);
        var hi = words.length - (numLines - b);
        var bestIdx = lo;
        var bestDist = Infinity;
        for (var j = lo; j < hi; j++) {
            var d = Math.abs(cumW[j] - target);
            if (d < bestDist) { bestDist = d; bestIdx = j + 1; }
        }
        if (bestIdx <= lo) bestIdx = lo + 1;
        breaks.push(bestIdx);
    }
    var lines = [];
    var prev = 0;
    for (var k = 0; k < breaks.length; k++) {
        lines.push(words.slice(prev, breaks[k]));
        prev = breaks[k];
    }
    lines.push(words.slice(prev));
    return lines.filter(function(l) { return l.length > 0; });
}

/* Compute fill-box: each line fills the width, variable line heights.
   Returns { lines: [{words, wordWidths, fontSize, lineH, gap}], totalH } */
function _computeFillBox(ctx, words, usableW, usableH) {
    var maxLines = Math.min(words.length, 12);
    var bestTotalH = 0;
    var bestResult = null;
    var ref = 200;
    var LS = 1.08;
    for (var numLines = 1; numLines <= maxLines; numLines++) {
        var dist = _distributeToLines(ctx, words, numLines);
        var totalH = 0;
        var lineData = [];
        var valid = true;
        for (var li = 0; li < dist.length; li++) {
            var lw = dist[li];
            ctx.font = ref + 'px sans-serif';
            var natW = lw.map(function(w) { return ctx.measureText(w).width; });
            var sumNat = natW.reduce(function(a, b) { return a + b; }, 0);
            if (sumNat <= 0) { valid = false; break; }
            var gapCount = lw.length - 1;
            /* Two iterations to stabilise gap vs fontSize */
            var fontSize = ref * usableW / sumNat;
            var gap = gapCount > 0 ? fontSize * 0.06 : 0;
            fontSize = ref * (usableW - gap * gapCount) / sumNat;
            gap = gapCount > 0 ? fontSize * 0.06 : 0;
            fontSize = ref * (usableW - gap * gapCount) / sumNat;
            if (fontSize < 4) { valid = false; break; }
            var lineH = fontSize * LS;
            totalH += lineH;
            ctx.font = Math.round(fontSize) + 'px sans-serif';
            var ww = lw.map(function(w) { return ctx.measureText(w).width; });
            lineData.push({ words: lw, wordWidths: ww, fontSize: fontSize, lineH: lineH, gap: gap });
        }
        if (!valid || totalH > usableH + 1) continue;
        if (totalH > bestTotalH) {
            bestTotalH = totalH;
            bestResult = { lines: lineData, totalH: totalH };
        }
    }
    return bestResult;
}

/* Render fill-box layout into canvas context */
function _renderFillBox(ctx, layout, padX, padY, cvsW, cvsH, hAlign, vAlign) {
    var usH = cvsH - 2 * padY;
    var extraV = usH - layout.totalH;
    var yOff;
    if (vAlign === 'top') yOff = padY;
    else if (vAlign === 'bottom') yOff = padY + extraV;
    else yOff = padY + extraV / 2; /* center / spread */

    ctx.textBaseline = 'top';
    var cumY = 0;
    for (var li = 0; li < layout.lines.length; li++) {
        var line = layout.lines[li];
        var y = yOff + cumY;
        /* Determine horizontal direction for this line */
        var goRight;
        if (hAlign === 'left') goRight = false;
        else if (hAlign === 'right') goRight = true;
        else goRight = (li % 2 !== 0); /* alternate */

        ctx.font = Math.round(line.fontSize) + 'px sans-serif';
        if (goRight) {
            ctx.textAlign = 'right';
            var x = cvsW - padX;
            for (var wi = line.words.length - 1; wi >= 0; wi--) {
                ctx.fillText(line.words[wi], x, y);
                x -= line.wordWidths[wi] + line.gap;
            }
        } else {
            ctx.textAlign = 'left';
            var x = padX;
            for (var wi = 0; wi < line.words.length; wi++) {
                ctx.fillText(line.words[wi], x, y);
                x += line.wordWidths[wi] + line.gap;
            }
        }
        cumY += line.lineH;
    }
}

function _createTextPlane(rect, nodeData, parentGroup, z) {
    var text = nodeData.title || nodeData.text || '';
    if (!text) return;
    var W_RECT = rect.w;
    var H_RECT = rect.h;
    if (W_RECT < 10 || H_RECT < 10) return;

    var sc = 2;
    var cvs = document.createElement('canvas');
    cvs.width  = Math.round(W_RECT * sc);
    cvs.height = Math.round(H_RECT * sc);
    var ctx = cvs.getContext('2d');

    var words = _splitFillBoxWords(text);
    if (words.length === 0) return;

    var PAD = Math.round(cvs.width * 0.04);
    var usW = cvs.width - 2 * PAD;
    var usH = cvs.height - 2 * PAD;
    var layout = _computeFillBox(ctx, words, usW, usH);
    if (!layout) return;

    ctx.fillStyle = nodeData.color || '#222';
    _renderFillBox(ctx, layout, PAD, PAD, cvs.width, cvs.height, 'alternate', 'center');

    var tTex = new THREE.CanvasTexture(cvs);
    var tGeo = new THREE.PlaneGeometry(W_RECT, H_RECT);
    var tMat = new THREE.MeshBasicMaterial({ map: tTex, transparent: true, side: THREE.DoubleSide });
    var tMesh = new THREE.Mesh(tGeo, tMat);
    tMesh.position.set(rect.x + W_RECT / 2, -(rect.y + H_RECT / 2), z || 3);
    parentGroup.add(tMesh);
}

/* ═══════════════════════════════════════════════════════════════
   PAGE GROUP BUILDING (from LIBRARY data)
   ═══════════════════════════════════════════════════════════════ */
function _buildPageGroup(layout, chIdx, pgIdx, skipNav, nodes) {
    skipNav = skipNav || {};
    /* Use explicitly passed nodes — never rely on global pageNodes */
    var _nodes = nodes || pageNodes || [];
    var pg = new THREE.Group();
    pg.name = 'page-ch' + chIdx + '-p' + pgIdx;

    var fg = new THREE.Group(); fg.name = 'frames';   pg.add(fg);
    var ig = new THREE.Group(); ig.name = 'images';   pg.add(ig);
    var ng = new THREE.Group(); ng.name = 'netz';     pg.add(ng);
    var ocg = new THREE.Group(); ocg.name = 'outlines-content'; pg.add(ocg);
    var ong = new THREE.Group(); ong.name = 'outlines-nav';     pg.add(ong);
    var ptg = new THREE.Group(); ptg.name = 'pets';   pg.add(ptg);

    var SQ = layout.SQ;

    /* Nav quad wireframes */
    var navEntries = [
        { key: 'TL', rect: layout.navTL, skip: skipNav.left  || skipNav.top },
        { key: 'TR', rect: layout.navTR, skip: skipNav.right || skipNav.top },
        { key: 'BL', rect: layout.navBL, skip: skipNav.left  || skipNav.bottom },
        { key: 'BR', rect: layout.navBR, skip: skipNav.right || skipNav.bottom },
    ];
    navEntries.forEach(function(e) {
        if (!e.skip) _createWireRect(e.rect, '#E74C3C', ong, 6);
    });

    /* Main wireframes + frames + media */
    var _any3d = false;
    layout.mains.forEach(function(m, mi) {
        var node = _nodes[mi];
        var is3d = node && node.render3d;
        if (is3d) _any3d = true;
        _createWireRect(m, MAIN_COLOR, ocg, 6);
        if (is3d) _createFrame3d(m, node ? (node.color || MAIN_COLOR) : MAIN_COLOR, fg);
        if (node) _createMediaPlane(m, node, ig, is3d);
    });

    /* Sub wireframes + frames + media */
    var subFlatIdx = 0;
    layout.subs.forEach(function(group, gi) {
        group.forEach(function(s, si) {
            _createWireRect(s, SUB_COLOR, ocg, 6);
            var subNode = null;
            if (_nodes[gi] && _nodes[gi].children && _nodes[gi].children[si]) {
                subNode = _nodes[gi].children[si];
            }
            var subIs3d = subNode && subNode.render3d;
            if (subIs3d) { _any3d = true; _createFrame3d(s, subNode.color || SUB_COLOR, fg); }
            if (subNode) _createMediaPlane(s, subNode, ig, subIs3d);
            subFlatIdx++;
        });
    });

    /* Trigger lazy GLB loading if any 3D elements exist */
    if (_any3d) _ensureGLBs();

    /* Pets */
    if (layout.pets) {
        layout.pets.forEach(function(pet) {
            var petData = pet.data;
            var petNode = null;

            /* Find the actual pet data from _nodes (passed explicitly) */
            if (pet.parentType === 'main' && _nodes[pet.parentIndex]) {
                var mainNode = _nodes[pet.parentIndex];
                if (mainNode.pets && mainNode.pets[pet.petIndex]) {
                    petNode = mainNode.pets[pet.petIndex];
                }
            } else if (pet.parentType === 'sub' && _nodes[pet.parentIndex]) {
                var mainN = _nodes[pet.parentIndex];
                if (mainN.children && mainN.children[pet.subIndex]) {
                    var subN = mainN.children[pet.subIndex];
                    if (subN.pets && subN.pets[pet.petIndex]) {
                        petNode = subN.pets[pet.petIndex];
                    }
                }
            }

            var petRect = { x: pet.x - pet.w/2, y: pet.y - pet.h/2, w: pet.w, h: pet.h };

            if (petNode && (petNode.image || petNode.video || petNode.type === 'text')) {
                /* Pet with real content — always 2D unless explicitly render3d */
                var petIs3d = petNode && petNode.render3d;
                if (petIs3d) _any3d = true;
                var petGrp = new THREE.Group();
                petGrp.position.z = PET_Z;
                _createMediaPlane({ x: pet.x - pet.w/2, y: pet.y - pet.h/2, w: pet.w, h: pet.h }, petNode, petGrp, petIs3d);
                /* Offset z of children back since parent already at PET_Z */
                petGrp.traverse(function(ch) { if (ch.position && ch !== petGrp) ch.position.z = 0; });
                ptg.add(petGrp);
            } else {
                /* Colored placeholder */
                var geoP = new THREE.PlaneGeometry(pet.w, pet.h);
                var matP = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(petNode ? petNode.color : PET_COLOR),
                    side: THREE.DoubleSide, transparent: true, opacity: 0.85
                });
                var meshP = new THREE.Mesh(geoP, matP);
                meshP.position.set(pet.x, -pet.y, PET_Z);
                ptg.add(meshP);
            }

            /* Pet outline */
            var edgesGeo = new THREE.PlaneGeometry(pet.w, pet.h);
            var edgesLine = new THREE.LineSegments(
                new THREE.EdgesGeometry(edgesGeo),
                new THREE.LineBasicMaterial({ color: new THREE.Color(petNode ? petNode.color : PET_COLOR) })
            );
            edgesLine.position.set(pet.x, -pet.y, PET_Z + 0.1);
            ptg.add(edgesLine);
        });
    }

    /* Netz quads — skip those in nav zones when transitioning */
    var netzCount = 0;
    layout.netz.forEach(function(nq) {
        if (_isNetzInSkippedZone(nq, SQ, skipNav, W)) return;
        _createNetzQuad3d(nq, ng);
        netzCount++;
    });

    /* Apply visibility */
    fg.visible  = !!L.frames3d;
    ig.visible  = !!L.images;
    ng.visible  = !!L.netz3d;
    ptg.visible = !!L.pets;
    ocg.visible = !!L.outlines_content;
    ong.visible = !!L.outlines_nav;

    pg.userData.layout     = layout;
    pg.userData.chapterIdx = chIdx;
    pg.userData.pageIdx    = pgIdx;

    return pg;
}

function _isNetzInSkippedZone(nq, SQ, skipNav, viewW) {
    if (!skipNav) return false;
    var cx, cy, cr, cb;
    if (nq.type === 'rect') {
        cx = nq.x; cy = nq.y; cr = nq.x + nq.w; cb = nq.y + nq.h;
    } else if (nq.pts) {
        cx = Infinity; cy = Infinity; cr = -Infinity; cb = -Infinity;
        nq.pts.forEach(function(p) { cx = Math.min(cx, p[0]); cy = Math.min(cy, p[1]); cr = Math.max(cr, p[0]); cb = Math.max(cb, p[1]); });
    } else return false;
    if (skipNav.left   && cr <= SQ + 1)        return true;
    if (skipNav.right  && cx >= viewW - SQ - 1) return true;
    if (skipNav.top    && cb <= SQ + 1)        return true;
    if (skipNav.bottom && cy >= H - SQ - 1)    return true;
    return false;
}

/* ═══════════════════════════════════════════════════════════════
   ASPECT RATIO PRELOADING
   Load image/video natural dimensions BEFORE layout so each
   rect's aspect ratio matches its content.  Results are cached
   so resizes / re-renders are instant.
   ═══════════════════════════════════════════════════════════════ */
var _aspectCache = {};  /* url → w/h ratio */

function _loadAspect(url) {
    if (_aspectCache[url] !== undefined) return Promise.resolve(_aspectCache[url]);
    return new Promise(function(resolve) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            var asp = (img.naturalWidth || 1) / (img.naturalHeight || 1);
            _aspectCache[url] = asp;
            resolve(asp);
        };
        img.onerror = function() {
            _aspectCache[url] = LAYOUT_CONST.MAIN_ASPECT;
            resolve(LAYOUT_CONST.MAIN_ASPECT);
        };
        img.src = url;
    });
}

function _loadVideoAspect(url) {
    if (_aspectCache[url] !== undefined) return Promise.resolve(_aspectCache[url]);
    return new Promise(function(resolve) {
        var v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.preload = 'metadata';
        v.onloadedmetadata = function() {
            var asp = (v.videoWidth || 1) / (v.videoHeight || 1);
            _aspectCache[url] = asp;
            resolve(asp);
            v.src = '';
        };
        v.onerror = function() {
            _aspectCache[url] = LAYOUT_CONST.MAIN_ASPECT;
            resolve(LAYOUT_CONST.MAIN_ASPECT);
            v.src = '';
        };
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

/**
 * Pre-load aspect ratios for every main + sub on a page.
 * Returns Promise<{ mainAspects: number[], subAspects: number[][] }>
 */
function _preloadPageAspects(nodes) {
    var promises = [];
    var structure = [];
    for (var i = 0; i < nodes.length; i++) {
        promises.push(_getNodeAspect(nodes[i], LAYOUT_CONST.MAIN_ASPECT));
        var childCount = (nodes[i].children || []).length;
        structure.push(childCount);
        for (var j = 0; j < childCount; j++) {
            promises.push(_getNodeAspect(nodes[i].children[j], LAYOUT_CONST.SUB_ASPECT));
        }
    }
    return Promise.all(promises).then(function(results) {
        var mainAspects = [];
        var subAspects  = [];
        var idx = 0;
        for (var i = 0; i < nodes.length; i++) {
            mainAspects.push(results[idx++]);
            var childAsp = [];
            for (var j = 0; j < structure[i]; j++) {
                childAsp.push(results[idx++]);
            }
            subAspects.push(childAsp);
        }
        return { mainAspects: mainAspects, subAspects: subAspects };
    });
}

/* ═══════════════════════════════════════════════════════════════
   DATA BRIDGE: LIBRARY → Layout Config
   ═══════════════════════════════════════════════════════════════ */
function _buildPageConfig(nodes, aspects, sectionDefs) {
    var mainCount = nodes.length;
    var subsPerMainArr = [];
    var petsPerMainArr = [];
    var petsPerSubArr  = [];
    var petDataArr     = [];

    for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var nSubs = n.children ? n.children.length : 0;
        subsPerMainArr.push(nSubs);
        petsPerMainArr.push(n.pets ? n.pets.length : 0);

        /* Collect pet data for manual placement */
        if (n.pets) {
            n.pets.forEach(function(p) { petDataArr.push(p); });
        }

        /* Pet counts per sub */
        if (n.children) {
            n.children.forEach(function(ch) {
                petsPerSubArr.push(ch.pets ? ch.pets.length : 0);
            });
        }
    }

    return {
        mainCount:   mainCount,
        subsPerMain: subsPerMainArr,
        petsPerMain: petsPerMainArr,
        petsPerSub:  petsPerSubArr,
        petData:     petDataArr,
        mainAspects: aspects ? aspects.mainAspects : null,
        subAspects:  aspects ? aspects.subAspects  : null,
        sections:    sectionDefs || null
    };
}

/* ═══════════════════════════════════════════════════════════════
   RENDER CURRENT PAGE
   ═══════════════════════════════════════════════════════════════ */
function renderCurrentPage() {
    var nodes = getMainNodesForPage(currentChapter, currentPage);
    pageNodes = nodes;

    var sectionDefs = (typeof getPageSections === 'function')
        ? getPageSections(currentChapter, currentPage) : null;

    _preloadPageAspects(nodes).then(function(aspects) {
        var cfg = _buildPageConfig(nodes, aspects, sectionDefs);
        var layout = computeLayout(cfg, W, H);
        console.log('[CDS] ch=' + currentChapter + ' pg=' + currentPage +
            ' mains=' + layout.mains.length +
            ' sections=' + (layout.sectionRanges ? layout.sectionRanges.length : 0) +
            ' totalH=' + layout.totalContentHeight + ' viewH=' + H);
        currentLayout = layout;

        /* Tear down previous page group */
        if (currentPageGroup) {
            scene.remove(currentPageGroup);
            _disposeTree(currentPageGroup);
        }
        /* Tear down previous fixed nav group */
        if (fixedNavGroup) {
            scene.remove(fixedNavGroup);
            _disposeTree(fixedNavGroup);
            fixedNavGroup = null;
        }
        /* Tear down previous nav column anim group */
        if (navColumnAnimGroup) {
            scene.remove(navColumnAnimGroup);
            _disposeTree(navColumnAnimGroup);
            navColumnAnimGroup = null;
            navColumnAnimData = null;
        }

        /* Build scrolling content group */
        currentPageGroup = _buildPageGroup(layout, currentChapter, currentPage, null, nodes);
        scene.add(currentPageGroup);

        /* Build fixed nav group (stays in place during scroll) */
        fixedNavGroup = _buildFixedNavGroup(layout, currentChapter);
        scene.add(fixedNavGroup);

        /* Build nav column squeeze animation (multi-section pages only) */
        if (layout.sectionRanges && layout.sectionRanges.length > 1) {
            navColumnAnimGroup = _buildNavColumnAnimGroup(layout);
            if (navColumnAnimGroup) scene.add(navColumnAnimGroup);
        }

        panY = 0;
        _applyPan();
        _updateInfo();
    }).catch(function(err) {
        console.error('[CDS] renderCurrentPage FAILED:', err);
    });
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC API — ContentLayer
   ═══════════════════════════════════════════════════════════════ */
function showPage(ch, pg) {
    currentChapter = ch;
    currentPage = pg;
    if (renderer) renderCurrentPage();
}

function freeze() {
    isFrozen = true;
}

function unfreeze() {
    isFrozen = false;
}

/**
 * transitionTo — called by nav.js to trigger a CDS transition
 * in PARALLEL with the nav letter animation.
 * Computes axis/direction from current → target and calls _performTransition.
 */
function transitionTo(ch, pg) {
    if (isAnimating) return;
    if (ch === currentChapter && pg === currentPage) return;
    var axis, direction;
    if (ch !== currentChapter) {
        axis = 'x';
        direction = ch > currentChapter ? 1 : -1;
    } else {
        axis = 'y';
        direction = pg > currentPage ? 1 : -1;
    }
    _performTransition(axis, direction, ch, pg);
}

/* ═══════════════════════════════════════════════════════════════
   TRANSITIONS (two-phase stretch animation from demo)
   ═══════════════════════════════════════════════════════════════ */
function _lerp(a, b, t) { return a + (b - a) * t; }

/* ANIM config — same as nav.js shared config */
var ANIM = {
    duration:      900,
    resetDelay:    200,
    easing:        function(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2; },
    stretchPeak:   2.2,
    phase1End:     0.35,
    phase1Retreat: 0.3
};

function _animateCoupledTransition(container, axis, direction, inGroup, outGroup, slideDistance, inLocalPos, SQ) {
    return new Promise(function(resolve) {
        var t0 = performance.now();
        /* X-axis: sqrt-scaled duration to match nav.js animateX timing */
        var baseDuration = ANIM.duration;
        var duration = baseDuration;
        if (axis === 'x') {
            var distX = W - SQ;  /* ~same as nav defaults.next.x - defaults.main.x */
            var distY = H - SQ;  /* ~same as nav defaults.top.y - defaults.bottom.y */
            if (distY > 0) duration = baseDuration * Math.sqrt(distX / distY);
        }
        var peak     = ANIM.stretchPeak;
        var p1End    = ANIM.phase1End;
        var retreat  = ANIM.phase1Retreat;
        var totalSlide = slideDistance;
        var inScaleOrig = { x: inGroup.scale.x, y: inGroup.scale.y };
        var dim = axis;
        var pageExtent = axis === 'x' ? W : -H;
        var anchorFar = (direction === -1);
        var gapDir = -Math.sign(inLocalPos);

        function frame(now) {
            var raw = Math.min((now - t0) / duration, 1);
            var t = ANIM.easing(raw);

            if (t < p1End) {
                var p1 = t / p1End;
                container.position[axis] = _lerp(0, totalSlide * retreat, p1);
                var stretch = 1 + (peak - 1) * p1;
                inGroup.scale[dim] = inScaleOrig[dim] * stretch;
                var correction = anchorFar ? -pageExtent * (stretch - 1) : 0;
                var gap = gapDir * SQ * (stretch - 1);
                inGroup.position[dim] = inLocalPos + correction + gap;
            } else {
                var p2 = (t - p1End) / (1 - p1End);
                container.position[axis] = _lerp(totalSlide * retreat, totalSlide, p2);
                var stretch2 = _lerp(peak, 1, p2);
                inGroup.scale[dim] = inScaleOrig[dim] * stretch2;
                var correction2 = anchorFar ? -pageExtent * (stretch2 - 1) : 0;
                var gap2 = gapDir * SQ * (stretch2 - 1);
                inGroup.position[dim] = inLocalPos + correction2 + gap2;
            }

            if (raw < 1) requestAnimationFrame(frame);
            else {
                container.position[axis] = totalSlide;
                inGroup.scale.set(inScaleOrig.x, inScaleOrig.y, 1);
                inGroup.position[dim] = inLocalPos;
                resolve();
            }
        }
        requestAnimationFrame(frame);
    });
}

function _performTransition(axis, direction, newChapter, newPage) {
    isAnimating = true;

    /* Remove fixed groups during transition */
    if (fixedNavGroup) { scene.remove(fixedNavGroup); _disposeTree(fixedNavGroup); fixedNavGroup = null; }
    if (navColumnAnimGroup) { scene.remove(navColumnAnimGroup); _disposeTree(navColumnAnimGroup); navColumnAnimGroup = null; navColumnAnimData = null; }

    var newNodes = getMainNodesForPage(newChapter, newPage);
    var newSectionDefs = (typeof getPageSections === 'function')
        ? getPageSections(newChapter, newPage) : null;

    _preloadPageAspects(newNodes).then(function(aspects) {
        var newCfg = _buildPageConfig(newNodes, aspects, newSectionDefs);
        var inLayout = computeLayout(newCfg, W, H);
        var SQ = inLayout.SQ;

        var skip = axis === 'x'
            ? (direction === 1 ? { left: true } : { right: true })
            : (direction === 1 ? { top: true }  : { bottom: true });

        /* Pass newNodes explicitly — no global pageNodes swap needed */
        var inGroup  = _buildPageGroup(inLayout, newChapter, newPage, skip, newNodes);

        var outGroup = currentPageGroup;
        var container = new THREE.Group();
        container.name = 'transitionContainer';

        scene.remove(outGroup);
        outGroup.position.set(0, 0, 0);
        container.add(outGroup);

        var viewSize   = axis === 'x' ? W : H;
        var dockOffset = viewSize - SQ;
        var inLocalPos = axis === 'x' ? direction * dockOffset : -direction * dockOffset;

        if (axis === 'x') inGroup.position.set(inLocalPos, 0, 0);
        else              inGroup.position.set(0, inLocalPos, 0);

        container.add(inGroup);
        scene.add(container);

        var totalSlide = axis === 'x' ? -direction * dockOffset : direction * dockOffset;

        _animateCoupledTransition(container, axis, direction, inGroup, outGroup, totalSlide, inLocalPos, SQ)
            .then(function() {
                setTimeout(function() {
                    container.remove(inGroup);
                    container.remove(outGroup);
                    scene.remove(container);
                    _disposeTree(outGroup);
                    _disposeTree(inGroup);

                    currentChapter = newChapter;
                    currentPage    = newPage;
                    panY = 0;
                    renderCurrentPage();
                    isAnimating = false;
                }, ANIM.resetDelay);
            });
    }).catch(function(err) {
        console.error('[CDS] _performTransition FAILED:', err);
        isAnimating = false;
    });
}

function _transitionChapter(direction) {
    if (isAnimating || isFrozen) return;
    var newCh = currentChapter + direction;
    if (newCh < 0 || newCh >= getChapterCount()) { _flashBoundary(); return; }
    var newPg = 0;
    _performTransition('x', direction, newCh, newPg);
}

function _transitionPage(direction) {
    if (isAnimating || isFrozen) return;
    var ch = LIBRARY[currentChapter];
    var newPg = currentPage + direction;
    if (newPg < 0 || newPg >= ch.pages.length) {
        if (direction === 1 && currentChapter < getChapterCount() - 1) { _transitionChapter(1); return; }
        if (direction === -1 && currentChapter > 0) { _transitionChapter(-1); return; }
        _flashBoundary(); return;
    }
    _performTransition('y', direction, currentChapter, newPg);
}

/* ═══════════════════════════════════════════════════════════════
   SCROLLING / PANNING
   ═══════════════════════════════════════════════════════════════ */
function _applyPan() {
    if (currentPageGroup) currentPageGroup.position.y = panY;
    /* fixedNavGroup stays at y=0 — nav quads don't scroll */
    _updateNavColumnAnim();
}

function _clampPan() {
    var maxPan = 0;
    if (currentLayout && currentLayout.totalContentHeight) {
        maxPan = Math.max(0, currentLayout.totalContentHeight - H);
    }
    panY = Math.max(0, Math.min(maxPan, panY));
}

function _handleOverscroll(delta) {
    if (!delta) return;
    var dir = delta > 0 ? 1 : -1;
    if (dir !== overscrollDir) { overscrollAcc = 0; overscrollDir = dir; }
    overscrollAcc += Math.abs(delta);
    if (overscrollAcc >= OVERSCROLL_THRESHOLD) {
        overscrollAcc = 0; overscrollDir = 0;
        _transitionPage(dir);
    }
}

function _resetOverscroll() { overscrollAcc = 0; overscrollDir = 0; }

function _setupPanning() {
    document.addEventListener('gesturestart',  function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', function(e) { e.preventDefault(); }, { passive: false });
    document.addEventListener('gestureend',    function(e) { e.preventDefault(); }, { passive: false });

    document.addEventListener('wheel', function(e) {
        e.preventDefault();
        if (isAnimating || isFrozen) return;
        var dY = e.deltaY;
        var oldPanY = panY;
        panY += dY;
        _clampPan();
        _applyPan();
        if (panY === oldPanY && dY !== 0) _handleOverscroll(dY);
        else _resetOverscroll();
    }, { passive: false });

    var el = renderer.domElement;
    el.addEventListener('mousedown', function(e) {
        if (isAnimating || isFrozen) return;
        isPanning = true;
        panStartY = e.clientY;
        panStartPanY = panY;
        el.style.cursor = 'grabbing';
        e.preventDefault();
    });
    window.addEventListener('mousemove', function(e) {
        if (!isPanning || isAnimating || isFrozen) return;
        var dy = e.clientY - panStartY;
        var oldPanY = panY;
        panY = panStartPanY - dy;
        _clampPan();
        _applyPan();
        if (panY === oldPanY && dy !== 0) _handleOverscroll(-dy);
        else _resetOverscroll();
    });
    window.addEventListener('mouseup', function() {
        isPanning = false;
        if (el) el.style.cursor = '';
        _resetOverscroll();
    });

    var touchStartY = 0, touchStartPanY = 0;
    el.addEventListener('touchstart', function(e) {
        if (isAnimating || isFrozen || e.touches.length !== 1) return;
        isPanning = true;
        touchStartY = e.touches[0].clientY;
        touchStartPanY = panY;
    }, { passive: true });
    el.addEventListener('touchmove', function(e) {
        if (!isPanning || isAnimating || isFrozen || e.touches.length !== 1) return;
        e.preventDefault();
        var dy = e.touches[0].clientY - touchStartY;
        var oldPanY = panY;
        panY = touchStartPanY - dy;
        _clampPan();
        _applyPan();
        if (panY === oldPanY && dy !== 0) _handleOverscroll(-dy);
        else _resetOverscroll();
    }, { passive: false });
    el.addEventListener('touchend', function() {
        isPanning = false;
        _resetOverscroll();
    });
}

/* ═══════════════════════════════════════════════════════════════
   BOUNDARY FLASH
   ═══════════════════════════════════════════════════════════════ */
function _flashBoundary() {
    if (!flashEl) return;
    flashEl.classList.add('active');
    setTimeout(function() { flashEl.classList.remove('active'); }, 50);
}

/* ═══════════════════════════════════════════════════════════════
   RENDER LOOP
   ═══════════════════════════════════════════════════════════════ */
function _animate() {
    requestAnimationFrame(_animate);
    if (renderer && scene && camera) renderer.render(scene, camera);
}

/* ═══════════════════════════════════════════════════════════════
   RESIZE
   ═══════════════════════════════════════════════════════════════ */
function _onResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    if (renderer) renderer.setSize(W, H);
    if (camera) {
        camera.right  = W;
        camera.bottom = -H;
        camera.updateProjectionMatrix();
    }
    if (currentLayout) renderCurrentPage();
}

/* ═══════════════════════════════════════════════════════════════
   INFO UPDATE
   ═══════════════════════════════════════════════════════════════ */
function _updateInfo() {
    var el = document.getElementById('cds-info');
    if (!el) return;
    var ch = LIBRARY[currentChapter];
    var pgCount = ch ? ch.pages.length : 0;
    var glbStatus = (frameReady ? '✅' : '⏳') + 'Frame';
    var secInfo = '';
    if (currentLayout && currentLayout.sectionRanges && currentLayout.sectionRanges.length > 1) {
        secInfo = '  |  ' + currentLayout.sectionRanges.length + ' Sections (scroll ↕)';
    }
    el.textContent = (ch ? ch.name : '?') + ' — Seite ' + (currentPage+1) + '/' + pgCount +
        '  |  ' + pageNodes.length + ' Mains' + secInfo + '  |  ' + glbStatus;
}

/* ═══════════════════════════════════════════════════════════════
   LAYER VISIBILITY (called by control panel)
   ═══════════════════════════════════════════════════════════════ */
function updateLayerVisibility(key, visible) {
    L[key] = visible;
    if (!currentPageGroup) return;
    currentPageGroup.children.forEach(function(g) {
        if (g.name === 'frames')           g.visible = !!L.frames3d;
        if (g.name === 'images')           g.visible = !!L.images;
        if (g.name === 'netz')             g.visible = !!L.netz3d;
        if (g.name === 'pets')             g.visible = !!L.pets;
        if (g.name === 'outlines-content') g.visible = !!L.outlines_content;
        if (g.name === 'outlines-nav')     g.visible = !!L.outlines_nav;
    });
}

/* ═══════════════════════════════════════════════════════════════
   BOOTSTRAP — wait for THREE to be available
   ═══════════════════════════════════════════════════════════════ */
function _waitForThree() {
    if (typeof THREE !== 'undefined' && THREE.WebGLRenderer) {
        init();
    } else {
        setTimeout(_waitForThree, 50);
    }
}

/* Export ContentLayer API */
window.ContentLayer = {
    showPage: function(ch, pg) {
        /* Queue if not yet initialized */
        if (!renderer) {
            var _ch = ch, _pg = pg;
            var _wait = setInterval(function() {
                if (renderer) {
                    clearInterval(_wait);
                    showPage(_ch, _pg);
                }
            }, 100);
            return;
        }
        showPage(ch, pg);
    },
    transitionTo: function(ch, pg) {
        if (!renderer) return;
        transitionTo(ch, pg);
    },
    freeze: freeze,
    unfreeze: unfreeze,
    updateLayerVisibility: updateLayerVisibility,
    getState: function() {
        return { chapter: currentChapter, page: currentPage, isAnimating: isAnimating };
    }
};

/* Start */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _waitForThree);
} else {
    _waitForThree();
}

})();
