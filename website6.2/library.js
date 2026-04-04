/* ============================================
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
export var COLOR_PALETTES = [
    {
        "name": "Mint-Rose",
        "primary": "#2bffdf",
        "secondary": "#ec677a",
        "accent": "#00e105",
        "surface": "#111111",
        "onSurface": "#ffffff",
        "onPrimary": "#000000",
        "onSecondary": "#ffffff"
    },
    {
        "name": "Lavender-Fire",
        "primary": "#dad5eb",
        "secondary": "#ff5b00",
        "accent": "#00ffa2",
        "surface": "#111111",
        "onSurface": "#ffffff",
        "onPrimary": "#000000",
        "onSecondary": "#ffffff"
    }
];

/** Index der aktiven Palette (0-basiert). Ändere nur diesen Wert. */
export var activePaletteIndex = 1;

/** Gibt die aktuell aktive Palette zurück. */
export function getActivePalette() {
    return COLOR_PALETTES[activePaletteIndex] || COLOR_PALETTES[0];
}

/* ═══════════════════════════════════════════════════════════════
   TYPOGRAFIE — zentrale Stelle für Schrift-Schnitte
   ═══════════════════════════════════════════════════════════════ */
export var TYPO_PRESETS = [
    {
        "name": "Arial Clean",
        "family": "Arial, Helvetica, sans-serif",
        "cuts": {
            "normal": {
                "weight": 400,
                "style": "normal"
            },
            "italic": {
                "weight": 400,
                "style": "italic"
            },
            "bold": {
                "weight": 700,
                "style": "normal"
            },
            "boldItalic": {
                "weight": 700,
                "style": "italic"
            },
            "black": {
                "weight": 900,
                "style": "normal"
            }
        },
        "headline": "bold",
        "body": "normal"
    }
];

/** Index des aktiven Typo-Presets (0-basiert). */
export var activeTypoIndex = 0;

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
export var NAV_TEXT_MODE = '2d';

