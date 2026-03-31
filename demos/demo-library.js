/* ============================================
   DEMO LIBRARY — Minimal 2-chapter test
   ============================================
   Ch 0: "Alpha" — 2 pages, 1 section each
   Ch 1: "Beta"  — 2 pages, 2 sections each
   ============================================ */

/* ── Color palette (same interface as main library.js) ── */
export var COLOR_PALETTES = [
    { name: 'Demo',  primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' },
];
export var activePaletteIndex = 0;
export function getActivePalette() {
    return COLOR_PALETTES[activePaletteIndex] || COLOR_PALETTES[0];
}

export var NAV_TEXT_MODE = '2d';

/* ── Placeholder image helper ── */
var PH = 'https://picsum.photos/seed/';

export var LIBRARY = [

    // ===== Chapter 0: Alpha — 2 pages, 1 section each =====
    {
        name: 'Alpha', color: '#e94560',
        pageNames: ['landscape', 'portrait'],
        materialSet: [
            { color: '#e94560', roughness: 0.3, metalness: 0.0, clearcoat: 0.5 },
            { color: '#c23152', roughness: 0.5, metalness: 0.1 },
        ],
        pages: [

            // --- Page 0: 3 images, 1 section (default) ---
            [
                { type: 'image', url: PH + 'alpha0a/800/600', color: '#e94560' },
                { type: 'image', url: PH + 'alpha0b/800/600', color: '#c23152' },
                { type: 'image', url: PH + 'alpha0c/800/600', color: '#ff6b6b' },
            ],

            // --- Page 1: 2 images, 1 section (default) ---
            [
                { type: 'image', url: PH + 'alpha1a/600/800', color: '#e94560' },
                { type: 'image', url: PH + 'alpha1b/600/800', color: '#c23152' },
            ],
        ]
    },

    // ===== Chapter 1: Beta — 2 pages, 2 sections each =====
    {
        name: 'Beta', color: '#0f3460',
        pageNames: ['duo A', 'duo B'],
        materialSet: [
            { color: '#0f3460', roughness: 0.2, metalness: 0.1, clearcoat: 0.6 },
            { color: '#533483', roughness: 0.4, metalness: 0.0 },
            { color: '#16213e', roughness: 0.6, metalness: 0.2 },
        ],
        // 2 sections per page: page 0 → [2 mains, 2 mains], page 1 → [1 main, 3 mains]
        pageSections: {
            0: [{ mainCount: 2 }, { mainCount: 2 }],
            1: [{ mainCount: 1 }, { mainCount: 3 }],
        },
        pages: [

            // --- Page 0: 4 images, 2 sections (2+2) ---
            [
                { type: 'image', url: PH + 'beta0a/800/600', color: '#0f3460' },
                { type: 'image', url: PH + 'beta0b/800/600', color: '#533483' },
                { type: 'image', url: PH + 'beta0c/800/600', color: '#16213e' },
                { type: 'image', url: PH + 'beta0d/800/600', color: '#0f3460' },
            ],

            // --- Page 1: 4 images, 2 sections (1+3) ---
            [
                { type: 'image', url: PH + 'beta1a/800/600', color: '#533483' },
                { type: 'image', url: PH + 'beta1b/600/800', color: '#0f3460' },
                { type: 'image', url: PH + 'beta1c/600/800', color: '#16213e' },
                { type: 'image', url: PH + 'beta1d/600/800', color: '#533483' },
            ],
        ]
    },
];

/* ============================================
   BUILDER FUNCTIONS (same interface as library.js)
   ============================================ */

export function getChapterCount() {
    return LIBRARY.length;
}

export function getPageCount(chapterIdx) {
    var ch = LIBRARY[chapterIdx];
    return ch ? ch.pages.length : 0;
}

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
            id:         entry.id || autoId,
            type:       entry.type || 'image',
            color:      nodeColor,
            label:      entry.label || '',
            connectsTo: [],
            grid:       null,
            pets:       [],
            children:   [],
            netzTexts:  [],
        };

        if (entry.type === 'image') node.image = entry.url;
        if (entry.type === 'video') node.video = entry.url;

        /* subs → children */
        if (entry.subs) {
            for (var s = 0; s < entry.subs.length; s++) {
                var sub = entry.subs[s];
                node.children.push({
                    id: autoId + '-s' + s,
                    type: sub.type || 'image',
                    color: sub.color || nodeColor,
                    image: sub.url || null,
                    label: '',
                    pets: [],
                    render3d: sub.render3d || false
                });
            }
        }

        nodes.push(node);
    }
    return nodes;
}

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

/* Functions used by nav.js but not needed for the demo — provide stubs */
export function getPageThumbnail() { return null; }

export var CHAPTER_DEFS = LIBRARY.map(function(ch) {
    return { name: ch.name, color: ch.color };
});

/* Window globals for backward compat */
window.LIBRARY = LIBRARY;
window.NAV_TEXT_MODE = NAV_TEXT_MODE;
window.CHAPTER_DEFS = CHAPTER_DEFS;
window.getChapterCount = getChapterCount;
window.getPageCount = getPageCount;
window.getMainNodesForPage = getMainNodesForPage;
window.getPageThumbnail = getPageThumbnail;
window.getPageSections = getPageSections;
