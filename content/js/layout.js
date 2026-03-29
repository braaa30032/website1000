/* ═══════════════════════════════════════════════════════════════
   LAYOUT ENGINE  (ported from scroll-demo.html)
   
   Computes grid positions for mains, subs (variable per main),
   pets, and netz fill quads.
   
   Called by app.js with real LIBRARY data.
   ═══════════════════════════════════════════════════════════════ */

export var LAYOUT_CONST = {
    MAIN_ASPECT: 3 / 4,
    SUB_ASPECT:  4 / 3,
    SQ_RATIO:    0.25,
    PET_ASPECT:  3 / 4,
    PET_SCALE:   0.25
};

/**
 * computeLayout(cfg, W, H)
 *
 * @param {object}   cfg
 * @param {number}   cfg.mainCount       – number of mains on this page
 * @param {number[]} cfg.subsPerMain     – array: subs[i] = number of subs for main i
 * @param {number[]} cfg.petsPerMain     – array: pets[i] = number of pets for main i
 * @param {number[]} cfg.petsPerSub      – flat array (per sub in order) of pet counts
 * @param {object[]} [cfg.petData]       – optional library pet objects with manual x/y
 * @param {number}   W                   – viewport width
 * @param {number}   H                   – viewport height
 *
 * @returns {object} layout with SQ, navs, mains, subs, netz, pets, etc.
 */
