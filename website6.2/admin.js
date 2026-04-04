/* ═══════════════════════════════════════════════════════════════
   CMS ADMIN PANEL  — admin.js
   
   Visual editor for library.js content.
   Same grid layout as the live site, but with add/edit/delete
   controls on every content slot.
   
   Flow:
     1. Login → get session token
     2. Navigate chapters / pages via toolbar
     3. Add / replace / delete mains, subs, pets, text, netzTexts
     4. Upload files to Scaleway S3 (presigned URL for large files)
     5. Publish → serialize LIBRARY → commit to GitHub
   ═══════════════════════════════════════════════════════════════ */

import { LIBRARY, COLOR_PALETTES, TYPO_PRESETS,
         activePaletteIndex, activeTypoIndex,
         NAV_TEXT_MODE, getActivePalette,
         getMainNodesForPage, getPageSections } from './library.js';
import { computeLayout, LAYOUT_CONST } from './layout.js';

/* ── Admin uses the INACTIVE palette (opposite of live site) ── */
const ADMIN_PALETTE = COLOR_PALETTES[activePaletteIndex === 0 ? 1 : 0] || COLOR_PALETTES[0];

/* ── API base URL (set to your Scaleway Function URL after deployment) ── */
const API_BASE = localStorage.getItem('cms_api_url') || '';

/* ═══════════════════════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════════════════════ */
const S = {
    token:    sessionStorage.getItem('cms_token') || null,
    lib:      JSON.parse(JSON.stringify(LIBRARY)),   // deep mutable clone
    ch:       0,
    pg:       0,
    dirty:    false,
};

/* ── DOM refs ── */
const $ = (id) => document.getElementById(id);

/* ═══════════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
    // Apply admin palette as CSS vars
    _applyAdminPalette();

    // If no API URL configured, prompt once
    if (!API_BASE) {
        const url = prompt(
            'CMS API URL eingeben (Scaleway Function URL):\n\n' +
            'z.B. https://xxx.functions.fnc.fr-par.scw.cloud\n\n' +
            '(wird in localStorage gespeichert)'
        );
        if (url) {
            localStorage.setItem('cms_api_url', url.replace(/\/+$/, ''));
            location.reload();
            return;
        }
    }

    $('login-btn').onclick = doLogin;
    $('login-pw').onkeydown = (e) => { if (e.key === 'Enter') doLogin(); };
    // Show/hide blinking cursor based on whether password has text
    $('login-pw').oninput = () => {
        const cursor = $('pw-cursor');
        if ($('login-pw').value.length > 0) cursor.classList.add('hidden');
        else cursor.classList.remove('hidden');
    };
    $('btn-logout').onclick = doLogout;
    $('btn-publish').onclick = doPublish;
    $('btn-deploy').onclick = deploySite;
    $('sel-chapter').onchange = (e) => { S.ch = +e.target.value; S.pg = 0; populatePages(); render(); };
    $('sel-page').onchange = (e) => { S.pg = +e.target.value; render(); };
    $('dialog-cancel').onclick = closeDialog;
    $('dialog-overlay').onclick = (e) => { if (e.target === $('dialog-overlay')) closeDialog(); };

    if (S.token) {
        // Returning session — skip login animation, go straight to editor
        const overlay = $('login-overlay');
        overlay.classList.add('opening', 'opened');
        showEditor();
    }
});

/** Apply the inactive palette as CSS custom properties */
function _applyAdminPalette() {
    const s = document.body.style;
    s.setProperty('--admin-primary',     ADMIN_PALETTE.primary);
    s.setProperty('--admin-secondary',   ADMIN_PALETTE.secondary);
    s.setProperty('--admin-accent',      ADMIN_PALETTE.accent);
    s.setProperty('--admin-surface',     ADMIN_PALETTE.surface);
    s.setProperty('--admin-onSurface',   ADMIN_PALETTE.onSurface);
    s.setProperty('--admin-onPrimary',   ADMIN_PALETTE.onPrimary);
    s.setProperty('--admin-onSecondary', ADMIN_PALETTE.onSecondary);
}