// __LIBRARY_START__
export var LIBRARY = [
    // ===== Kapitel 0: David Asche =====
    {
        name: 'David Asche',
        pageSections: {
            0: [{mainCount: 1}],
        },
        pages: [

            // ── Seite 0: Seite 0 ──
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-23%20at%2021.40.23%20(1).jpeg', color: '#E74C3C' }
            ]
        ]
    },
    // ===== Kapitel 1: 0 =====
    {
        name: '0',
        pageNames: ['intro', 'sprints 1', 'sprints 2', 'sprints 3', 'sprints 4', 'sprints 5', 'sprints 6', 'video', 'bild 3', 'bild 4', 'bild 5', 'bild 6', 'bild 7', 'bild 8', 'video 2'],
        pageSections: {
            0: [{mainCount: 9}, {mainCount: 8}],
            1: [{mainCount: 10}, {mainCount: 10}, {mainCount: 10}, {mainCount: 10}],
            2: [{mainCount: 10}, {mainCount: 10}, {mainCount: 10}, {mainCount: 10}],
            3: [{mainCount: 10}, {mainCount: 10}, {mainCount: 10}, {mainCount: 10}],
            4: [{mainCount: 10}, {mainCount: 10}, {mainCount: 10}, {mainCount: 10}],
            5: [{mainCount: 10}, {mainCount: 10}, {mainCount: 10}, {mainCount: 10}],
            6: [{mainCount: 11}, {mainCount: 11}, {mainCount: 11}],
        },
        pages: [

            // ── Seite 0: intro ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/001.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/008.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/035.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/031.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/059.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/076.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/077.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/081.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/105.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/098.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/113.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/126.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/140.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/144.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/153.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/180.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/185.jpg', color: '#2980B9' }
            ],

            // ── Seite 1: sprints 1 ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/001.jpg', color: '#3498DB', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/002.jpg', color: '#3498DB' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/003.jpg', color: '#3498DB' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/004.jpg', color: '#3498DB' },
                    { type: 'text', text: 'Erste Performanzen Skizze mit Fiberglaszeltstangen', color: '#3498DB' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/005.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0051.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/006.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/007.JPG', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/008.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/009.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/010.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/011.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/017.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/018.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/019.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/020.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/021.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/022.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/023.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/024.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/025.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0261.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0262.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0263.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/027.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0271.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/028.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0281.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/029.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/030.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/031.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/032.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/033.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/034.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/035.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/036.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0361.JPG', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0362.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/037.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/039.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/040.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/041.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/042.png', color: '#1A5276' }
            ],

            // ── Seite 2: sprints 2 ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/043.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/044.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/045.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/046.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/047.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/048.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/049.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/050.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0511.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0513.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0514.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/052.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/053.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/056.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/057.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/058.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/059.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/060.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/061.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/065.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/066.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/067.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/068.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/069.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/070.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/071.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/072.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/073.jpeg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/074.jpeg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/076.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/077.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/078.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/079.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/080.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/081.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/082.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/083.jpeg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/084.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/085.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/086.png', color: '#1A5276' }
            ],

            // ── Seite 3: sprints 3 ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/087.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/089.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/090.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/091.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/092.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/093.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/094.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/095.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/097.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/098.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/099.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/100.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/101.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/102.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/103.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/104.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/105.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/106.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/107.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/108.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/109.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/110.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/111.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/112.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/113.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/114.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/115.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/116.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/117.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/118.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/119.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/12.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/120.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/121.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/122.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/123.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/124.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/125.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/126.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/127.jpg', color: '#1A5276' }
            ],

            // ── Seite 4: sprints 4 ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/128.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/129.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/13.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/130.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/131.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/132.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/133.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/134.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/135.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/136.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/137.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/138.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/139.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/14.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/140.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/141.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/142.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/143.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/144.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/145.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/146.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/148.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1481.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/149.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/15.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/150.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/151.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/153.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1531.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/154.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/155.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1551.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/156.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1561.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1562.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1563.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/157.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/158.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1581.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/159.jpg', color: '#1A5276' }
            ],

            // ── Seite 5: sprints 5 ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/16.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/160.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1601.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1601.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1602.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1603.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1604.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1605.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1606.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/161.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/161.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1611.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1612.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/162.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/163.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/164.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1641.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/165.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/166.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1661.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/167.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1671.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1672.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1673.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/168.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/169.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1691.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/170.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1701.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/171.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1711.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1712.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/172.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1721.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/173.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/174.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1741.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1742.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/175.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/176.jpg', color: '#1A5276' }
            ],

            // ── Seite 6: sprints 6 ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1761.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/177.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/177.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1771.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/179.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/179.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1791.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/180.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1801.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1802.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1803.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/181.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/182.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1821.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1822.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1823.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1824.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1825.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/183.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1831.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/184.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1841.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/185.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1851.png', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/186.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1861.png', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1862.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1863.png', color: '#2471A3' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/187.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1871.png', color: '#1A5276' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/189.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1891.png', color: '#2980B9' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/190.jpg', color: '#2471A3' }
            ],

            // ── Seite 7: video ──
            [
                { type: 'video', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/Sequenz%2001.mp4', color: '#3498DB' }
            ],

            // ── Seite 8: bild 3 ──
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-18%20at%2017.09.46%20(1).jpeg', color: '#3498DB' }
            ],

            // ── Seite 9: bild 4 ──
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/flower-3.png', color: '#3498DB' }
            ],

            // ── Seite 10: bild 5 ──
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-18%20at%2017.09.46%20(2).jpeg', color: '#3498DB' }
            ],

            // ── Seite 11: bild 6 ──
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-23%20at%2021.40.23%20(1).jpeg', color: '#3498DB' }
            ],

            // ── Seite 12: bild 7 ──
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/flower-1.png', color: '#3498DB' }
            ],

            // ── Seite 13: bild 8 ──
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/3.png', color: '#3498DB' }
            ],

            // ── Seite 14: video 2 ──
            [
                { type: 'video', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/Sequenz%2001.mp4', color: '#3498DB' }
            ]
        ]
    },
    // ===== Kapitel 2: freie arbeiten =====
    {
        name: 'freie arbeiten',
        pageNames: ['drawings', 'print painting', 'enamel'],
        pageSections: {
            0: [{mainCount: 2}, {mainCount: 3}],
        },
        pages: [

            // ── Seite 0: drawings ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/20210601_155721%20(2).jpg', color: '#2ECC71' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/weiblicher_akt.jpg', color: '#27AE60', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/weiblicher_akt_koloriert.jpg', color: '#82E0AA' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/innenkamera1.jpg', color: '#1ABC9C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/innenkamera2.jpg', color: '#2ECC71', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/skizze_taenzer.jpg', color: '#27AE60' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/weibliches_modell_cowboy_hut.jpg', color: '#82E0AA' }
            ],

            // ── Seite 1: print painting ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/druck/20211201_145651.jpg', color: '#2ECC71' }
            ],

            // ── Seite 2: enamel ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/email/WhatsApp%20Image%202026-02-08%20at%2016.53.57.jpeg', color: '#2ECC71' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/email/asche_david_jewelery_enamel.jpeg', color: '#27AE60' }
            ]
        ]
    },
    // ===== Kapitel 3: spitzenkollektion =====
    {
        name: 'spitzenkollektion',
        pageNames: ['intro', 'abstract', 'mood', 'dev blouse', 'dev summer pants', 'dev capris', 'dev longsleeve', 'dev bomber', 'dev office top', 'summery'],
        pageSections: {
            1: [{mainCount: 3}, {mainCount: 3}],
            3: [{mainCount: 2}, {mainCount: 3}, {mainCount: 2}],
            4: [{mainCount: 1}, {mainCount: 1}, {mainCount: 3}],
            5: [{mainCount: 2}, {mainCount: 3}, {mainCount: 2}],
            7: [{mainCount: 2}, {mainCount: 2}],
            8: [{mainCount: 2}, {mainCount: 3}, {mainCount: 3}],
            9: [{mainCount: 2}],
        },
        pages: [

            // ── Seite 0: intro ──
            [
                { type: 'text', text: 'In this collection, I developed a collection based solely on the idea of a spike. This idea gave rise to seven garments that brought this design element to the body, starting with the cut from the spike outgoing.', netzTexts: [
                        { position: 'above-main', text: 'spitzenkollektion' },
                        { position: 'above-sub-0', text: '6th term project' },
                        { position: 'below-main', text: 'Period of origin 2024, 4 months\nSupervision Prof. Sibylle Klose\nPhotography Ferle Reisige\nTalents Juli Eller, Lydia Puschendorf, Caro' }
                    ] }
            ],

            // ── Seite 1: abstract ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/blouse_vorne.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/capris_halb_vorne.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/longsleeve_vorne.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/bomber_vorne_ganz.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/summer_pantspng.png' }
            ],

            // ── Seite 2: mood ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/mood/DSCF3882.JPG' }
            ],

            // ── Seite 3: dev blouse ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/blouse_vorne.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/blouse_hinten_detail.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/am_model/blouse_am_model.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/blouse_front.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/blouse_back.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/drapes/drape_blouse.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/schnitt/schnitt_blouse.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_163727.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_163738.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_163813.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_163838.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_164007.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_165039.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_165111.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_165656.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_165708.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_165713.jpg' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_113510.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_113520.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_113537.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_113544.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_125854.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_152553.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_154118.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_155210.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240417_153449.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240424_092131.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240517_132830.jpg' }
                ] }
            ],

            // ── Seite 4: dev summer pants ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/summer_pantspng.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/summer_pants_verschwommen.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/longer_pants_detail.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/summer_pants_front.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/summer_pants_back.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/long_pants_front.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/long_pants_back.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240508_164049.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240508_164056.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240508_164826.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_112916.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_121635.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_121642.jpg' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_145839.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_150418.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_151031.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_151505.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_151536.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240514_152702.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/summer%20pants/20240515_141341.jpg' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/long_pants/20240624_164716.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/long_pants/20240624_164736.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/long_pants/20240624_164900.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/long_pants/20240624_185654.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/long_pants/20240624_185709.jpg' }
                ] }
            ],

            // ── Seite 5: dev capris ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/capris_halb_vorne.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/capris_halb_unten.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/am_model/capris_am_model.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/capri_shorts_vorne.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/capri_shorts_hinten.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/drapes/drape_capris.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/schnitt/schnitt_capris.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240524_183811.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240524_183827.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240528_160243.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240528_163557.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240528_163608.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240528_163947.jpg' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240528_164008.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240528_164020.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240528_173418.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240624_163244.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240624_163248.jpg' }
                ] }
            ],

            // ── Seite 6: dev longsleeve ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/longsleeve_vorne.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/longsleeve_detail.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/longsleeve_front.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/longsleeve_back.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/longsleeve/20240601_180225.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/longsleeve/20240603_144829.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/longsleeve/20240603_144836.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/longsleeve/20240603_172135.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/longsleeve/20240619_195211.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/longsleeve/20240619_195218.jpg' }
                ] }
            ],

            // ── Seite 7: dev bomber ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/bomber_vorne_ganz.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/bomber_vorne_verdreht.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/bomber_seite_boden.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/bomber_seite_verschwommen.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/bomber_vorne.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/bomber_hinten.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240608_195711.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240608_195719.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240608_195928.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240608_195939.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240611_192905.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240615_203236.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240617_185229.jpg' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240622_110945.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240622_110952.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240622_111214.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240622_111828.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240626_182615.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240626_182618.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240626_182843.jpg' }
                ] }
            ],

            // ── Seite 8: dev office top ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_doppel.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz_eingedreht.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz_eingedreht_verschwommen.png' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz_verschwommen.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/am_model/office_top_am_model.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/office_top_vorne.png', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/office_top_hinten.png' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/drapes/drape_office_top.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/schnitt/schnitt_office_top.png' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240610_174233.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240611_200017.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240611_200027.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240611_200034.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240611_200059.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_203521.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_203724.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_203732.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_203739.jpg' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_203750.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_204150.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_204156.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_204202.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_204206.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240627_155535.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240627_155555.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240627_155903.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240627_155909.jpg' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240611_100732.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240611_100734.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240611_100737.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240622_164002.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240622_164010.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240622_172352.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240622_174255.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240622_174309.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240624_220219.jpg' }
                ] }
            ],

            // ── Seite 9: summery ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240514_153100.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240524_134620.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_163734.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_163743.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_164009.jpg' }
                ] },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_164028.jpg', subs: [
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_164035.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240626_121837.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240626_122031.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240627_145750.jpg' },
                    { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240627_145751.jpg' }
                ] }
            ]
        ]
    },
    // ===== Kapitel 4: displaydisplay =====
    {
        name: 'displaydisplay',
        pageNames: ['intro', 'abstract', 'sketches', 'mood', 'visual research', 'combined research', 'key ideas', 'development', 'summary'],
        pageSections: {
            1: [{mainCount: 4}],
            2: [{mainCount: 4}],
            3: [{mainCount: 4}],
            4: [{mainCount: 4}],
            5: [{mainCount: 3}],
            6: [{mainCount: 3}],
            7: [{mainCount: 3}],
            8: [{mainCount: 3}],
        },
        pages: [

            // ── Seite 0: intro ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240611_200034.jpg', color: '#F39C12' }
            ],

            // ── Seite 1: abstract ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/mantel_toille_hinten.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/mantel_zeichnung1.png', color: '#F39C12' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/pulli.png', color: '#E67E22' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/shrock.png', color: '#D68910' }
            ],

            // ── Seite 2: sketches ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/tank_top.png', color: '#B9770E' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/clo_3d_sketch_pixel_aufw%C3%A4rts.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/abg_blender.png', color: '#F39C12' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_3d_print_hinten.png', color: '#E67E22' }
            ],

            // ── Seite 3: mood ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_3d_print_hinten_zentral.png', color: '#D68910' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_3d_print_side.png', color: '#B9770E' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_3d_print_vorne.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_black.png', color: '#F39C12' }
            ],

            // ── Seite 4: visual research ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_blender_render.png', color: '#E67E22' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_stoff_huelle.png', color: '#D68910' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/blender_bag_side.png', color: '#B9770E' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/freigestellte_blender_bag_dynamisch_unten.png', color: '#9C640C' }
            ],

            // ── Seite 5: combined research ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/freugestellte_blender_bag_vorne.png', color: '#F39C12' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/pixelig_soft_surface.png', color: '#E67E22' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/schnitt_bag_radial.jpg', color: '#D68910' }
            ],

            // ── Seite 6: key ideas ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/tasche_stoff_technical_sketch.png', color: '#B9770E' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch1_dynamische%20figur.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch1_dynamische_figur_front.png', color: '#F39C12' }
            ],

            // ── Seite 7: development ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch_falling_character.png', color: '#E67E22' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch_pixel_am_koerper.png', color: '#D68910' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch_subject_and_bag.png', color: '#B9770E' }
            ],

            // ── Seite 8: summary ──
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/schuh/schuh_hinten.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/schuh/schuh_vorne.png', color: '#F39C12' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/schuh/schuh_vorne_innen.png', color: '#E67E22' }
            ]
        ]
    }
];
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