export function computeLayout(cfg, W, H) {
    var mainCount   = cfg.mainCount;
    var subsPerMain = cfg.subsPerMain || [];
    var isLand      = W >= H;
    var mainAspects = cfg.mainAspects || null;
    var subAspects  = cfg.subAspects  || null;

    var SQ_RATIO    = LAYOUT_CONST.SQ_RATIO;
    var MAIN_ASPECT = LAYOUT_CONST.MAIN_ASPECT;
    var SUB_ASPECT  = LAYOUT_CONST.SUB_ASPECT;
    var PET_ASPECT  = LAYOUT_CONST.PET_ASPECT;
    var PET_SCALE   = LAYOUT_CONST.PET_SCALE;

    var SQ = Math.round(Math.min(W, H) * SQ_RATIO);

    var navTL = { x: 0,      y: 0,      w: SQ, h: SQ };
    var navTR = { x: W - SQ, y: 0,      w: SQ, h: SQ };
    var navBL = { x: 0,      y: H - SQ, w: SQ, h: SQ };
    var navBR = { x: W - SQ, y: H - SQ, w: SQ, h: SQ };

    var innerW = W - 2 * SQ;
    var innerH = H - 2 * SQ;

    var mains = [], subs = [];
    var projections = [], projPts = [], contentCorners = [];
    var mainW, mainH, subW, subH;
    var totalH;  /* actual content height (may exceed H for scrollable) */
    var sectionRanges = [];
    var sectionContents = null;  /* per-section data for independent netz (multi-section only) */

    /* ── SECTIONS-BASED LAYOUT (from scroll-demo) ── */
    var sections = (cfg.sections && cfg.sections.length > 1) ? cfg.sections : null;

    if (sections) {
        /* Multi-section: sections stacked vertically, per-section independent netz.
           EVERY section is exactly innerH tall.  Mains contain-fit inside. */
        sectionContents = [];
        var curY = SQ;
        var globalMainIdx = 0;

        for (var secIdx = 0; secIdx < sections.length; secIdx++) {
            var sec = sections[secIdx];
            var nM  = sec.mainCount;
            var secMains = [], secSubs = [];

            /* Section domain */
            var domainTop, domainBot;
            if (secIdx === 0) {
                curY = SQ;
                domainTop = 0;
                domainBot = H;
            } else {
                if (secIdx === 1) curY = H;
                var secPadTop = Math.round(SQ * 0.35);
                curY += secPadTop;
                domainTop = (secIdx === 1) ? H : curY - secPadTop;
            }

            sectionRanges.push({ startMain: globalMainIdx, endMain: globalMainIdx + nM });

            /* Place mains: landscape → side-by-side, portrait → stacked */
            var secSlotW = isLand ? Math.round(innerW / nM) : innerW;

            for (var smi = 0; smi < nM; smi++) {
                var gmi = globalMainIdx + smi;
                var mAspS = (mainAspects && mainAspects[gmi] != null) ? mainAspects[gmi] : MAIN_ASPECT;
                var nSubsS = subsPerMain[gmi] || 0;

                /* Contain-fit main within (slotW × innerH) */
                var availW = isLand ? secSlotW : innerW;
                var maxMW = (nSubsS > 0) ? Math.round(availW / 1.5) : availW;
                var mWS, mHS;
                if (maxMW / innerH > mAspS) {
                    mHS = innerH; mWS = Math.round(innerH * mAspS);
                } else {
                    mWS = maxMW; mHS = Math.round(maxMW / mAspS);
                }
                var sWS = (nSubsS > 0) ? Math.round(mWS / 2) : 0;

                /* Scale down if main + sub doesn't fit in slot */
                if (isLand && (mWS + sWS) > secSlotW) {
                    var scaleS = secSlotW / (mWS + sWS);
                    mWS = Math.round(mWS * scaleS);
                    mHS = Math.round(mWS / mAspS);
                    sWS = (nSubsS > 0) ? Math.round(mWS / 2) : 0;
                }

                /* Sub heights from aspects */
                var subHArrS = [];
                for (var siS = 0; siS < nSubsS; siS++) {
                    var sAspS = (subAspects && subAspects[gmi] && subAspects[gmi][siS] != null)
                        ? subAspects[gmi][siS] : SUB_ASPECT;
                    subHArrS.push(Math.round(sWS / sAspS));
                }

                if (gmi === 0) { mainW = mWS; mainH = mHS; subW = sWS; subH = subHArrS[0] || Math.round(sWS / SUB_ASPECT); }

                var mx, my;
                if (isLand) {
                    mx = SQ + smi * secSlotW;
                    my = curY;
                } else {
                    mx = SQ;
                    my = curY + smi * innerH;
                }
                var mr = mx + mWS, mb = my + mHS;
                var mObj = { x: mx, y: my, w: mWS, h: mHS, r: mr, b: mb };
                mains.push(mObj);
                secMains.push(mObj);
                contentCorners.push([mx,my],[mr,my],[mr,mb],[mx,mb]);

                var anchorX = isLand
                    ? ((smi < nM - 1) ? SQ + (smi + 1) * secSlotW : W - SQ)
                    : W - SQ;
                var groupSubs = _placeSubs(mr, my, mb, anchorX, my,
                    sWS, subHArrS, nSubsS, innerH, projections, projPts, contentCorners, W, H);
                subs.push(groupSubs);
                secSubs.push(groupSubs);
            }

            curY += isLand ? innerH : nM * innerH;
            var secPadBot = (secIdx < sections.length - 1) ? 0 : Math.round(SQ * 0.25);
            if (secIdx > 0) {
                domainBot = curY + secPadBot;
            }

            sectionContents.push({
                mains: secMains, subs: secSubs,
                domainTop: domainTop, domainBot: domainBot
            });

            globalMainIdx += nM;
        }

        totalH = sectionContents[sectionContents.length - 1].domainBot;

    } else if (isLand) {
        totalH = H;
        var sectionW = Math.round(innerW / mainCount);

        for (var gi = 0; gi < mainCount; gi++) {
            /* Per-main aspect ratio (w/h) from content, fallback to default */
            var mAsp = (mainAspects && mainAspects[gi] != null) ? mainAspects[gi] : MAIN_ASPECT;
            var mH = innerH;
            var mW = Math.round(mH * mAsp);
            var sW = Math.round(mW / 2);

            /* Per-sub heights based on content aspects */
            var nSubs = subsPerMain[gi] || 0;
            var subHArr = [];
            for (var si = 0; si < nSubs; si++) {
                var sAsp = (subAspects && subAspects[gi] && subAspects[gi][si] != null)
                    ? subAspects[gi][si] : SUB_ASPECT;
                subHArr.push(Math.round(sW / sAsp));
            }

            /* Scale down if main + sub doesn't fit horizontally */
            if (mW + sW > sectionW) {
                var scale = sectionW / (mW + sW);
                mW = Math.round(mW * scale);
                mH = Math.round(mW / mAsp);
                sW = Math.round(mW / 2);
                for (var si2 = 0; si2 < nSubs; si2++) {
                    var sAsp2 = (subAspects && subAspects[gi] && subAspects[gi][si2] != null)
                        ? subAspects[gi][si2] : SUB_ASPECT;
                    subHArr[si2] = Math.round(sW / sAsp2);
                }
            }

            /* Track representative dims from first main (used for pets + return) */
            if (gi === 0) { mainW = mW; mainH = mH; subW = sW; subH = subHArr[0] || Math.round(sW / SUB_ASPECT); }

            var secLeft = SQ + gi * sectionW;
            var mx = secLeft, my = SQ;
            var mr = mx + mW, mb = my + mH;

            mains.push({ x: mx, y: my, w: mW, h: mH, r: mr, b: mb });
            contentCorners.push([mx,my],[mr,my],[mr,mb],[mx,mb]);

            var anchorX = (gi < mainCount - 1) ? SQ + (gi + 1) * sectionW : W - SQ;

            var groupSubs = _placeSubs(mr, my, mb, anchorX, SQ,
                sW, subHArr, nSubs, innerH, projections, projPts, contentCorners, W, H);
            subs.push(groupSubs);
        }
    } else {
        /* ── Portrait mode: single-section ──
           Main contain-fits within (maxW × innerH).  Row = innerH. */
        var curY = SQ;

        for (var gi2 = 0; gi2 < mainCount; gi2++) {
            var mAspP = (mainAspects && mainAspects[gi2] != null) ? mainAspects[gi2] : MAIN_ASPECT;
            var nSubsP = subsPerMain[gi2] || 0;

            /* Contain-fit main within (maxW × innerH) */
            var maxWP = (nSubsP > 0) ? Math.round(innerW / 1.5) : innerW;
            var mWP, mHP;
            if (maxWP / innerH > mAspP) {
                mHP = innerH; mWP = Math.round(innerH * mAspP);
            } else {
                mWP = maxWP; mHP = Math.round(maxWP / mAspP);
            }
            var sWP = (nSubsP > 0) ? Math.round(mWP / 2) : 0;

            /* Sub heights from aspects */
            var subHArrP = [];
            for (var siP = 0; siP < nSubsP; siP++) {
                var sAspP = (subAspects && subAspects[gi2] && subAspects[gi2][siP] != null)
                    ? subAspects[gi2][siP] : SUB_ASPECT;
                subHArrP.push(Math.round(sWP / sAspP));
            }

            if (gi2 === 0) { mainW = mWP; mainH = mHP; subW = sWP; subH = subHArrP[0] || Math.round(sWP / SUB_ASPECT); }

            var mx2 = SQ, my2 = curY;
            var mr2 = mx2 + mWP, mb2 = my2 + mHP;

            mains.push({ x: mx2, y: my2, w: mWP, h: mHP, r: mr2, b: mb2 });
            contentCorners.push([mx2,my2],[mr2,my2],[mr2,mb2],[mx2,mb2]);

            var anchorX2 = W - SQ;
            var groupSubs2 = _placeSubs(mr2, my2, mb2, anchorX2, my2,
                sWP, subHArrP, nSubsP, innerH, projections, projPts, contentCorners, W, H);
            subs.push(groupSubs2);

            curY += innerH;
        }

        totalH = curY + SQ;
    }

    /* Ensure summary values are set (empty page fallback) */
    if (!mainW) { mainW = Math.round(innerH * MAIN_ASPECT); mainH = innerH; subW = Math.round(mainW / 2); subH = Math.round(subW / SUB_ASPECT); }
    if (!totalH) totalH = H;

    /* Nav corners stay at the VIEWPORT edges — never move with content.
       navBL/navBR stay at H - SQ (viewport bottom). */
    /* (No adjustment needed — they were initialised at H - SQ above.) */

    [navTL, navTR, navBL, navBR].forEach(function(r) {
        contentCorners.push([r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]);
    });

    var netz;
    if (sectionContents && sectionContents.length > 1) {
        /* Per-section independent netz grids */
        var allNetzCells = [];
        for (var ni = 0; ni < sectionContents.length; ni++) {
            var sc = sectionContents[ni];
            var blockers = (ni === 0) ? [navTL, navTR, navBL, navBR] : [];
            var secNetz = _buildNetzForRegion(
                sc.mains, sc.subs, blockers,
                0, W, sc.domainTop, sc.domainBot
            );
            allNetzCells = allNetzCells.concat(secNetz);
        }
        netz = _mergeRects(allNetzCells);
    } else {
        netz = _buildNetz(mains, subs, navTL, navTR, navBL, navBR, SQ, W, totalH, H);
    }

    /* ── Pets ── */
    var nPetsMain   = cfg.petsPerMain  || [];
    var nPetsSub    = cfg.petsPerSub   || [];
    var petDataList = cfg.petData      || [];
    var petW = Math.round(mainW * PET_SCALE);
    var petH = Math.round(petW / PET_ASPECT);

    var navRects = [navTL, navTR, navBL, navBR];
    var pets = [];

    /* Pets owned by mains */
    var petDataIdx = 0;
    for (var pi = 0; pi < mains.length; pi++) {
        var exclM = [];
        mains.forEach(function(m, mi) { if (mi !== pi) exclM.push(m); });
        subs.forEach(function(g) { g.forEach(function(s) { exclM.push(s); }); });
        navRects.forEach(function(n) { exclM.push(n); });
        pets.forEach(function(p) { exclM.push({ x: p.x - p.w/2, y: p.y - p.h/2, r: p.x + p.w/2, b: p.y + p.h/2 }); });

        var nPM = nPetsMain[pi] || 0;
        for (var pj = 0; pj < nPM; pj++) {
            var petDatum = petDataList[petDataIdx++];
            var pos;
            if (petDatum && petDatum.x !== undefined && petDatum.y !== undefined) {
                var sc = (petDatum.scale !== undefined) ? petDatum.scale : 1;
                var mPetW = Math.round(petW * sc);
                var mPetH = Math.round(petH * sc);
                pos = {
                    x: mains[pi].x + petDatum.x + mPetW / 2,
                    y: mains[pi].y + petDatum.y + mPetH / 2,
                    w: mPetW, h: mPetH
                };
            } else {
                pos = _placePet(mains[pi], pj, nPM, exclM, petW, petH, SQ, W, totalH);
            }
            pets.push({
                parentType: 'main', parentIndex: pi, petIndex: pj,
                w: pos.w, h: pos.h, x: pos.x, y: pos.y,
                data: petDatum || null
            });
            exclM.push({ x: pos.x - pos.w/2, y: pos.y - pos.h/2, r: pos.x + pos.w/2, b: pos.y + pos.h/2 });
        }
    }

    /* Pets owned by subs */
    var subPetIdx = 0;
    for (var si = 0; si < subs.length; si++) {
        for (var sj = 0; sj < subs[si].length; sj++) {
            var parentSub = subs[si][sj];
            var exclS = [];
            mains.forEach(function(m) { exclS.push(m); });
            subs.forEach(function(g) { g.forEach(function(s) {
                if (s !== parentSub) exclS.push(s);
            }); });
            navRects.forEach(function(n) { exclS.push(n); });
            pets.forEach(function(p) { exclS.push({ x: p.x - p.w/2, y: p.y - p.h/2, r: p.x + p.w/2, b: p.y + p.h/2 }); });

            var nPS = nPetsSub[subPetIdx] || 0;
            for (var sk = 0; sk < nPS; sk++) {
                var posS = _placePet(parentSub, sk, nPS, exclS, petW, petH, SQ, W, totalH);
                pets.push({
                    parentType: 'sub', parentIndex: si, subIndex: sj, petIndex: sk,
                    w: posS.w, h: posS.h, x: posS.x, y: posS.y,
                    data: null
                });
                exclS.push({ x: posS.x - posS.w/2, y: posS.y - posS.h/2, r: posS.x + posS.w/2, b: posS.y + posS.h/2 });
            }
            subPetIdx++;
        }
    }

    return {
        SQ: SQ, isLand: isLand, isTimeline: false,
        navTL: navTL, navTR: navTR, navBL: navBL, navBR: navBR,
        mains: mains, subs: subs,
        projections: projections, projPts: projPts, contentCorners: contentCorners,
        netz: netz, mainW: mainW, mainH: mainH, subW: subW, subH: subH,
        pets: pets, petW: petW, petH: petH,
        totalContentHeight: totalH, rowHeight: totalH,
        sectionRanges: sectionRanges
    };
}