/* ═══════════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════════ */
async function doLogin() {
    const pw = $('login-pw').value;
    if (!pw) return;
    $('login-error').textContent = '';

    try {
        const res = await fetch(API_BASE + '/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pw }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        S.token = data.token;
        sessionStorage.setItem('cms_token', S.token);

        // Animate quads open (shrink to corners)
        _openLoginQuads();
    } catch (err) {
        $('login-error').textContent = err.message;
        // Shake the password input on error
        const pw = $('login-pw');
        pw.style.borderColor = 'var(--admin-secondary)';
        setTimeout(() => { pw.style.borderColor = ''; }, 1500);
    }
}

function doLogout() {
    S.token = null;
    sessionStorage.removeItem('cms_token');
    $('admin-panel').hidden = true;
    // Reset login overlay to closed (quads full)
    const overlay = $('login-overlay');
    overlay.classList.remove('opening', 'opened');
    overlay.style.display = '';
    $('login-pw').value = '';
    $('login-error').textContent = '';
}

function showEditor() {
    $('admin-panel').hidden = false;
    populateChapters();
    populatePages();
    render();
}

/** Animate login quads open → reveal admin panel behind */
function _openLoginQuads() {
    const overlay = $('login-overlay');

    // Pre-render admin panel behind the quads
    showEditor();

    // Trigger quad shrink animation
    requestAnimationFrame(() => {
        overlay.classList.add('opening');
    });

    // After transition ends → fully hide overlay
    const onEnd = () => {
        overlay.classList.add('opened');
        overlay.removeEventListener('transitionend', onEnd);
    };
    overlay.addEventListener('transitionend', onEnd);
}

/* ═══════════════════════════════════════════════════════════════
   TOOLBAR — POPULATE SELECTS
   ═══════════════════════════════════════════════════════════════ */
function populateChapters() {
    const sel = $('sel-chapter');
    sel.innerHTML = '';
    S.lib.forEach((ch, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i}: ${ch.name}`;
        if (i === S.ch) opt.selected = true;
        sel.appendChild(opt);
    });
}

function populatePages() {
    const sel = $('sel-page');
    sel.innerHTML = '';
    const ch = S.lib[S.ch];
    if (!ch) return;
    ch.pages.forEach((_, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        const pageName = (ch.pageNames && ch.pageNames[i]) || `Seite ${i}`;
        opt.textContent = `${i}: ${pageName}`;
        if (i === S.pg) opt.selected = true;
        sel.appendChild(opt);
    });
}

function markDirty() {
    S.dirty = true;
    $('status').textContent = '● Unsaved changes';
    $('status').style.color = '#ffcc00';
    $('btn-publish').disabled = false;
}

/* ═══════════════════════════════════════════════════════════════
   RENDER — Grid with admin overlays
   ═══════════════════════════════════════════════════════════════ */
function render() {
    const vp = $('grid-viewport');
    vp.innerHTML = '';

    const ch = S.lib[S.ch];
    if (!ch || !ch.pages[S.pg]) {
        vp.innerHTML = '<p style="padding:40px;color:#888">Keine Seite vorhanden.</p>';
        return;
    }

    const page = ch.pages[S.pg];
    const W = Math.min(window.innerWidth, 1400);
    const H = Math.round(W * 0.65);   // approx viewport aspect

    // Build nodes + sections (same as grid.js _buildLayoutConfig)
    const nodes = _buildNodes(page, S.ch, S.pg);
    const sections = _getSections(S.ch, S.pg, page.length);
    const cfg = _buildLayoutConfig(nodes, sections);
    const layout = computeLayout(cfg, W, H);

    // Canvas container
    const canvas = document.createElement('div');
    canvas.className = 'grid-canvas';
    canvas.style.width = W + 'px';
    canvas.style.height = layout.totalContentHeight + 'px';

    // ── Nav quads (interactive) ──
    _renderNavTL(canvas, layout.navTL, ch.name, (ch.pageNames && ch.pageNames[S.pg]) || `Seite ${S.pg}`);
    _renderNavTR(canvas, layout.navTR);
    _renderNavBL(canvas, layout.navBL);
    _renderNavBR(canvas, layout.navBR);

    // ── Netz quads ──
    layout.netz.forEach(nz => {
        if (nz.type !== 'rect') return;
        const el = document.createElement('div');
        el.className = 'admin-netz';
        el.style.cssText = `left:${nz.x}px;top:${nz.y}px;width:${nz.w}px;height:${nz.h}px;`;
        canvas.appendChild(el);

        // Every netz rect gets an "add text" button
        canvas.appendChild(_makeAddBtn(nz.x + nz.w / 2, nz.y + nz.h / 2, 'add text', () => addNetzText()));
    });

    // ── Main slots ──
    layout.mains.forEach((rect, mi) => {
        const node = nodes[mi];
        const el = _makeSlot('main', rect, node);
        canvas.appendChild(el);

        // "add sub" button to the right of main
        const subBtnX = rect.r + 20;
        const subBtnY = rect.y + rect.h / 2;
        if (subBtnX < W - layout.SQ) {
            canvas.appendChild(_makeAddBtn(subBtnX, subBtnY, 'add sub', () => addSub(mi)));
        }

        // "add pet" button (offset above-left of main)
        canvas.appendChild(_makeAddBtn(rect.x + 30, rect.y + 30, 'add pet', () => addPet(mi)));
    });

    // ── Sub slots ──
    layout.subs.forEach((group, mi) => {
        group.forEach((rect, si) => {
            const mainNode = nodes[mi];
            const subNode = mainNode && mainNode.children ? mainNode.children[si] : null;
            const el = _makeSlot('sub', rect, subNode);
            canvas.appendChild(el);

            // "add b2b sub" button next to sub
            if (rect.r + 60 < W - layout.SQ) {
                canvas.appendChild(_makeAddBtn(rect.r + 10, rect.y + rect.h / 2, 'add b2b sub', () => addB2bSub(mi, si)));
            }

            // "add sub pet" button
            canvas.appendChild(_makeAddBtn(rect.x + 20, rect.y + 20, 'add subs pet', () => addSubPet(mi, si)));
        });
    });

    // ── Pet slots ──
    layout.pets.forEach((pet, i) => {
        const rect = { x: pet.x - pet.w / 2, y: pet.y - pet.h / 2, w: pet.w, h: pet.h };
        const el = _makeSlot('pet', rect, pet.data);
        canvas.appendChild(el);
    });

    // ── "add additional main" button ──
    const lastMain = layout.mains[layout.mains.length - 1];
    if (lastMain) {
        const addMainX = Math.min(lastMain.r + 80, W - layout.SQ - 30);
        const addMainY = lastMain.y + lastMain.h / 2;
        canvas.appendChild(_makeAddBtn(addMainX, addMainY, 'add additional\nmain', () => addMain()));
    } else {
        // Empty page — center button
        canvas.appendChild(_makeAddBtn(W / 2, H / 2, 'add main\ncontent', () => addMain()));
    }

    vp.appendChild(canvas);
}

/* ── Render helpers ── */

/** TL: Chapter name + Page name (labels) + edit buttons */
function _renderNavTL(canvas, rect, chName, pgName) {
    const el = document.createElement('div');
    el.className = 'admin-nav';
    el.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;`;

    const l1 = document.createElement('span'); l1.className = 'nav-label'; l1.textContent = chName;
    const l2 = document.createElement('span'); l2.className = 'nav-label'; l2.textContent = pgName;
    el.appendChild(l1);
    el.appendChild(l2);
    el.appendChild(_makeNavAddBtn('chapter name', () => editChapterName()));
    el.appendChild(_makeNavAddBtn('page name', () => editPageName()));
    canvas.appendChild(el);
}

/** TR: + add chapter */
function _renderNavTR(canvas, rect) {
    const el = document.createElement('div');
    el.className = 'admin-nav';
    el.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;`;
    el.appendChild(_makeNavAddBtn('chapter', () => addChapter()));
    canvas.appendChild(el);
}

/** BL: + add page  +  + add section */
function _renderNavBL(canvas, rect) {
    const el = document.createElement('div');
    el.className = 'admin-nav';
    el.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;`;
    el.appendChild(_makeNavAddBtn('page', () => addPage()));
    el.appendChild(_makeNavAddBtn('section', () => addSection()));
    canvas.appendChild(el);
}

/** BR: just "0fun" text */
function _renderNavBR(canvas, rect) {
    const el = document.createElement('div');
    el.className = 'admin-nav corner-br';
    el.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;`;
    el.textContent = '0fun';
    canvas.appendChild(el);
}

/** Creates a plain + button for inside nav quads */
function _makeNavAddBtn(label, onclick) {
    const btn = document.createElement('button');
    btn.className = 'nav-add-btn';
    btn.innerHTML = '+';
    btn.onclick = (e) => { e.stopPropagation(); onclick(); };
    const lbl = document.createElement('span');
    lbl.className = 'nav-btn-label';
    lbl.textContent = label;
    btn.appendChild(lbl);
    return btn;
}

function _makeSlot(type, rect, nodeData) {
    const el = document.createElement('div');
    el.className = 'admin-slot';
    el.dataset.type = type;
    el.style.cssText = `left:${rect.x}px;top:${rect.y}px;width:${rect.w}px;height:${rect.h}px;`;

    const nodeType = nodeData ? (nodeData.type || 'image') : null;
    const imageUrl = nodeData ? (nodeData.image || null) : null;

    if (imageUrl) {
        const img = document.createElement('img');
        img.className = 'thumb';
        img.src = imageUrl;
        img.loading = 'lazy';
        el.appendChild(img);
    } else if (nodeType === 'text') {
        const txt = document.createElement('div');
        txt.className = 'text-preview';
        txt.textContent = nodeData.title || nodeData.text || 'Text';
        el.appendChild(txt);
    }

    // Edit / Delete buttons
    if (nodeData) {
        const actions = document.createElement('div');
        actions.className = 'slot-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'slot-action edit';
        editBtn.textContent = '✎';
        editBtn.title = 'Bearbeiten';
        editBtn.onclick = (e) => { e.stopPropagation(); editSlot(type, nodeData); };
        actions.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'slot-action delete';
        delBtn.textContent = '✕';
        delBtn.title = 'Löschen';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteSlot(type, nodeData); };
        actions.appendChild(delBtn);

        el.appendChild(actions);
    }

    return el;
}

function _makeAddBtn(cx, cy, label, onclick) {
    const wrap = document.createElement('div');
    wrap.className = 'add-btn';
    wrap.style.left = (cx - 22) + 'px';
    wrap.style.top = (cy - 22) + 'px';
    wrap.textContent = '+';
    wrap.onclick = onclick;

    const lbl = document.createElement('span');
    lbl.className = 'btn-label';
    lbl.textContent = label;
    wrap.appendChild(lbl);

    return wrap;
}

/* ═══════════════════════════════════════════════════════════════
   BUILD LAYOUT CONFIG (mirrors grid.js _buildLayoutConfig)
   ═══════════════════════════════════════════════════════════════ */
function _buildNodes(page, chIdx, pgIdx) {
    // Minimal node objects for layout computation
    const nodes = [];
    for (let m = 0; m < page.length; m++) {
        const entry = page[m];
        const node = {
            id:       entry.id || `ch${chIdx}-p${pgIdx}-m${m}`,
            type:     entry.type || 'image',
            image:    entry.type === 'image' ? entry.url : undefined,
            video:    entry.type === 'video' ? entry.url : undefined,
            title:    entry.title || '',
            text:     entry.text || '',
            aspect:   entry.aspect,
            fill:     !!entry.fill,
            pets:     entry.pets || [],
            children: [],
            netzTexts: entry.netzTexts || [],
            _entryRef: entry,  // keep reference for editing
        };

        const subs = entry.subs || [];
        for (let s = 0; s < subs.length; s++) {
            const sub = subs[s];
            node.children.push({
                id:     sub.id || `${node.id}-sub${s}`,
                type:   sub.type || 'image',
                image:  sub.type === 'image' ? sub.url : undefined,
                video:  sub.type === 'video' ? sub.url : undefined,
                title:  sub.title || '',
                text:   sub.text || '',
                aspect: sub.aspect,
                b2b:    !!sub.b2b,
                fill:   !!sub.fill,
                pets:   sub.pets || [],
                _entryRef: sub,
            });
        }

        nodes.push(node);
    }
    return nodes;
}

function _getSections(chIdx, pgIdx, mainCount) {
    const ch = S.lib[chIdx];
    if (ch && ch.pageSections && ch.pageSections[pgIdx]) {
        return ch.pageSections[pgIdx];
    }
    const sections = [];
    for (let i = 0; i < mainCount; i++) sections.push({ mainCount: 1 });
    return sections;
}

function _buildLayoutConfig(nodes, sections) {
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

        subsPerMain.push(children.length);
        mainAspects.push(node.aspect || LAYOUT_CONST.MAIN_ASPECT);
        mainFills.push(!!node.fill);

        const sAsp = [], sB2bArr = [], sFill = [];
        const mainPets = node.pets || [];
        petsPerMain.push(mainPets.length);
        mainPets.forEach(p => petData.push(p));

        for (let si = 0; si < children.length; si++) {
            const sub = children[si];
            sAsp.push(sub.aspect || LAYOUT_CONST.SUB_ASPECT);
            sB2bArr.push(!!sub.b2b);
            sFill.push(!!sub.fill);
            const subPets = sub.pets || [];
            petsPerSub.push(subPets.length);
            subPets.forEach(p => petData.push(p));
        }
        subAspects.push(sAsp);
        subB2b.push(sB2bArr);
        subFills.push(sFill);
    }

    const cfg = { mainCount, subsPerMain, petsPerMain, petsPerSub, petData,
                  mainAspects, subAspects, subB2b, mainFills, subFills };
    if (sections && sections.length > 1) cfg.sections = sections;
    return cfg;
}

/* ═══════════════════════════════════════════════════════════════
   CONTENT ACTIONS — Add / Edit / Delete
   ═══════════════════════════════════════════════════════════════ */

/* ── Add Main ── */
function addMain() {
    openUploadDialog('Neuen Main hinzufügen', (result) => {
        const page = S.lib[S.ch].pages[S.pg];
        page.push(result);
        _updatePageSections();
        markDirty();
        render();
    });
}

/* ── Add Sub ── */
function addSub(mainIdx) {
    openUploadDialog('Neuen Sub hinzufügen', (result) => {
        const entry = S.lib[S.ch].pages[S.pg][mainIdx];
        if (!entry.subs) entry.subs = [];
        entry.subs.push(result);
        markDirty();
        render();
    });
}

/* ── Add B2B Sub (side-by-side with previous) ── */
function addB2bSub(mainIdx, afterSubIdx) {
    openUploadDialog('B2B Sub hinzufügen (side-by-side)', (result) => {
        result.b2b = true;
        const entry = S.lib[S.ch].pages[S.pg][mainIdx];
        if (!entry.subs) entry.subs = [];
        entry.subs.splice(afterSubIdx + 1, 0, result);
        markDirty();
        render();
    });
}

/* ── Add Pet to Main ── */
function addPet(mainIdx) {
    openUploadDialog('Pet für Main hinzufügen', (result) => {
        const entry = S.lib[S.ch].pages[S.pg][mainIdx];
        if (!entry.pets) entry.pets = [];
        entry.pets.push(result);
        markDirty();
        render();
    });
}

/* ── Add Pet to Sub ── */
function addSubPet(mainIdx, subIdx) {
    openUploadDialog('Pet für Sub hinzufügen', (result) => {
        const entry = S.lib[S.ch].pages[S.pg][mainIdx];
        if (!entry.subs || !entry.subs[subIdx]) return;
        const sub = entry.subs[subIdx];
        if (!sub.pets) sub.pets = [];
        sub.pets.push(result);
        markDirty();
        render();
    });
}

/* ── Add NetzText ── */
function addNetzText() {
    openDialog('NetzText hinzufügen', `
        <select id="dlg-netz-pos">
            <option value="above-main">above-main</option>
            <option value="below-main">below-main</option>
            <option value="above-sub-0">above-sub-0</option>
            <option value="below-sub-0">below-sub-0</option>
            <option value="left-of-main">left-of-main</option>
            <option value="right-of-main">right-of-main</option>
        </select>
        <label style="color:#888;font-size:12px">Für welchen Main-Index (0-basiert)?</label>
        <input id="dlg-netz-main" type="number" value="0" min="0">
        <textarea id="dlg-netz-text" placeholder="Text…"></textarea>
    `, () => {
        const pos = document.getElementById('dlg-netz-pos').value;
        const mi = parseInt(document.getElementById('dlg-netz-main').value) || 0;
        const text = document.getElementById('dlg-netz-text').value.trim();
        if (!text) return;

        const entry = S.lib[S.ch].pages[S.pg][mi];
        if (!entry) return;
        if (!entry.netzTexts) entry.netzTexts = [];
        entry.netzTexts.push({ position: pos, text });
        markDirty();
        render();
        closeDialog();
    });
}

/* ── Edit Chapter Name ── */
function editChapterName() {
    const ch = S.lib[S.ch];
    if (!ch) return;
    openDialog('Kapitelname ändern', `
        <input id="dlg-ch-name" placeholder="Kapitelname" value="${_esc(ch.name)}" autofocus>
    `, () => {
        const name = document.getElementById('dlg-ch-name').value.trim();
        if (!name) return;
        ch.name = name;
        populateChapters();
        markDirty();
        render();
        closeDialog();
    });
}

/* ── Edit Page Name ── */
function editPageName() {
    const ch = S.lib[S.ch];
    if (!ch) return;
    const currentName = (ch.pageNames && ch.pageNames[S.pg]) || '';
    openDialog('Seitenname ändern', `
        <input id="dlg-pg-name" placeholder="Seitenname" value="${_esc(currentName)}" autofocus>
    `, () => {
        const name = document.getElementById('dlg-pg-name').value.trim();
        if (!name) return;
        if (!ch.pageNames) ch.pageNames = [];
        ch.pageNames[S.pg] = name;
        populatePages();
        markDirty();
        render();
        closeDialog();
    });
}

/* ── Add Chapter ── */
function addChapter() {
    openDialog('Neues Kapitel', `
        <input id="dlg-ch-name" placeholder="Kapitelname" autofocus>
    `, () => {
        const name = document.getElementById('dlg-ch-name').value.trim();
        if (!name) return;
        S.lib.push({
            name,
            pageNames: ['intro'],
            pages: [[]]
        });
        S.ch = S.lib.length - 1;
        S.pg = 0;
        populateChapters();
        populatePages();
        markDirty();
        render();
        closeDialog();
    });
}

/* ── Add Page ── */
function addPage() {
    const ch = S.lib[S.ch];
    if (!ch) return;
    openDialog('Neue Seite', `
        <input id="dlg-pg-name" placeholder="Seitenname (optional)">
    `, () => {
        const name = document.getElementById('dlg-pg-name').value.trim() || `Seite ${ch.pages.length}`;
        ch.pages.push([]);
        if (!ch.pageNames) ch.pageNames = [];
        ch.pageNames.push(name);
        S.pg = ch.pages.length - 1;
        populatePages();
        markDirty();
        render();
        closeDialog();
    });
}

/* ── Add Section ── */
function addSection() {
    const ch = S.lib[S.ch];
    if (!ch) return;
    if (!ch.pageSections) ch.pageSections = {};
    const existing = ch.pageSections[S.pg] || [{ mainCount: ch.pages[S.pg].length }];
    // Add a new section with mainCount 0 (user will add mains into it)
    existing.push({ mainCount: 0 });
    ch.pageSections[S.pg] = existing;
    markDirty();
    render();
}

/* ── Edit Slot ── */
function editSlot(type, nodeData) {
    const entry = nodeData._entryRef;
    if (!entry) return;

    if (entry.type === 'text' || (!entry.url && !entry.type)) {
        openDialog('Text bearbeiten', `
            <input id="dlg-edit-title" placeholder="Titel" value="${_esc(entry.title || '')}">
            <textarea id="dlg-edit-text" placeholder="Text…">${_esc(entry.text || '')}</textarea>
        `, () => {
            entry.type = 'text';
            entry.title = document.getElementById('dlg-edit-title').value;
            entry.text = document.getElementById('dlg-edit-text').value;
            markDirty();
            render();
            closeDialog();
        });
    } else {
        // Replace image/video
        openUploadDialog('Inhalt ersetzen', (result) => {
            entry.type = result.type;
            entry.url = result.url;
            if (result.aspect) entry.aspect = result.aspect;
            markDirty();
            render();
        });
    }
}

/* ── Delete Slot ── */
function deleteSlot(type, nodeData) {
    if (!confirm('Diesen Inhalt wirklich löschen?')) return;

    const page = S.lib[S.ch].pages[S.pg];
    const entry = nodeData._entryRef;

    if (type === 'main') {
        const idx = page.indexOf(entry);
        if (idx >= 0) page.splice(idx, 1);
        _updatePageSections();
    } else if (type === 'sub') {
        // Find the parent main that contains this sub
        for (const main of page) {
            if (main.subs) {
                const si = main.subs.indexOf(entry);
                if (si >= 0) { main.subs.splice(si, 1); break; }
            }
        }
    }

    markDirty();
    render();
}

/* Helper: after adding/removing mains, update pageSections.
   New mains stay in the LAST section — the user manually adds sections. */
function _updatePageSections() {
    const ch = S.lib[S.ch];
    const mainCount = ch.pages[S.pg].length;

    if (!ch.pageSections) ch.pageSections = {};

    if (!ch.pageSections[S.pg]) {
        // No sections defined yet → put ALL mains in ONE section
        ch.pageSections[S.pg] = [{ mainCount }];
    } else {
        // Recalc: sum of mainCounts should equal new mainCount
        const secs = ch.pageSections[S.pg];
        const total = secs.reduce((a, s) => a + s.mainCount, 0);
        if (total !== mainCount) {
            // Put extra main in last section (user adds sections manually)
            const diff = mainCount - total;
            secs[secs.length - 1].mainCount += diff;
            if (secs[secs.length - 1].mainCount <= 0) {
                secs.pop();
            }
        }
    }
}

/* ═══════════════════════════════════════════════════════════════
   DIALOGS
   ═══════════════════════════════════════════════════════════════ */
function openDialog(title, bodyHtml, onOk) {
    $('dialog-title').textContent = title;
    $('dialog-body').innerHTML = bodyHtml;
    $('dialog-ok').onclick = onOk;
    $('dialog-overlay').hidden = false;
}

function closeDialog() {
    $('dialog-overlay').hidden = true;
    $('dialog-body').innerHTML = '';
}

function _esc(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* ── Upload Dialog (image or text) ── */
function openUploadDialog(title, onDone) {
    let selectedFile = null;
    let selectedType = 'image';

    openDialog(title, `
        <div class="drop-zone" id="dlg-dropzone">
            Datei hierher ziehen oder klicken<br>
            <small>(Bild, Video oder „Text" unten wählen)</small>
            <input type="file" id="dlg-file" accept="image/*,video/*" style="display:none">
        </div>
        <div class="progress-bar" id="dlg-progress" style="display:none"><div class="fill" id="dlg-progress-fill"></div></div>
        <div style="margin-top:12px">
            <label style="color:#888;font-size:12px">Oder als Text-Node:</label>
            <input id="dlg-text-title" placeholder="Titel (optional)">
            <textarea id="dlg-text-body" placeholder="Text…"></textarea>
        </div>
    `, async () => {
        if (selectedFile) {
            try {
                $('dialog-ok').disabled = true;
                $('dialog-ok').textContent = 'Uploading…';
                const url = await uploadFile(selectedFile);
                const result = { type: selectedType, url };
                closeDialog();
                onDone(result);
            } catch (err) {
                console.error('[CMS] Upload error object:', err);
                const msg = (err instanceof Error) ? err.message
                          : (typeof err === 'string') ? err
                          : JSON.stringify(err);
                alert('Upload fehlgeschlagen: ' + msg);
                $('dialog-ok').disabled = false;
                $('dialog-ok').textContent = 'OK';
            }
        } else {
            const t = document.getElementById('dlg-text-title').value.trim();
            const b = document.getElementById('dlg-text-body').value.trim();
            if (!t && !b) { alert('Bitte Datei oder Text angeben'); return; }
            closeDialog();
            onDone({ type: 'text', title: t, text: b });
        }
    });

    // Wire drop zone + file input
    requestAnimationFrame(() => {
        const dz = document.getElementById('dlg-dropzone');
        const fi = document.getElementById('dlg-file');
        if (!dz || !fi) return;

        dz.onclick = () => fi.click();
        dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('over'); };
        dz.ondragleave = () => dz.classList.remove('over');
        dz.ondrop = (e) => {
            e.preventDefault();
            dz.classList.remove('over');
            if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0], dz);
        };
        fi.onchange = () => { if (fi.files[0]) handleFileSelect(fi.files[0], dz); };
    });

    function handleFileSelect(file, dz) {
        selectedFile = file;
        selectedType = file.type.startsWith('video') ? 'video' : 'image';
        dz.innerHTML = `<strong>${file.name}</strong><br><small>${(file.size / 1024).toFixed(0)} KB — ${selectedType}</small>`;
        // No preview image — Safari cannot read OneDrive files via JS APIs
    }
}

/* ═══════════════════════════════════════════════════════════════
   UPLOAD — S3 via API
   ═══════════════════════════════════════════════════════════════ */

/** Web-compatible image types (no conversion needed) */
const WEB_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);

/**
 * Convert non-web image formats (TIFF, BMP, HEIC…) to JPEG via Canvas.
 * Also compresses large JPEGs/PNGs.
 * Gracefully falls back to original file if conversion fails (e.g. OneDrive sandbox).
 */
async function _convertImageIfNeeded(file) {
    // Skip non-images and SVGs
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        return { blob: file, name: file.name, converted: false };
    }
    // Skip small web-compatible images (no conversion needed)
    if (WEB_IMAGE_TYPES.has(file.type) && file.size < 2 * 1024 * 1024) {
        return { blob: file, name: file.name, converted: false };
    }

    // Try conversion — may fail on OneDrive files (Safari sandbox)
    try {
        const blobUrl = URL.createObjectURL(file);
        try {
            const img = await new Promise((resolve, reject) => {
                const i = new Image();
                i.onload = () => resolve(i);
                i.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
                i.src = blobUrl;
            });

            const MAX_DIM = 2048;
            let { width, height } = img;
            if (width > MAX_DIM || height > MAX_DIM) {
                const scale = MAX_DIM / Math.max(width, height);
                width = Math.round(width * scale);
                height = Math.round(height * scale);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);

            const jpegBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.85));
            const baseName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
            console.log(`[CMS] Converted ${file.name} (${(file.size/1024).toFixed(0)} KB ${file.type}) → ${baseName} (${(jpegBlob.size/1024).toFixed(0)} KB JPEG)`);
            return { blob: jpegBlob, name: baseName, converted: true };
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    } catch (convErr) {
        // Conversion failed (OneDrive sandbox, etc.) — upload raw file
        console.warn('[CMS] Image conversion failed, uploading original:', convErr.message);
        return { blob: file, name: file.name, converted: false };
    }
}

/**
 * Compress video via Canvas + MediaRecorder (webm output).
 * Falls back to original if browser doesn't support it or file is from OneDrive.
 */
async function _convertVideoIfNeeded(file) {
    if (!file.type.startsWith('video/')) {
        return { blob: file, name: file.name, converted: false };
    }
    // Only try to convert if > 4 MB
    if (file.size < 4 * 1024 * 1024) {
        return { blob: file, name: file.name, converted: false };
    }

    try {
        const blobUrl = URL.createObjectURL(file);
        try {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.src = blobUrl;

            await new Promise((resolve, reject) => {
                video.onloadedmetadata = resolve;
                video.onerror = () => reject(new Error('Video konnte nicht geladen werden'));
                setTimeout(() => reject(new Error('Video laden Timeout')), 10000);
            });

            // Cap to 1080p
            const MAX_DIM = 1080;
            let { videoWidth: w, videoHeight: h } = video;
            if (Math.max(w, h) > MAX_DIM) {
                const scale = MAX_DIM / Math.max(w, h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
            }

            // Check if MediaRecorder supports webm
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : MediaRecorder.isTypeSupported('video/webm')
                    ? 'video/webm'
                    : null;
            if (!mimeType) {
                console.log('[CMS] MediaRecorder not supported, uploading original video');
                return { blob: file, name: file.name, converted: false };
            }

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            const stream = canvas.captureStream(24);
            const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1500000 });
            const chunks = [];
            recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

            const done = new Promise(resolve => { recorder.onstop = resolve; });
            recorder.start(100);
            video.currentTime = 0;
            await video.play();

            // Draw frames until video ends
            const drawFrame = () => {
                if (video.ended || video.paused) { recorder.stop(); return; }
                ctx.drawImage(video, 0, 0, w, h);
                requestAnimationFrame(drawFrame);
            };
            drawFrame();

            await new Promise(resolve => { video.onended = resolve; });
            recorder.stop();
            await done;

            const webmBlob = new Blob(chunks, { type: mimeType });
            const baseName = file.name.replace(/\.[^.]+$/, '') + '.webm';
            console.log(`[CMS] Converted ${file.name} (${(file.size/1024).toFixed(0)} KB) → ${baseName} (${(webmBlob.size/1024).toFixed(0)} KB webm)`);
            // Only use converted if it's actually smaller
            if (webmBlob.size < file.size * 0.9) {
                return { blob: webmBlob, name: baseName, converted: true };
            }
            console.log('[CMS] Converted video not smaller, using original');
            return { blob: file, name: file.name, converted: false };
        } finally {
            URL.revokeObjectURL(blobUrl);
        }
    } catch (convErr) {
        console.warn('[CMS] Video conversion failed, uploading original:', convErr.message);
        return { blob: file, name: file.name, converted: false };
    }
}

async function uploadFile(file) {
    // Convert images (TIFF/BMP/HEIC/large → JPEG) or videos (large → webm)
    let uploadBlob, uploadName, converted;
    if (file.type.startsWith('video/')) {
        ({ blob: uploadBlob, name: uploadName, converted } = await _convertVideoIfNeeded(file));
    } else {
        ({ blob: uploadBlob, name: uploadName, converted } = await _convertImageIfNeeded(file));
    }

    const ch = S.lib[S.ch];
    const chName = _slug(ch.name);
    const pgName = _slug((ch.pageNames && ch.pageNames[S.pg]) || `page${S.pg}`);
    const secIdx = 0;  // TODO: determine current section
    const fileName = _slug(uploadName);
    const key = `dateien_website/content/${chName}/${pgName}/${secIdx}/${fileName}`;
    const contentType = uploadBlob.type || 'application/octet-stream';

    // Scaleway body limit = 6MB. Raw binary is most efficient.
    const MAX_SIZE = 5 * 1024 * 1024;  // 5 MB

    if (uploadBlob.size > MAX_SIZE) {
        throw new Error(`Datei zu groß (${(uploadBlob.size / 1024 / 1024).toFixed(1)} MB). Maximum: 5 MB. Bitte Bild verkleinern.`);
    }

    // Update dialog button to show progress
    const okBtn = $('dialog-ok');
    if (converted) {
        okBtn.textContent = `Konvertiert → ${(uploadBlob.size/1024).toFixed(0)} KB`;
        await new Promise(r => setTimeout(r, 500));  // brief display
    }

    // ── Upload via XMLHttpRequest + FormData ──
    // FormData uses the browser's native multipart encoder, which bypasses
    // Safari's OneDrive sandbox restriction (raw File body streaming fails).
    const uploadUrl = API_BASE + '/upload?key=' + encodeURIComponent(key) + '&ct=' + encodeURIComponent(contentType);

    const formData = new FormData();
    formData.append('file', uploadBlob, uploadName);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${S.token}`);
        xhr.setRequestHeader('X-Admin-Token', S.token);
        // Do NOT set Content-Type — browser sets multipart/form-data + boundary

        // ── Progress bar ──
        const progressBar = document.getElementById('dlg-progress');
        const progressFill = document.getElementById('dlg-progress-fill');
        if (progressBar) progressBar.style.display = 'block';

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && progressFill) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = pct + '%';
                if (okBtn) okBtn.textContent = `Uploading… ${pct}%`;
            }
        };

        xhr.onload = () => {
            if (okBtn) okBtn.textContent = 'Verarbeite…';
            let data;
            try { data = JSON.parse(xhr.responseText); }
            catch (e) { return reject(new Error(`Server antwortete mit Status ${xhr.status} (kein JSON)`)); }
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(data.url);
            } else {
                reject(new Error(data.error || `Upload fehlgeschlagen (${xhr.status})`));
            }
        };
        xhr.onerror = () => reject(new Error('Netzwerkfehler — API nicht erreichbar.'));
        xhr.ontimeout = () => reject(new Error('Upload Timeout — bitte nochmal versuchen.'));
        xhr.timeout = 120000;  // 120 sec

        xhr.send(formData);  // FormData → native multipart encoder (bypasses OneDrive sandbox)
    });
}

