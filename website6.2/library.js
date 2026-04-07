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
        pageNames: ["overview","abstract","methodology","dispositifs","what is a dispositif","positivity (where from)","how does a dispositif work (where now)","projection (where to)","appendix"],
        pageSections: {
            1: [{"mainCount":2},{"mainCount":3},{"mainCount":2},{"mainCount":4},{"mainCount":2},{"mainCount":2}],
            2: [{"mainCount":3},{"mainCount":2},{"mainCount":4},{"mainCount":4},{"mainCount":3},{"mainCount":3},{"mainCount":2}],
            3: [{"mainCount":3}],
            4: [{"mainCount":3},{"mainCount":3},{"mainCount":2},{"mainCount":3}],
            5: [{"mainCount":3},{"mainCount":3},{"mainCount":3},{"mainCount":3},{"mainCount":2},{"mainCount":3},{"mainCount":2},{"mainCount":3}],
            6: [{"mainCount":3},{"mainCount":7},{"mainCount":5},{"mainCount":6},{"mainCount":2},{"mainCount":5},{"mainCount":5},{"mainCount":6},{"mainCount":5},{"mainCount":5},{"mainCount":5},{"mainCount":3},{"mainCount":3},{"mainCount":4},{"mainCount":4},{"mainCount":5},{"mainCount":7}],
            7: [{"mainCount":4},{"mainCount":5},{"mainCount":6},{"mainCount":3},{"mainCount":3},{"mainCount":4}],
            8: [{"mainCount":2}],
        },
        pages: [

            // ── Seite 0: overview ──
            [
            ],

            // ── Seite 1: abstract ──
            [
                { type: "text", text: "1. Can something **New** emerge from **Nothing**?\n   1. That was the question I asked myself, hence the *0*.\n      1. How could I find out?\n         1. I tried.\n      2. Did it work?\n         1. No - (lol)\n      3. What was I missing?\n         1. Where I was? (!)\n         2. Where I wanted to go? (!)\n         3. How do I get from here to there? (!)\n      4. One question became 3.\n      5. The 0 became a 3?!" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/001.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/002.jpg" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/003.jpg", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/004.jpg", b2b: true }
                    ] },
                { type: "text", text: "1. **But how (did a 0 become a 3)?**\n2. **That was to become the question of my work.**\n   1. Three questions three starting points!\n      1. Where now?\n         1. is defined by the where from\n            1. Where to?\n            2. How?\n      2. Already 4 questions!\n         1. So I had to redefine.\n            1. Where\n               1. Where from?\n               2. Where now?\n               3. Where to?\n            2. How\n               1. How?" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/008.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/005.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0051.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/007.JPG", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/006.png" }
                    ] },
                { type: "text", text: "1. To pursue my question I had to answer these questions.\n   1. I looked around for what I **still** had from **before**.\n      1. I saw tent poles.\n   2. I looked around at **where** I was **now**\n      1. I was in my new room, just moved in.\n      2. I had a bed and a desk.\n      3. I had an empty room." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/009.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/010.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/011.png" }
                    ] },
                { type: "text", text: "1. The situation was interesting.\n   1. On one hand\n      1. I could sleep / chill / relax.\n      2. I could work at the desk.\n   2. On the other hand.\n      1. I had no wardrobe.\n      2. Everything (sorted) on the floor.\n   3. What was interesting now.\n      1. The way the situation was it worked.\n      2. Still I wanted to change something.\n   4. This feeling of wanting things to be different made me pick up my tent poles (from the floor).\n      1. (The Initial Moment)\n   5. The Where questions are answered." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/016.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/014.jpg", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/015.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/013.jpg" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/017.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/021.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/024.jpg" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/023.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/022.jpg" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/026.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0263.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0261.jpg" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0262.png" }
                    ] },
                { type: "text", text: "1. But how?\n   1. Doing it was easy.\n   2. Describing it was hard.\n      1. I thought of language.\n         1. I was not alone in this!\n            1. \"Sowohl Zeichen- als auch Wortsprache sind nur dem Menschen eigen und Teil seiner Kulturfähigkeit.\" [Both sign and word language are unique to humans and part of their cultural capacity.] (Loschek 1995, p. 158)\n         2. language itself, which is perhaps the oldest dispositif (Agamben 2008, p. 26)" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/025.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/029.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/030.png" }
                    ] },
                { type: "text", text: "1. So I needed a tool.\n   1. The making was subjective and sensory.\n   2. Language alone could not capture what was happening.\n   3. So I looked for a framework that brings both together: the subjective and the structural.\n      1. I found that framework in the dispositif.\n   4. **This work asks: Can the concepts of the dispositif, which describe on a structural level how subjects are formed, be transferred to the moment in which something new emerges within a single individual? What becomes (in)visible through this?**" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0181.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/019.jpg" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/020.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/018.png" }
                    ] },
            ],

            // ── Seite 2: methodology ──
            [
                { type: "text", text: "1. Doing it was easy.\n2. Describing it was hard.\n3. That was not just my problem – it was my starting point.\n   1. I needed a method that could do both.\n      1. Capture the moment.\n      2. Place it in context.\n   2. Something that was simultaneously process and product." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/027.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0271.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/028.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0281.png" }
                    ] },
                { type: "text", text: "1. **Autoethnography**\n2. I found autoethnography.\n   1. \"Persönliche Erfahrung (auto) beschreiben und systematisch analysieren (grafie), um kulturelle Erfahrung (ethno) zu verstehen.\" [To describe and systematically analyse (graphy) personal experience (auto) in order to understand cultural experience (ethno).] (Mey and Mruck 2010, p. 345)\n3. Concretely that meant:\n   1. I wrote retrospectively and selectively about the moments that stood out.\n   2. About those that revealed something.\n4. The mix fitted:\n   1. Making and reading. Bending and writing.\n5. What convinced me:\n   1. Autoethnography is \"sowohl eine Methode/einen Prozess als auch ein Produkt.\" [both a method/process and a product.] (ibid., p. 345)\n   2. The sprints were the tool and the result at the same time." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/035.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/031.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/032.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/033.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/034.png", b2b: true }
                    ] },
                { type: "text", text: "1. **The Sprints**\n2. I collected my own data.\n   1. My data came from the ideative moment.\n3. Sprints are a technique common in design processes and artistic processes. They are short sketch-like moments in which a design-artistic process is carried out.\n   1. In my work they were used to experience the moment of an idea emerging – of something new – and to condense it through serial repetition in order to intensify what was felt." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/039.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/040.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/042.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/041.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0362.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0362.jpg" }
                    ] },
                { type: "text", text: "1. **Presentation**\n2. The goal: \"bedeutsame, zugängliche und sinnhafte Ergebnisse\" [meaningful, accessible and sensible results] (Mey and Mruck 2010, p. 345)\n3. For me that meant: A website.\n   1. Text and image side by side.\n   2. Not text above image.\n      1. Both equal.\n4. This website comes closest to how I perceive a dispositif as a navigating element – as a manifestation. Navigation and information elements merge with user interface in the squares in the corners, from which a kind of branding effect emerged as a by-product. Programming the website expanded my perception of the disposing dynamic between individual substances of the dispositif." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/052.jpg" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/037.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/036.png" },
                { type: "text", text: "1. **Projection**\n2. The concepts I use – dispositif, subjectivation, aestheticisation, profanation – were developed for societies.\n   1. I use them for a single creative process.\n   2. Why do I do this?\n3. I orient myself on Foucault.\n   1. He began with prisons and clinics.\n   2. He ended with the question of how people work on themselves.\n   3. This shift – from the disciplining of the masses to the self-formation of the individual – is my theoretical foundation.\n      1. What Foucault did on the level of theory, I do across 100 moments." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/043.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/038.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/044.png" },
                { type: "text", text: "1. **Literature**\n2. Theory in this work does not come first.\n   1. It comes where it works.\n3. Each chapter is a pair:\n   1. A concept from the societal level.\n   2. An observation from my level." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/049.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/047.jpg" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/046.jpg", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/048.jpg", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/050.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/051.mp4" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0461.jpg", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0461.jpg", b2b: true }
                    ] },
                { type: "text", text: "1. **Classification**\n2. This work is a hybrid.\n3. I do not adopt this label.\n   1. Labels are structural dispositifs.\n4. Instead I describe what I do:\n   1. Making, Observing, Comparing, Writing.\n5. That is what I want:\n   1. Occasions.\n   2. Between making and thinking.\n   3. Between inside and outside." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0511.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0512.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0513.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/045.jpg" }
                    ] },
            ],

            // ── Seite 3: dispositifs ──
            [
                { type: "text", text: "1. I needed a framework.\n   1. To be able to place what happens in me.\n   2. To be able to translate what happens in me.\n   3. To put what happened in me into words.\n2. I found that framework in the dispositif.\n3. What follows is in three parts:\n   1. What the individual brings before the dispositif takes hold.\n   2. How the dispositif works.\n   3. How the subject emerges.\n4. This tripartition comes from Agamben." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/053.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/054.jpg", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/0541.jpg", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/055.jpg" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/056.jpg" },
            ],

            // ── Seite 4: what is a dispositif ──
            [
                { type: "text", text: "1. **What is a Dispositif?**\n2. A dispositif is not a thing. It is a net.\n   1. In other words:\n      1. What we do without thinking.\n      2. What we discuss as true.\n      3. What we can imagine.\n      4. What we negotiate as a problem.\n3. The dispositif coordinates these heterogeneous practices and discourses – it cuts across different fields, arranges them with one another and in doing so has a homogenising effect: It produces order where there actually is none." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/057.jpg" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/058.jpg" },
                { type: "text", text: "1. Agamben goes further.\n   1. For him the **world divides into two classes**: living beings (substances) and dispositifs.\n2. And here it becomes decisive:\n   1. The dispositif does not only shape.\n   2. It creates what it shapes.\n3. This is not theory. This is practice." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/062.jpg" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/063.jpg" },
                { type: "text", text: "1. **Genealogy**\n2. The concept has a history.\n   1. **Hegel** called it positivity.\n   2. **Hyppolite** translated Hegel into French.\n   3. **Foucault** turned it into the dispositif.\n   4. **Agamben** radicalised.\n   5. **Reckwitz** applied it to creativity." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/064.jpg" },
                { type: "text", text: "1. Agamben's division of the world:\n   1. **Substances** (living beings)\n   2. **Dispositifs**\n   3. **Subjects**\n2. The subject emerges where substance and dispositif meet.\n3. **This tripartition gives my work its structure.**\n   1. No boundaries between methodology and practice!" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/066.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/068.jpg" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/067.jpg" },
            ],

            // ── Seite 5: positivity ──
            [
                { type: "text", text: "1. **Positivity – Where From?**\n2. What does the individual bring before the dispositif acts upon it?\n3. But this substance is not a blank page.\n   1. It has a memory.\n   2. And the memory is full.\n4. **What are the substances that exist within an individual?**" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/072.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/073.jpeg", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/074.jpeg", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/071.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/070.jpg" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/069.jpg" }
                    ] },
                { type: "text", text: "1. **The Memory**\n2. The brain forms a gigantic 'associative memory'.\n3. But most of it is not accessible.\n4. That means:\n   1. I carry an enormous memory within me.\n   2. But I cannot see what is inside.\n   3. It works nonetheless, because it is there." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/059.jpg" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/060.png" },
                { type: "text", text: "1. **Two Forms of Knowledge**\n2. What lies in the memory has two forms.\n   1. One can be spoken. The other cannot.\n3. Implicit knowledge: the knowledge you live out.\n   1. *Making is the extension of the self into the self-organised world.*\n4. Explicit knowledge is different.\n   1. It is translated into language. Abstracted. Relatable.\n   2. That is its strength. And its limit.\n5. I noticed the difference because I was doing both at the same time." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/065.jpg" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/061.jpg" },
                { type: "text", text: "1. **Discourses and Imaginaries**\n2. The memory also contains discourses.\n   1. What counts as true.\n   2. What I had learned in my studies.\n   3. What counted as \"good design\".\n3. And: the imaginary.\n   1. The images I carried within me.\n   2. What I could imagine making.\n   3. Divergences.\n4. The creative person looks ahead. Not because they must. Because their memory prefers the imaginary, the divergent." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/076.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/077.jpg" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/078.png" },
                { type: "text", text: "1. **The Body**\n2. The substance brings not only knowledge. It brings a body.\n   1. The body is material and tool at the same time.\n3. It is not simply there – it is a product of mental processes of observation.\n4. Simultaneously the one who makes and what is being made.\n   1. This duality is the beginning of everything." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/079.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/080.png" }
                    ] },
                { type: "text", text: "1. **Identity**\n2. Identity is not found in the head. It is found on the body.\n3. This is ancient. Imitation is considered the oldest creative act of humankind.\n4. Identity is a mirror – the individual judges themselves in the light of how they believe others judge them. Personal identity emerges between two poles: a unique life history and social belonging.\n5. What drives this mediation: the urge to explore and act, imitation, competitive thinking, collective understanding. These are the forces that fill the memory and set the substance in motion." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/081.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/082.png" },
                { type: "text", text: "1. **Affects**\n2. The substance does not only perceive. It is affected.\n3. The aesthetic knowledge in the memory is paradoxical:\n   1. **It feels free.**\n   2. **But it is shaped.**" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/083.jpeg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/084.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/087.png" }
                    ] },
                { type: "text", text: "1. **The Impulse**\n2. At the end stands the impulse.\n3. That is the substance. That is what I brought when I picked up the tent poles.\n   1. An enormous memory.\n   2. Two forms of knowledge.\n   3. A body that understood itself as subject and object at the same time.\n   4. An identity searching for expression.\n   5. Affects that felt free but were shaped.\n   6. And an impulse to make something." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/090.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/085.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/086.png" }
                    ] },
            ],

            // ── Seite 6: how does a dispositif work ──
            [
                { type: "text", text: "1. **How Does a Dispositif Work? – Where Now?**\n2. The substance is there. The memory is full.\n   1. But how does this become action?\n   2. How does the dispositif take hold?\n3. What follows is a sequence:\n   1. Perceiving. Directing. Shaping. Maintaining.\n   2. And sometimes: Breaking." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/091.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/089.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/092.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/093.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/094.png", b2b: true }
                    ] },
                { type: "text", text: "1. **Identification**\n2. The first step: I recognise something.\n   1. Societally: The dispositif provides models.\n   2. For me: I saw tent poles and recognised in their flexibility something I knew – fabric." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/105.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/098.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/104.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/099.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/102.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/103.png" },
                { type: "text", text: "1. **Associativity and Selectivity**\n2. After identification the linking begins.\n   1. The memory connects what is perceived with what is stored.\n   2. But not everything. It selects.\n3. An interplay of contingencies and non-arbitrariness.\n   1. Societally: The dispositif determines what is relevant.\n   2. For me: My memory selected – flexibility yes, camping no. Draping yes, pitching a tent no.\n   3. It could have gone differently. But it did not go arbitrarily." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/097.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/095.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/100.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/101.png" },
                { type: "text", text: "1. **Assignment**\n2. Linking alone is not enough. It needs a direction.\n3. Societally: The creativity dispositif gives the assignment – be creative.\n4. For me: I wanted to change something.\n   1. Not because I had to.\n   2. Because it should feel different." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/107.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/108.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/109.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/110.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/111.png" },
                { type: "text", text: "1. **Subjectivation**\n2. Through identification, association and assignment something emerges: A subject.\n   1. The human must first make of themselves what they are.\n3. Subjectivation is the process through which an individual transforms into a subject.\n   1. Self-identification could not take place without social identification.\n4. Central: The dialectic of subjectivation and desubjectivation.\n   1. The subject never emerges as a fixed entity.\n   2. It emerges in the interplay with a moment of dissolution." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/112.png" },
                { type: "text", text: "1. Societally: The creativity dispositif makes us \"creative subjects\".\n2. For me: I became the subject that was \"creative\" with tent poles.\n   1. But did I become that on my own?\n   2. Or did the dispositif make me into that?" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/113.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/114.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/115.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/116.png" },
                { type: "text", text: "1. **Aestheticisation**\n2. Now it becomes sensory. The aesthetic emerges between object and subject.\n3. Aestheticisation means self-dynamic processes of sensory perception that have detached from purpose-rational action. Sensuality for the sake of sensuality.\n4. This expansion of the aesthetic happens at the expense of a non-aesthetic." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/117.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/118.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/119.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/120.png" },
                { type: "text", text: "1. Societally: More and more is judged by feeling.\n2. For me: When I bent the tent poles it was not about function. It was about the bending itself." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/121.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/122.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/123.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/124.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/125.png" },
                { type: "text", text: "1. **Creativity as Dispositif**\n2. Creativity is the ability to dynamically produce the new. But it is not neutral. It is demanded.\n3. The concept of inspiration shifts from passively supernatural to actively achievable.\n   1. Inspiration used to come from the gods.\n   2. Today you have to get it yourself." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/126.jpg" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/127.jpg" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/128.jpg" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/129.jpg" },
                { type: "text", text: "1. Societally: The creativity dispositif normalises the new.\n2. For me: I made 100 sprints.\n   1. Was that my free will?\n   2. Or the effect of the dispositif?" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/130.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/131.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/132.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/138.png" },
                { type: "text", text: "1. **Autopoiesis**\n2. And then everything repeats.\n3. Autopoiesis means that all systems must arrive at ever new forms if they are not to collapse. They are irritable but not intervenable.\n4. Societally: The dispositif maintains itself by constantly producing the new without changing itself.\n5. For me: My sprints built on each other.\n   1. Each new one reacted to the previous.\n   2. The system maintained itself – through variation, not through rupture." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/133.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1331.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/134.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/139.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/135.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1351.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/137.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/136.png" },
                { type: "text", text: "1. **Profanation**\n2. Sometimes something else happened.\n   1. Sometimes the sequence broke.\n3. Every object has a purpose. These purposes are not natural – they were determined. Agamben calls this separation.\n4. Profanation is the reversal. Not destroying the purpose. Disregarding it." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/140.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/141.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/142.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/143.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1411.png" }
                    ] },
                { type: "text", text: "1. Three moments:\n   1. First the determined purpose (separation).\n   2. Then the neutralisation.\n   3. Then the new use – learning to play with them.\n2. How does profanation happen? Through play. Play is the inversion of ritual." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/144.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/151.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/145.png", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/150.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/149.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/146.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/148.png", subs: [
                                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1481.jpg" }
                            ] }
                    ] },
                { type: "text", text: "1. Profanation is physical. You grab something. Children transform whatever junk they get their hands on into a toy.\n2. Tent poles transform into fabric.\n   1. That was my moment.\n   2. I grabbed the tent poles – like the children grab the junk.\n   3. The determined purpose – camping – was not destroyed.\n   4. It was disregarded." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/153.jpg", subs: [
                        { type: "text", title: "tshirt" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1531.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/154.jpg", subs: [
                        { type: "text", title: "bubble skirt" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/155.jpg", subs: [
                        { type: "text", title: "flat skirt" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1551.png" }
                    ] },
                { type: "text", text: "1. **What Profanation Is Not**\n2. Profanation is not revolution. It neutralises without abolishing.\n   1. The dispositif does not disappear.\n   2. It is disregarded for a moment.\n   3. Afterwards it takes hold again." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/156.jpg", subs: [
                        { type: "text", title: "twist dress" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1561.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1562.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1563.png", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/157.jpg", subs: [
                        { type: "text", title: "jacket" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/158.jpg", subs: [
                        { type: "text", title: "fishermans jumper" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1581.png", b2b: true },
                        { type: "text", title: "hoodie", b2b: true }
                    ] },
                { type: "text", text: "1. **Where Profanation Meets Aestheticisation**\n2. Profanation and aestheticisation are two sides of the same moment.\n   1. Profanation detaches the object from its purpose.\n   2. Aestheticisation detaches perception from its purpose.\n3. In the sprint both happen simultaneously.\n   1. The tent pole loses its purpose (profanation at the object).\n   2. And I perceive the bending as an end in itself (aestheticisation in the subject)." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/159.jpg", subs: [
                        { type: "text", title: "lounge jacket" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/162.jpg", subs: [
                        { type: "text", title: "lounge pants" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/160.jpg", subs: [
                        { type: "text", title: "cap" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1601.jpg", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1605.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1602.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1603.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1602.png", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1601.jpg", subs: [
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1604.png" }
                    ] },
                { type: "text", text: "1. **The Open Question**\n2. But – and this is the question for the projection:\n   1. How many of my sprints were truly profaning?\n   2. And how many were autopoietic?\n3. Profanation is the exception. Autopoiesis is the rule.\n4. In autopoiesis the system varies. In profanation it tips – for a moment." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/161.jpg", subs: [
                        { type: "text", title: "salt shaker" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1611.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1612.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1613.png" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/163.jpg", subs: [
                        { type: "text", title: "simple skirt" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/164.jpg", subs: [
                        { type: "text", title: "inside outside top" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1641.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/165.jpg", subs: [
                        { type: "text", title: "lounge capris" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/166.jpg", subs: [
                        { type: "text", title: "summer top" }
                    ] },
            ],

            // ── Seite 7: projection ──
            [
                { type: "text", text: "1. **Projection – Where To?**\n2. What remains?\n   1. I built a framework – the dispositif.\n   2. I looked at what I bring – the substance.\n   3. I looked at how the dispositif works.\n   4. Now the question: Did the projection work?" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/167.png", subs: [
                        { type: "text", title: "necktie" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1671.jpg" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1672.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1673.png", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/168.jpg", subs: [
                        { type: "text", title: "speaker enclosure" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/169.png", subs: [
                        { type: "text", title: "lamp enclosure" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1691.png" }
                    ] },
                { type: "text", text: "1. **The Back-Projection**\n2. That was my problem too. Can one use the concepts that describe society to describe what happens in a single moment?" },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/170.jpg", subs: [
                        { type: "text", title: "3d poster" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1701.jpg" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/171.png", subs: [
                        { type: "text", title: "book shelf" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1711.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1712.png", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/172.png", subs: [
                        { type: "text", title: "knife block" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1721.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/173.png", subs: [
                        { type: "text", title: "ballet flats" }
                    ] },
                { type: "text", text: "1. **Where Is Something Truly New Created?**\n2. The decisive question is not whether creativity takes place.\n   1. The decisive question is where the individual truly breaks out of the dispositif.\n   2. And where it merely varies within the dispositif.\n3. Most of my sprints were autopoietic. Variations. The system maintained itself.\n4. Some – the fewest – were profaning. Moments in which the purpose of the material tipped." },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/174.jpg", subs: [
                        { type: "text", title: "ear rings" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1741.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1742.png", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/175.jpg", subs: [
                        { type: "text", title: "speaker enclosure" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1761.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/177.jpg", subs: [
                        { type: "text", title: "open skirt" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/178.png", subs: [
                        { type: "text", title: "bad dart continuous bubble cut" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1771.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/179.jpg", subs: [
                        { type: "text", title: "chair" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1792.png" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1791.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/180.png", subs: [
                        { type: "text", title: "gummy bear" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1801.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1802.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1803.png", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/181.png", subs: [
                        { type: "text", title: "newspaper rack" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/182.png", subs: [
                        { type: "text", title: "weaving ornament" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1821.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1822.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1823.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1824.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1825.png", b2b: true }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/183.png", subs: [
                        { type: "text", title: "couch" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1831.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/184.png", subs: [
                        { type: "text", title: "weaving ornament" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1841.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/185.jpg", subs: [
                        { type: "text", title: "beverage can" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1851.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/186.jpg", subs: [
                        { type: "text", title: "jar" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1861.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1863.png", b2b: true },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1862.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/187.jpg", subs: [
                        { type: "text", title: "blender" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1871.png" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/190.jpg", subs: [
                        { type: "text", title: "bag" }
                    ] },
                { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/189.jpg", subs: [
                        { type: "text", title: "side table" },
                        { type: "image", url: "https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/1891.png" }
                    ] },
            ],

            // ── Seite 8: appendix ──
            [
                { type: "text", text: "Bibliography" },
                { type: "text", text: "Declaration of Originality" },
            ],
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