/**
 * Compute a layout shifted by (offsetX, offsetY) for transitions.
 */
export function computeOffsetLayout(cfg, W, H, offsetX, offsetY) {
    var layout = computeLayout(cfg, W, H);
    var shift = function(rect) {
        rect.x += offsetX; rect.y += offsetY;
        if (rect.r !== undefined) rect.r += offsetX;
        if (rect.b !== undefined) rect.b += offsetY;
    };
    shift(layout.navTL); shift(layout.navTR); shift(layout.navBL); shift(layout.navBR);
    layout.mains.forEach(shift);
    layout.subs.forEach(function(g) { g.forEach(shift); });
    layout.netz.forEach(function(n) {
        if (n.type === 'rect') { n.x += offsetX; n.y += offsetY; }
        else if (n.pts) { n.pts = n.pts.map(function(p) { return [p[0]+offsetX, p[1]+offsetY]; }); }
    });
    layout._offsetX = offsetX;
    layout._offsetY = offsetY;
    return layout;
}

/* ── Internal helpers ── */

function _placeSubs(mainR, mainT, mainB, anchorX, anchorY, subW, subH, count, availH, proj, projPts, cc, W, H) {
    var g = [], curY = anchorY;
    for (var i = 0; i < count; i++) {
        var sH = Array.isArray(subH) ? (subH[i] || Math.round(subW * 0.75)) : subH;
        var sx = mainR, sR = sx + subW, sy = curY, sB = sy + sH;
        g.push({ x:sx, y:sy, w:subW, h:sH, r:sR, b:sB });
        cc.push([sx,sy],[sR,sy],[sR,sB],[sx,sB]);
        proj.push({ from:[sx,sy], to:[sx,0] }, { from:[sx,sB], to:[sx,H] },
                  { from:[sR,sy], to:[W,sy] }, { from:[sR,sB], to:[W,sB] });
        projPts.push([sx,0],[sx,H],[W,sy],[W,sB]);
        curY = sB;
    }
    return g;
}