function _slug(str) {
    return str.toLowerCase()
        .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function _authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${S.token}`,
        'X-Admin-Token': S.token,
    };
}

/* ═══════════════════════════════════════════════════════════════
   PUBLISH — Serialize LIBRARY → Commit to GitHub
   ═══════════════════════════════════════════════════════════════ */
async function doPublish() {
    if (!S.dirty) return;
    if (!confirm('LIBRARY auf GitHub veröffentlichen?')) return;

    $('btn-publish').disabled = true;
    $('status').textContent = 'Publishing…';
    $('status').style.color = '#2bffdf';

    try {
        const content = serializeLibraryJs();
        let res, data;
        try {
            res = await fetch(API_BASE + '/commit', {
                method: 'POST',
                headers: _authHeaders(),
                body: JSON.stringify({
                    content,
                    message: `[CMS] Update library.js — ${new Date().toISOString().slice(0, 16)}`,
                }),
            });
        } catch (networkErr) {
            throw new Error('Netzwerkfehler — API nicht erreichbar');
        }
        try {
            data = await res.json();
        } catch (jsonErr) {
            throw new Error(`Server antwortete mit Status ${res.status} (kein JSON)`);
        }
        if (!res.ok) throw new Error(data.error || `Commit fehlgeschlagen (${res.status})`);

        S.dirty = false;
        $('status').textContent = '✓ Published — ' + data.sha.slice(0, 7);
        $('status').style.color = '#2bffdf';
    } catch (err) {
        $('status').textContent = '✕ Publish failed: ' + err.message;
        $('status').style.color = '#ff4444';
        $('btn-publish').disabled = false;
    }
}

/* ═══════════════════════════════════════════════════════════════
   DEPLOY SITE — Push all static site files to GitHub Pages
   
   Reads local files via fetch(), then sends them to the /deploy
   endpoint which commits them atomically via GitHub Git Trees API.
   This does NOT include library.js (use Publish for that).
   ═══════════════════════════════════════════════════════════════ */

/** Files to deploy (relative to website6.2/ locally → path in GitHub repo) */
const DEPLOY_FILES = [
    // website6.2 core
    { local: 'index.html',  repo: 'website6.2/index.html' },
    { local: 'app.js',      repo: 'website6.2/app.js' },
    { local: 'grid.js',     repo: 'website6.2/grid.js' },
    { local: 'layout.js',   repo: 'website6.2/layout.js' },
    { local: 'style.css',   repo: 'website6.2/style.css' },
    // admin
    { local: 'admin.html',  repo: 'website6.2/admin.html' },
    { local: 'admin.js',    repo: 'website6.2/admin.js' },
    { local: 'admin.css',   repo: 'website6.2/admin.css' },
    // GSAP vendor (shared with old site)
    { local: '../content/js/vendor/gsap-core.js',  repo: 'content/js/vendor/gsap-core.js' },
    { local: '../content/js/vendor/CSSPlugin.js',  repo: 'content/js/vendor/CSSPlugin.js' },
    { local: '../content/js/vendor/Observer.js',    repo: 'content/js/vendor/Observer.js' },
];

async function deploySite() {
    if (!confirm('Alle Site-Dateien auf GitHub deployen?\n\n' +
        DEPLOY_FILES.map(f => f.repo).join('\n'))) return;

    const btn = $('btn-deploy');
    btn.disabled = true;
    $('status').textContent = 'Reading files…';
    $('status').style.color = '#2bffdf';

    try {
        // 1) Read all local files via fetch
        const files = [];
        for (let i = 0; i < DEPLOY_FILES.length; i++) {
            const df = DEPLOY_FILES[i];
            $('status').textContent = `Reading ${i + 1}/${DEPLOY_FILES.length}…`;
            try {
                const resp = await fetch(df.local + '?_=' + Date.now());
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const content = await resp.text();
                files.push({ path: df.repo, content });
            } catch (e) {
                throw new Error(`Konnte ${df.local} nicht laden: ${e.message}`);
            }
        }

        // 2) Also include current library.js (serialize from memory)
        $('status').textContent = 'Deploying…';
        const libContent = serializeLibraryJs();
        files.push({ path: 'website6.2/library.js', content: libContent });

        // 3) Root redirect: 0fun.online → /website6.2/
        files.push({ path: 'index.html', content: '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/website6.2/"></head><body></body></html>\n' });
        // Keep CNAME so custom domain stays active
        files.push({ path: 'CNAME', content: '0fun.online\n' });

        // 4) Send to /deploy endpoint
        let res, data;
        try {
            res = await fetch(API_BASE + '/deploy', {
                method: 'POST',
                headers: _authHeaders(),
                body: JSON.stringify({
                    files,
                    message: `[CMS] Deploy site — ${new Date().toISOString().slice(0, 16)}`,
                }),
            });
        } catch (networkErr) {
            throw new Error('Netzwerkfehler — API nicht erreichbar');
        }
        try {
            data = await res.json();
        } catch (jsonErr) {
            throw new Error(`Server antwortete mit Status ${res.status} (kein JSON)`);
        }
        if (!res.ok) throw new Error(data.error || `Deploy fehlgeschlagen (${res.status})`);

        S.dirty = false;
        $('status').textContent = `✓ Deployed ${data.filesDeployed} files — ${data.sha.slice(0, 7)}`;
        $('status').style.color = '#2bffdf';
    } catch (err) {
        $('status').textContent = '✕ Deploy failed: ' + err.message;
        $('status').style.color = '#ff4444';
    } finally {
        btn.disabled = false;
    }
}

/* ═══════════════════════════════════════════════════════════════
   SERIALIZE — Generate complete library.js source code
   
   Strategy: Keep all non-LIBRARY parts as a template.
   Only the LIBRARY array is dynamically generated from S.lib.
   The static header (COLOR_PALETTES, TYPO_PRESETS, etc.) is
   fetched from the current library.js source and preserved.
   ═══════════════════════════════════════════════════════════════ */
function serializeLibraryJs() {
    // Fetch current library.js text synchronously (it's already loaded as module)
    // We re-fetch the raw text to preserve the header/footer exactly.
    // Fallback: generate from imported values if fetch fails.
    return _generateFullSource();
}

function _generateFullSource() {
    // ── Static header (preserved exactly) ──
    const header = `/* ============================================
   LIBRARY – Zentrale Content-Datenbank (website6.1)
   ============================================

   Hierarchische Struktur:
   LIBRARY[kapitel].pages[seite][mainNode].subs[subNode]

   Kapitel-Felder: name, pages, pageNames, pageSections
   Main-Node-Felder: type, url, color (legacy, unused), subs (optional)
   Sub-Node-Felder: type, url/title/text, color (optional)

   ============================================ */

/* ═══════════════════════════════════════════════════════════════
   FARBPALETTEN — zentrale Stelle für ALLE Farben
   Eine aktive Palette steuert sämtliche UI-Elemente.

   60 % = primary   (Netz-Quads, Main/Sub-Hintergründe, Landing-Banner)
   30 % = secondary (Nav-Quadranten-Hintergrund, Loading-Tiles)
   10 % = accent    (Highlights, NetzText)
   surface     = Seitenhintergrund (body, chapter-container)
   onSurface   = Text auf surface
   onPrimary   = Text/Icons auf primary-Flächen
   onSecondary = Text/Icons auf secondary-Flächen
   ═══════════════════════════════════════════════════════════════ */
export var COLOR_PALETTES = ${JSON.stringify(COLOR_PALETTES, null, 4)};

/** Index der aktiven Palette (0-basiert). Ändere nur diesen Wert. */
export var activePaletteIndex = ${activePaletteIndex};

/** Gibt die aktuell aktive Palette zurück. */
export function getActivePalette() {
    return COLOR_PALETTES[activePaletteIndex] || COLOR_PALETTES[0];
}

/* ═══════════════════════════════════════════════════════════════
   TYPOGRAFIE — zentrale Stelle für Schrift-Schnitte
   ═══════════════════════════════════════════════════════════════ */
export var TYPO_PRESETS = ${JSON.stringify(TYPO_PRESETS, null, 4)};

/** Index des aktiven Typo-Presets (0-basiert). */
export var activeTypoIndex = ${activeTypoIndex};

/** Gibt das aktuell aktive Typo-Preset zurück. */
export function getActiveTypo() {
    return TYPO_PRESETS[activeTypoIndex] || TYPO_PRESETS[0];
}

/**
 * applyTheme() — schreibt alle Design-Tokens als CSS Custom Properties
 * auf :root. Einmal bei init() aufrufen; bei Palette-/Typo-Wechsel
 * erneut aufrufen, fertig.
 */
export function applyTheme() {
    var pal  = getActivePalette();
    var typo = getActiveTypo();
    var root = document.documentElement.style;

    // ── Farben ──
    root.setProperty('--color-primary',     pal.primary);
    root.setProperty('--color-secondary',   pal.secondary);
    root.setProperty('--color-accent',      pal.accent);
    root.setProperty('--color-surface',     pal.surface);
    root.setProperty('--color-onSurface',   pal.onSurface);
    root.setProperty('--color-onPrimary',   pal.onPrimary);
    root.setProperty('--color-onSecondary', pal.onSecondary);

    // ── Typografie ──
    root.setProperty('--font-family', typo.family);
    var h = typo.cuts[typo.headline] || typo.cuts.bold;
    var b = typo.cuts[typo.body]     || typo.cuts.normal;
    root.setProperty('--weight-headline', h.weight);
    root.setProperty('--style-headline',  h.style);
    root.setProperty('--weight-body',     b.weight);
    root.setProperty('--style-body',      b.style);
}

/* Nav-Quadranten: '2d' = Canvas-Fill-Box | '3d' = 3D-Letter-System */
export var NAV_TEXT_MODE = '${NAV_TEXT_MODE}';

// __LIBRARY_START__
export var LIBRARY = `;

    // ── LIBRARY array ──
    const libStr = _serializeLibrary(S.lib);

    // ── Static footer (helper functions) ──
    const footer = `;
// __LIBRARY_END__


/* ============================================
   BUILDER-FUNKTIONEN
   Interface bleibt gleich – nur die Implementierung liest
   jetzt aus der hierarchischen Struktur statt aus flachen Keys.
   ============================================ */

/** Anzahl Kapitel */
export function getChapterCount() {
    return LIBRARY.length;
}

/** Zaehlt die Seiten eines Kapitels. */
export function getPageCount(chapterIdx) {
    var ch = LIBRARY[chapterIdx];
    return ch ? ch.pages.length : 0;
}

/**
 * Returns the first image URL from a page, for use as nav thumbnail.
 * Falls back to null if no image found.
 */
export function getPageThumbnail(chapterIdx, pageIdx) {
    var ch = LIBRARY[chapterIdx];
    if (!ch || pageIdx >= ch.pages.length) return null;
    var page = ch.pages[pageIdx];
    for (var i = 0; i < page.length; i++) {
        if (page[i].type === 'image' && page[i].url) return page[i].url;
    }
    return null;
}

/**
 * Baut die Main-Nodes fuer eine Seite.
 */
export function getMainNodesForPage(chapterIdx, pageIdx) {
    var ch = LIBRARY[chapterIdx];
    if (!ch || pageIdx >= ch.pages.length) return [];
    var page = ch.pages[pageIdx];
    var defaultColor = ch.color;
    var nodes = [];
    for (var m = 0; m < page.length; m++) {
        var entry = page[m];
        var nodeColor = entry.color || defaultColor;
        var autoId = 'ch' + chapterIdx + '-p' + pageIdx + '-m' + m;
        var node = {
            id: entry.id || autoId, type: entry.type || 'image',
            color: nodeColor, label: entry.label || '',
            connectsTo: entry.connectsTo || [], grid: entry.grid || null,
            pets: [], children: []
        };
        if (entry.aspect != null) node.aspect = entry.aspect;
        if (entry.type === 'image') { node.image = entry.url; }
        else if (entry.type === 'video') { node.video = entry.url; }
        else if (entry.type === 'text') { node.title = entry.title || ''; node.text = entry.text || ''; }
        var mainPets = entry.pets || [];
        for (var p = 0; p < mainPets.length; p++) {
            var mp = mainPets[p];
            var petObj = { id: mp.id || (node.id + '-pet' + p), type: mp.type || 'image',
                image: mp.type === 'image' ? mp.url : undefined,
                video: mp.type === 'video' ? mp.url : undefined,
                title: mp.title || '', text: mp.text || '',
                color: mp.color || nodeColor };
            if (mp.x !== undefined) petObj.x = mp.x;
            if (mp.y !== undefined) petObj.y = mp.y;
            if (mp.scale !== undefined) petObj.scale = mp.scale;
            node.pets.push(petObj);
        }
        node.netzTexts = entry.netzTexts || [];
        var subs = entry.subs || [];
        for (var s = 0; s < subs.length; s++) {
            var sub = subs[s];
            var childId = sub.id || (node.id + '-sub' + s);
            var child = { id: childId, type: sub.type || 'image',
                color: sub.color || nodeColor,
                connectsTo: sub.connectsTo || [], grid: sub.grid || null,
                pets: [], b2b: !!sub.b2b };
            if (sub.aspect != null) child.aspect = sub.aspect;
            if (sub.type === 'image') { child.image = sub.url; }
            else if (sub.type === 'video') { child.video = sub.url; }
            else if (sub.type === 'text') { child.title = sub.title || ''; child.text = sub.text || ''; }
            var childPets = sub.pets || [];
            for (var cp = 0; cp < childPets.length; cp++) {
                var cpet = childPets[cp];
                var cpetObj = { id: cpet.id || (childId + '-pet' + cp), type: cpet.type || 'image',
                    image: cpet.type === 'image' ? cpet.url : undefined,
                    video: cpet.type === 'video' ? cpet.url : undefined,
                    title: cpet.title || '', text: cpet.text || '',
                    color: cpet.color || child.color };
                if (cpet.x !== undefined) cpetObj.x = cpet.x;
                if (cpet.y !== undefined) cpetObj.y = cpet.y;
                if (cpet.scale !== undefined) cpetObj.scale = cpet.scale;
                child.pets.push(cpetObj);
            }
            node.children.push(child);
        }
        nodes.push(node);
    }
    return nodes;
}

/**
 * Returns section definitions for a page.
 */
export function getPageSections(chapterIdx, pageIdx) {
    var ch = LIBRARY[chapterIdx];
    if (!ch) return [{ mainCount: 0 }];
    if (ch.pageSections && ch.pageSections[pageIdx] !== undefined) {
        return ch.pageSections[pageIdx];
    }
    var page = ch.pages[pageIdx];
    var n = page ? page.length : 0;
    var sections = [];
    for (var i = 0; i < n; i++) sections.push({ mainCount: 1 });
    return sections;
}

/** Backward-compatible CHAPTER_DEFS (reads from LIBRARY). */
export var CHAPTER_DEFS = LIBRARY.map(function(ch) {
    return { name: ch.name };
});
`;

    return header + libStr + footer;
}

/* ── Serialize the LIBRARY array as pretty JS ── */
function _serializeLibrary(lib) {
    const lines = ['['];

    for (let ci = 0; ci < lib.length; ci++) {
        const ch = lib[ci];
        lines.push(`    // ===== Kapitel ${ci}: ${ch.name} =====`);
        lines.push('    {');
        lines.push(`        name: ${_q(ch.name)},`);
        if (ch.pageNames) {
            lines.push(`        pageNames: [${ch.pageNames.map(_q).join(', ')}],`);
        }
        if (ch.pageSections && Object.keys(ch.pageSections).length > 0) {
            lines.push('        pageSections: {');
            for (const [pgIdx, secs] of Object.entries(ch.pageSections)) {
                const secsStr = secs.map(s => `{mainCount: ${s.mainCount}}`).join(', ');
                lines.push(`            ${pgIdx}: [${secsStr}],`);
            }
            lines.push('        },');
        }
        lines.push('        pages: [');

        for (let pi = 0; pi < ch.pages.length; pi++) {
            const page = ch.pages[pi];
            const pageName = (ch.pageNames && ch.pageNames[pi]) || `Seite ${pi}`;
            lines.push(`\n            // ── Seite ${pi}: ${pageName} ──`);
            lines.push('            [');

            for (let mi = 0; mi < page.length; mi++) {
                const entry = page[mi];
                lines.push('                ' + _serializeEntry(entry) + (mi < page.length - 1 ? ',' : ''));
            }

            lines.push('            ]' + (pi < ch.pages.length - 1 ? ',' : ''));
        }

        lines.push('        ]');
        lines.push('    }' + (ci < lib.length - 1 ? ',' : ''));
    }

    lines.push(']');
    return lines.join('\n');
}