function _buildNetz(mains, subs, navTL, navTR, navBL, navBR, SQ, W, H, viewH) {
    var xC = [0, SQ, W - SQ, W], yC = [0, SQ, H - SQ, H];
    mains.forEach(function(m) { xC.push(m.x, m.r); yC.push(m.y, m.b); });
    subs.forEach(function(g) { g.forEach(function(s) { xC.push(s.x, s.r); yC.push(s.y, s.b); }); });
    xC = _uSorted(xC); yC = _uSorted(yC);

    var occ = [];
    [navTL, navTR, navBL, navBR].forEach(function(r) { occ.push({ x:r.x, y:r.y, r:r.x+r.w, b:r.y+r.h }); });
    mains.forEach(function(m) { occ.push({ x:m.x, y:m.y, r:m.r, b:m.b }); });
    subs.forEach(function(g) { g.forEach(function(s) { occ.push({ x:s.x, y:s.y, r:s.r, b:s.b }); }); });

    /* Block left/right nav-width strips below the viewport.
       In the viewport (0..viewH), the nav corners occupy the side columns.
       Below the viewport, the side strips should be WHITE (empty, no netz). */
    if (viewH && H > viewH + 1) {
        /* Block from viewport bottom to content bottom */
        occ.push({ x: 0, y: viewH, r: SQ, b: H });
        occ.push({ x: W - SQ, y: viewH, r: W, b: H });
        yC.push(viewH);
    }
    yC = _uSorted(yC);

    var netz = [], nI = 0;
    for (var xi = 0; xi < xC.length-1; xi++) {
        for (var yi = 0; yi < yC.length-1; yi++) {
            var cx=xC[xi], cy=yC[yi], cw=xC[xi+1]-cx, ch=yC[yi+1]-cy;
            if (cw < 2 || ch < 2) continue;
            if (!_overAny(cx, cy, cx+cw, cy+ch, occ))
                netz.push({ id:'n'+(nI++), type:'rect', x:cx, y:cy, w:cw, h:ch });
        }
    }
    return _mergeVertical(netz);
}

function _placePet(parent, petIdx, petCount, exclRects, baseW, baseH, SQ, W, H) {
    var pcx = parent.x + parent.w / 2, pcy = parent.y + parent.h / 2;
    var baseAngle = -Math.PI / 4 + (2 * Math.PI * petIdx) / Math.max(petCount, 1);
    var maxOverlapArea = (parent.w * parent.h) / 8;
    var pR0 = parent.r || (parent.x + parent.w);
    var pB0 = parent.b || (parent.y + parent.h);
    var scales = [1.0, 0.75, 0.55, 0.4];

    for (var sc = 0; sc < scales.length; sc++) {
        var pw = Math.round(baseW * scales[sc]), ph = Math.round(baseH * scales[sc]);
        if (pw < 6 || ph < 6) break;
        var maxDx = maxOverlapArea / Math.min(ph, parent.h);
        var maxDy = maxOverlapArea / Math.min(pw, parent.w);
        var minDistX = parent.w / 2 + pw / 2 - maxDx;
        var minDistY = parent.h / 2 + ph / 2 - maxDy;

        for (var ri = 0; ri < 4; ri++) {
            var padX = minDistX + ri * pw * 0.3, padY = minDistY + ri * ph * 0.3;
            for (var ai = 0; ai < 24; ai++) {
                var angle = baseAngle + (ai * Math.PI * 2) / 24;
                var cx = pcx + padX * Math.cos(angle), cy = pcy + padY * Math.sin(angle);
                cx = Math.max(SQ + pw/2, Math.min(W - SQ - pw/2, cx));
                cy = Math.max(SQ + ph/2, Math.min(H - SQ - ph/2, cy));
                var pL = cx - pw/2, pR = cx + pw/2, pT = cy - ph/2, pBt = cy + ph/2;
                var bad = false;
                for (var i = 0; i < exclRects.length; i++) {
                    var e = exclRects[i];
                    if (pL < e.r && pR > e.x && pT < e.b && pBt > e.y) { bad = true; break; }
                }
                if (bad) continue;
                var ox = Math.max(0, Math.min(pR, pR0) - Math.max(pL, parent.x));
                var oy = Math.max(0, Math.min(pBt, pB0) - Math.max(pT, parent.y));
                if (ox * oy > maxOverlapArea) continue;
                return { x: cx, y: cy, w: pw, h: ph };
            }
        }
    }
    var fw = Math.round(baseW * scales[scales.length - 1]);
    var fh = Math.round(baseH * scales[scales.length - 1]);
    var fallDist = Math.max(parent.w, parent.h) * 0.7;
    return {
        x: Math.max(SQ + fw/2, Math.min(W - SQ - fw/2, pcx + fallDist * Math.cos(baseAngle))),
        y: Math.max(SQ + fh/2, Math.min(H - SQ - fh/2, pcy + fallDist * Math.sin(baseAngle))),
        w: fw, h: fh
    };
}