function _serializeEntry(entry) {
    const parts = [];

    if (entry.type === 'text') {
        parts.push(`type: 'text'`);
        if (entry.title) parts.push(`title: ${_q(entry.title)}`);
        if (entry.text) parts.push(`text: ${_q(entry.text)}`);
    } else if (entry.type === 'video') {
        parts.push(`type: 'video'`);
        parts.push(`url: ${_q(entry.url)}`);
    } else {
        parts.push(`type: 'image'`);
        if (entry.url) parts.push(`url: ${_q(entry.url)}`);
    }

    if (entry.color) parts.push(`color: ${_q(entry.color)}`);
    if (entry.aspect != null) parts.push(`aspect: ${entry.aspect}`);
    if (entry.b2b) parts.push(`b2b: true`);
    if (entry.fill) parts.push(`fill: true`);
    if (entry.label) parts.push(`label: ${_q(entry.label)}`);

    // NetzTexts
    if (entry.netzTexts && entry.netzTexts.length > 0) {
        const nts = entry.netzTexts.map(nt =>
            `{ position: ${_q(nt.position)}, text: ${_q(nt.text)} }`
        ).join(',\n                        ');
        parts.push(`netzTexts: [\n                        ${nts}\n                    ]`);
    }

    // Pets
    if (entry.pets && entry.pets.length > 0) {
        const ps = entry.pets.map(p => {
            const pp = [`type: ${_q(p.type || 'image')}`];
            if (p.url) pp.push(`url: ${_q(p.url)}`);
            if (p.color) pp.push(`color: ${_q(p.color)}`);
            if (p.x !== undefined) pp.push(`x: ${p.x}`);
            if (p.y !== undefined) pp.push(`y: ${p.y}`);
            if (p.scale !== undefined) pp.push(`scale: ${p.scale}`);
            return `{ ${pp.join(', ')} }`;
        }).join(',\n                        ');
        parts.push(`pets: [\n                        ${ps}\n                    ]`);
    }

    // Subs
    if (entry.subs && entry.subs.length > 0) {
        const ss = entry.subs.map(s => _serializeEntry(s)).join(',\n                    ');
        parts.push(`subs: [\n                    ${ss}\n                ]`);
    }

    return `{ ${parts.join(', ')} }`;
}

function _q(str) {
    if (str == null) return "''";
    return "'" + String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
}