function _uSorted(a) { var s={}, r=[]; a.forEach(function(v) { if(!s[v]){ s[v]=1; r.push(v); }}); r.sort(function(a,b){return a-b;}); return r; }
function _overAny(x,y,r,b,occ) { for(var i=0;i<occ.length;i++){ var o=occ[i]; if(x<o.r-1&&r>o.x+1&&y<o.b-1&&b>o.y+1) return true; } return false; }
function _findAbove(y,x0,x1,occ,fb) { var best=fb; occ.forEach(function(o){ if(o.r>x0+1&&o.x<x1-1&&o.b<=y+1&&o.b>best) best=o.b; }); return best; }
function _findBelow(y,x0,x1,occ,fb) { var best=fb; occ.forEach(function(o){ if(o.r>x0+1&&o.x<x1-1&&o.y>=y-1&&o.y<best) best=o.y; }); return best; }

/* ── Per-section independent netz builder (from scroll-demo) ── */
function _buildNetzForRegion(regionMains, regionSubs, blockers, xMin, xMax, yMin, yMax) {
    var xC = [xMin, xMax];
    var yC = [yMin, yMax];
    blockers.forEach(function(r) { xC.push(r.x, r.x + r.w); yC.push(r.y, r.y + r.h); });
    regionMains.forEach(function(m) { xC.push(m.x, m.r); yC.push(m.y, m.b); });
    regionSubs.forEach(function(g) { g.forEach(function(s) { xC.push(s.x, s.r); yC.push(s.y, s.b); }); });
    xC = _uSorted(xC); yC = _uSorted(yC);

    var occ = [];
    blockers.forEach(function(r) { occ.push({ x: r.x, y: r.y, r: r.x + r.w, b: r.y + r.h }); });
    regionMains.forEach(function(m) { occ.push({ x: m.x, y: m.y, r: m.r, b: m.b }); });
    regionSubs.forEach(function(g) { g.forEach(function(s) { occ.push({ x: s.x, y: s.y, r: s.r, b: s.b }); }); });

    var netz = [], nI = 0;
    for (var xi = 0; xi < xC.length-1; xi++) {
        for (var yi = 0; yi < yC.length-1; yi++) {
            var cx=xC[xi], cy=yC[yi], cw=xC[xi+1]-cx, ch=yC[yi+1]-cy;
            if (cw < 2 || ch < 2) continue;
            if (!_overAny(cx, cy, cx+cw, cy+ch, occ))
                netz.push({ id:'n'+(nI++), type:'rect', x:cx, y:cy, w:cw, h:ch });
        }
    }

    return _mergeVertical(netz);
}

/* ── Vertical merge: combine adjacent cells in the same column ── */
function _mergeVertical(netz) {
    var changed = true;
    while (changed) {
        changed = false;
        netz.sort(function(a,b) { return (a.x-b.x)||(a.w-b.w)||(a.y-b.y); });
        for (var i = 0; i < netz.length - 1; i++) {
            var a = netz[i], b = netz[i+1];
            if (a.type === 'rect' && b.type === 'rect' &&
                a.x === b.x && a.w === b.w && a.y + a.h === b.y) {
                netz[i] = { id: a.id, type: 'rect', x: a.x, y: a.y, w: a.w, h: a.h + b.h };
                netz.splice(i+1, 1); changed = true; i--;
            }
        }
    }
    return netz;
}

/* ── Merge adjacent netz rects (reduces draw calls for multi-section) ── */
function _mergeRects(netz) {
    var polys=[], rects=[];
    netz.forEach(function(n) { if(n.type==='poly') polys.push(n); else rects.push(n); });
    /* Vertical merge only — keeps main/sub columns separate */
    var changed = true;
    while (changed) {
        changed = false;
        rects.sort(function(a,b) { return (a.x-b.x)||(a.w-b.w)||(a.y-b.y); });
        for (var i=0; i<rects.length-1; i++) {
            var a=rects[i], b=rects[i+1];
            if (a.x===b.x && a.w===b.w && a.y+a.h===b.y) {
                rects[i] = { id:a.id, type:'rect', x:a.x, y:a.y, w:a.w, h:a.h+b.h };
                rects.splice(i+1,1); changed=true; i--;
            }
        }
    }
    var r=[], idx=0;
    rects.forEach(function(rc) { rc.id='n'+(idx++); r.push(rc); });
    polys.forEach(function(p) { r.push(p); });
    return r;
}

/* Window globals for backward compat */
window.computeLayout       = computeLayout;
window.computeOffsetLayout = computeOffsetLayout;
window.LAYOUT_CONST        = LAYOUT_CONST;
