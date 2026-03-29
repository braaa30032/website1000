/* ============================================
   LIBRARY – Zentrale Content-Datenbank
   ============================================

   Hierarchische Struktur:
   LIBRARY[kapitel].pages[seite][mainNode].subs[subNode]

   Kapitel-Felder: name, color, pages
   Main-Node-Felder: type, url, color, subs (optional)
   Sub-Node-Felder: type, url/title/text, color (optional)

   ── Rendering-Modus ──
   Default: 2D — Content füllt 100% des Grid-Rechtecks (cover-fit).
   Für 3D-Rahmen (GLB frame + contain-fit) setze render3d: true
   auf dem jeweiligen Node:

       { type: 'image', url: '...', color: '#E74C3C', render3d: true }

   render3d kann auf Main-Nodes, Sub-Nodes und Pet-Nodes gesetzt
   werden. Ohne Flag oder bei render3d: false → 2D-Darstellung.

   ── Nav-Text-Modus ──
   NAV_TEXT_MODE steuert die Textdarstellung in den 4 Nav-Quadranten.
   '2d' → 2D-Canvas Fill-Box-Text (Seitenname, Kapitel, Citation, 0fun)
   '3d' → 3D-Buchstaben aus letter-system.js (nur Kapitelname)
   Es kann nur EINE Darstellung gleichzeitig aktiv sein.

   ============================================ */

/* ═══════════════════════════════════════════════════════════════
   FARBPALETTEN — zentrale Stelle für alle Farben
   60 % = primary  (Netz-Quads, Main/Sub-Hintergründe, Landing-Banner)
   30 % = secondary (Nav-Quadranten-Hintergrund, Loading-Tiles)
   10 % = accent    (Texte, Nav-Beschriftungen)
   ═══════════════════════════════════════════════════════════════ */
export var COLOR_PALETTES = [
    { name: 'Mint-Rose',     primary: '#2bffdf', secondary: '#ec677a', accent: '#00e105' },
    { name: 'Lavender-Fire', primary: '#dad5eb', secondary: '#ff5b00', accent: '#00ffa2' },
];

/** Index der aktiven Palette (0-basiert). Ändere nur diesen Wert. */
export var activePaletteIndex = 0;

/** Gibt die aktuell aktive Palette zurück. */
export function getActivePalette() {
    return COLOR_PALETTES[activePaletteIndex] || COLOR_PALETTES[0];
}

/* Nav-Quadranten: '2d' = Canvas-Fill-Box | '3d' = 3D-Letter-System */
export var NAV_TEXT_MODE = '2d';

export var LIBRARY = [

    // ===== Kapitel 0: David Asche =====
    {
        name: 'David Asche', color: '#E74C3C',
        // Material-Moodboard: Farben + PBR-Eigenschaften pro Buchstabe (zyklisch)
        materialSet: [
            { color: '#E74C3C', roughness: 0.25, metalness: 0.0, clearcoat: 0.5 },
            { color: '#C0392B', roughness: 0.4, metalness: 0.1 },
            { color: '#F1948A', roughness: 0.15, metalness: 0.0, transmission: 0.3, ior: 1.45 },
            { color: '#E74C3C', roughness: 0.6, metalness: 0.0, sheen: 1.0, sheenColor: '#FF6B6B', sheenRoughness: 0.3 },
        ],
        pages: [

            // --- Seite 0 (1 Main-Nodes) ---
            [
                { id: 'david-portrait', type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-23%20at%2021.40.23%20(1).jpeg', color: '#E74C3C' }
            ]
        ]
    },

    // ===== Kapitel 1: 0 =====
    {
        name: '0', color: '#3498DB',
        pageNames: ["intro","sprints 1","sprints 2","sprints 3","sprints 4","sprints 5","sprints 6","video","bild 3","bild 4","bild 5","bild 6","bild 7","bild 8","video 2"],
        materialSet: [
            { color: '#3498DB', roughness: 0.1, metalness: 0.0, transmission: 0.8, ior: 1.5, thickness: 0.5 },
            { color: '#2980B9', roughness: 0.3, metalness: 0.2, clearcoat: 0.8 },
            { color: '#5DADE2', roughness: 0.05, metalness: 0.0, transmission: 0.95, ior: 1.52 },
        ],
        pages: [

            // --- Seite 0 (1 Main-Nodes) ---
            [
                { id: 'null-flower-start', type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/flower-1.png', color: '#3498DB' }
            ],


            // --- Seite 1: sprints 1 (40 Main-Nodes) ---
            [
                {
                    type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/001.jpg', color: '#3498DB',
                    subs: [
                        { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/002.jpg', color: '#3498DB' },
                        { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/003.jpg', color: '#3498DB' },
                        { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/sprints/004.jpg', color: '#3498DB' },
                        { type: 'text', color: '#3498DB', text: 'Erste Performanzen Skizze mit Fiberglaszeltstangen' }
                    ]
                },
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

            // --- Seite 2: sprints 2 (40 Main-Nodes) ---
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

            // --- Seite 3: sprints 3 (40 Main-Nodes) ---
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

            // --- Seite 4: sprints 4 (40 Main-Nodes) ---
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

            // --- Seite 5: sprints 5 (40 Main-Nodes) ---
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

            // --- Seite 6: sprints 6 (33 Main-Nodes) ---
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


            // --- Seite 2 (1 Main-Nodes) ---
            [
                { type: 'video', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/Sequenz%2001.mp4', color: '#3498DB' }
            ],

            // --- Seite 3 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-18%20at%2017.09.46%20(1).jpeg', color: '#3498DB' }
            ],

            // --- Seite 4 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/flower-3.png', color: '#3498DB' }
            ],

            // --- Seite 5 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-18%20at%2017.09.46%20(2).jpeg', color: '#3498DB' }
            ],

            // --- Seite 6 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-23%20at%2021.40.23%20(1).jpeg', color: '#3498DB' }
            ],

            // --- Seite 7 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/flower-1.png', color: '#3498DB' }
            ],

            // --- Seite 8 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/3.png', color: '#3498DB' }
            ],

            // --- Seite 9 (1 Main-Nodes) ---
            [
                { type: 'video', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/Sequenz%2001.mp4', color: '#3498DB' }
            ]
        ]
    },

    // ===== Kapitel 2: freie arbeiten =====
    {
        name: 'freie arbeiten', color: '#2ECC71',
        pageNames: ['drawings', 'print painting', 'enamel'],
        pageSections: {
            0: [{ mainCount: 2 }, { mainCount: 3 }]
        },
        materialSet: [
            { color: '#2ECC71', roughness: 0.5, metalness: 0.0, sheen: 0.8, sheenColor: '#58D68D', sheenRoughness: 0.4 },
            { color: '#27AE60', roughness: 0.2, metalness: 0.3, clearcoat: 0.6 },
            { color: '#82E0AA', roughness: 0.1, metalness: 0.0, transmission: 0.5, ior: 1.4 },
            { color: '#1ABC9C', roughness: 0.35, metalness: 0.15, iridescence: 0.8 },
        ],
        pages: [

            // --- Seite 0: Zeichnung ---
            // Sektion 1: Bild1, Bild5(+Sub Bild6)
            // Sektion 2: Bild2, Bild3(+Sub Bild4), Bild7
            [
                { type: 'image', color: '#2ECC71', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/20210601_155721%20(2).jpg' },
                {
                    type: 'image', color: '#27AE60', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/weiblicher_akt.jpg',
                    subs: [
                        { type: 'image', color: '#82E0AA', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/weiblicher_akt_koloriert.jpg' }
                    ]
                },
                { type: 'image', color: '#1ABC9C', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/innenkamera1.jpg' },
                {
                    type: 'image', color: '#2ECC71', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/innenkamera2.jpg',
                    subs: [
                        { type: 'image', color: '#27AE60', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/skizze_taenzer.jpg' }
                    ]
                },
                { type: 'image', color: '#82E0AA', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/Zeichnung/weibliches_modell_cowboy_hut.jpg' }
            ],

            // --- Seite 1: druck (1 Bild) ---
            [
                { type: 'image', color: '#2ECC71', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/druck/20211201_145651.jpg' }
            ],

            // --- Seite 2: email (2 Bilder) ---
            [
                { type: 'image', color: '#2ECC71', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/email/WhatsApp%20Image%202026-02-08%20at%2016.53.57.jpeg' },
                { type: 'image', color: '#27AE60', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/kunst/email/asche_david_jewelery_enamel.jpeg' }
            ]

        ]
    },

    // ===== Kapitel 3: spitzenkollektion =====
    {
        name: 'spitzenkollektion', color: '#9B59B6',
        pageNames: ['intro', 'abstract', 'sketches', 'mood', 'visual research', 'combined research', 'key ideas', 'development', 'summary'],
        materialSet: [
            { color: '#9B59B6', roughness: 0.7, metalness: 0.0, sheen: 1.0, sheenColor: '#D2B4DE', sheenRoughness: 0.5 },
            { color: '#8E44AD', roughness: 0.3, metalness: 0.0, clearcoat: 0.4 },
            { color: '#BB8FCE', roughness: 0.15, metalness: 0.0, transmission: 0.6, ior: 1.45, thickness: 0.3 },
            { color: '#7D3C98', roughness: 0.55, metalness: 0.05, iridescence: 0.6 },
            { color: '#AF7AC5', roughness: 0.8, metalness: 0.0, sheen: 0.7, sheenColor: '#E8DAEF', sheenRoughness: 0.6 },
        ],
        pages: [

            // --- Seite 0: intro (1 Main-Node: text + 1 Sub: image) ---
            [
                {
                    type: 'text',
                    text: 'In this collection, I developed a collection based solely on the idea of a spiek. This idea gave rise to seven garments that brought this design element to the body, starting with the cut from the spike outgoing.',
                    color: '#9B59B6',
                    subs: [
                        { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240611_200034.jpg', color: '#9B59B6' }
                    ],
                    netzTexts: [
                        { position: 'above-main', text: 'spitzenkollektion', color: '#9B59B6' },
                        { position: 'above-sub-0', text: '6th term project', color: '#9B59B6' },
                        { position: 'below-main', text: 'Period of origin 2024, 4 months\nSupervision Prof. Sibylle Klose\nPhotogrphy Ferle Reisige\nTalents Juli Eller, Lydia Puschendorf, Caro', color: '#9B59B6' }
                    ]
                }
            ],

            // --- Seite 1: abstract (7 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/capris_halb_vorne.png', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/longer_pants_detail.png', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/longsleeve_detail.png', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/longsleeve_vorne.png', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal.png', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_doppel.png', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz.png', color: '#7D3C98' }
            ],

            // --- Seite 2: sketches (7 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz_eingedreht.png', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz_eingedreht_verschwommen.png', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/shoot_office_top_frontal_ganz_verschwommen.png', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/summer_pants_verschwommen.png', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/shooting/summer_pantspng.png', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/am_model/blouse_am_model.png', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/am_model/capris_am_model.png', color: '#9B59B6' }
            ],

            // --- Seite 3: mood (7 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/am_model/office_top_am_model.png', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/blouse_back.png', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/blouse_front.png', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/bomber_hinten.png', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/bomber_vorne.png', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/capri_shorts_hinten.png', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/capri_shorts_vorne.png', color: '#BB8FCE' }
            ],

            // --- Seite 4: visual research (8 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/long_pants_back.png', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/long_pants_front.png', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/longsleeve_back.png', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/longsleeve_front.png', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/office_top_hinten.png', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/office_top_vorne.png', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/summer_pants_back.png', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/tecnicals/summer_pants_front.png', color: '#9B59B6' }
            ],

            // --- Seite 5: combined research (7 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/drapes/drape_blouse.png', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/drapes/drape_capris.png', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/drapes/drape_office_top.png', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/schnitt/schnitt_blouse.png', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/schnitt/schnitt_capris.png', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/schnitt/schnitt_office_top.png', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/mood/DSCF3882.JPG', color: '#BB8FCE' }
            ],

            // --- Seite 6: key ideas (7 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240415_163727.jpg', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/blouse/20240416_125854.jpg', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240622_110945.jpg', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/bomber/20240626_182843.jpg', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240528_163947.jpg', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/capris/20240624_163244.jpg', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/longsleeve/20240603_172135.jpg', color: '#AF7AC5' }
            ],

            // --- Seite 7: development (7 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/long_pants/20240624_164900.jpg', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240622_203521.jpg', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/construction/20240622_174255.jpg', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240514_153100.jpg', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240524_134620.jpg', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_163734.jpg', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_163743.jpg', color: '#8E44AD' }
            ],

            // --- Seite 8: summary (7 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_164009.jpg', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_164028.jpg', color: '#7D3C98' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240624_164035.jpg', color: '#AF7AC5' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240626_121837.jpg', color: '#9B59B6' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240626_122031.jpg', color: '#8E44AD' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240627_145750.jpg', color: '#BB8FCE' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/looks/20240627_145751.jpg', color: '#7D3C98' }
            ]
        ]
    },

    // ===== Kapitel 4: displaydisplay =====
    {
        name: 'displaydisplay', color: '#F39C12',
        pageNames: ['intro', 'abstract', 'sketches', 'mood', 'visual research', 'combined research', 'key ideas', 'development', 'summary'],
        materialSet: [
            { color: '#F39C12', roughness: 0.2, metalness: 0.6, clearcoat: 0.3 },
            { color: '#E67E22', roughness: 0.4, metalness: 0.1, sheen: 0.5, sheenColor: '#F9E79F', sheenRoughness: 0.3 },
            { color: '#F5B041', roughness: 0.1, metalness: 0.0, transmission: 0.4, ior: 1.5 },
            { color: '#D68910', roughness: 0.5, metalness: 0.8 },
            { color: '#FAD7A0', roughness: 0.05, metalness: 0.0, transmission: 0.7, ior: 1.52, thickness: 0.4 },
        ],
        pages: [

            // --- Seite 0: intro (4 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/6sem/assets/process/office_top/20240611_200034.jpg', color: '#F39C12' }
            ],

            // --- Seite 1: abstract (4 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/mantel_toille_hinten.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/mantel_zeichnung1.png', color: '#F39C12' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/pulli.png', color: '#E67E22' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/shrock.png', color: '#D68910' }
            ],

            // --- Seite 2: sketches (4 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/tank_top.png', color: '#B9770E' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/am_k%C3%B6rper/clo_3d_sketch_pixel_aufw%C3%A4rts.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/abg_blender.png', color: '#F39C12' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_3d_print_hinten.png', color: '#E67E22' }
            ],

            // --- Seite 3: mood (4 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_3d_print_hinten_zentral.png', color: '#D68910' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_3d_print_side.png', color: '#B9770E' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_3d_print_vorne.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_black.png', color: '#F39C12' }
            ],

            // --- Seite 4: visual research (4 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_blender_render.png', color: '#E67E22' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/bag_stoff_huelle.png', color: '#D68910' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/blender_bag_side.png', color: '#B9770E' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/freigestellte_blender_bag_dynamisch_unten.png', color: '#9C640C' }
            ],

            // --- Seite 5: combined research (3 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/freugestellte_blender_bag_vorne.png', color: '#F39C12' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/pixelig_soft_surface.png', color: '#E67E22' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/schnitt_bag_radial.jpg', color: '#D68910' }
            ],

            // --- Seite 6: key ideas (3 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/bag/tasche_stoff_technical_sketch.png', color: '#B9770E' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch1_dynamische%20figur.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch1_dynamische_figur_front.png', color: '#F39C12' }
            ],

            // --- Seite 7: development (3 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch_falling_character.png', color: '#E67E22' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch_pixel_am_koerper.png', color: '#D68910' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/handzeichnungen/sketch_subject_and_bag.png', color: '#B9770E' }
            ],

            // --- Seite 8: summary (3 Main-Nodes) ---
            [
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/schuh/schuh_hinten.png', color: '#9C640C' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/schuh/schuh_vorne.png', color: '#F39C12' },
                { type: 'image', url: 'https://website-dateien.s3.fr-par.scw.cloud/dateien_website/content/4sem/assets/schuh/schuh_vorne_innen.png', color: '#E67E22' }
            ]
        ]
    }
];


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
 * Baut die Main-Nodes fuer eine Seite.
 * Rueckgabe: Array von Node-Objekten mit id, color, type,
 * image/video, children[], pets[], connectsTo[].
 *
 * IDs: Nutzt entry.id wenn vorhanden, sonst auto-generiert
 * (z.B. 'ch1-p2-m0').  Gleiche Logik fuer Children.
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
            id:         entry.id || autoId,
            type:       entry.type || 'image',
            color:      nodeColor,
            label:      entry.label || '',
            connectsTo: entry.connectsTo || [],
            grid:       entry.grid || null,
            pets:       [],
            children:   []
        };

        /* media */
        if (entry.type === 'image') { node.image = entry.url; }
        else if (entry.type === 'video') { node.video = entry.url; }
        else if (entry.type === 'text') {
            node.title = entry.title || '';
            node.text  = entry.text  || '';
        }

        /* pets (main-level) */
        var mainPets = entry.pets || [];
        for (var p = 0; p < mainPets.length; p++) {
            var mp = mainPets[p];
            var petObj = {
                id:    mp.id || (node.id + '-pet' + p),
                type:  mp.type || 'image',
                image: mp.type === 'image' ? mp.url : undefined,
                video: mp.type === 'video' ? mp.url : undefined,
                title: mp.title || '',
                text:  mp.text  || '',
                color: mp.color || nodeColor
            };
            /* Optional manual placement (absolute px offsets from parent top-left) */
            if (mp.x !== undefined) petObj.x = mp.x;
            if (mp.y !== undefined) petObj.y = mp.y;
            if (mp.scale !== undefined) petObj.scale = mp.scale;
            node.pets.push(petObj);
        }

        /* netzTexts — text overlays for netz quads near this main */
        node.netzTexts = entry.netzTexts || [];

        /* children (subs) */
        var subs = entry.subs || [];
        for (var s = 0; s < subs.length; s++) {
            var sub = subs[s];
            var childId = sub.id || (node.id + '-sub' + s);

            var child = {
                id:         childId,
                type:       sub.type || 'image',
                color:      sub.color || nodeColor,
                connectsTo: sub.connectsTo || [],
                grid:       sub.grid || null,
                pets:       []
            };

            if (sub.type === 'image')      { child.image = sub.url; }
            else if (sub.type === 'video') { child.video = sub.url; }
            else if (sub.type === 'text')  {
                child.title = sub.title || '';
                child.text  = sub.text  || '';
            }

            /* child pets */
            var childPets = sub.pets || [];
            for (var cp = 0; cp < childPets.length; cp++) {
                var cpet = childPets[cp];
                var cpetObj = {
                    id:    cpet.id || (childId + '-pet' + cp),
                    type:  cpet.type || 'image',
                    image: cpet.type === 'image' ? cpet.url : undefined,
                    video: cpet.type === 'video' ? cpet.url : undefined,
                    title: cpet.title || '',
                    text:  cpet.text  || '',
                    color: cpet.color || child.color
                };
                /* Optional manual placement (absolute px offsets from parent top-left) */
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
 * Gibt das Thumbnail fuer eine Page im Nav-System zurueck.
 * Default: erster Main-Node der Page.
 */
export function getPageThumbnail(chapterIdx, pageIdx) {
    var ch = LIBRARY[chapterIdx];
    if (!ch || pageIdx >= ch.pages.length) return null;
    var page = ch.pages[pageIdx];
    if (page.length === 0) return null;
    var first = page[0];
    return { type: first.type, url: first.url, color: first.color || ch.color };
}

/**
 * Returns section definitions for a page.
 * If the chapter has pageSections[pageIdx], returns that array.
 * Otherwise DEFAULT: every main gets its own section (vertical scroll).
 *
 * To group multiple mains into ONE section (e.g. side-by-side landscape),
 * add a pageSections entry to the chapter:
 *
 *   pageSections: {
 *       0: [{ mainCount: 3 }],                       // page 0: all 3 mains in 1 section
 *       1: [{ mainCount: 2 }, { mainCount: 1 }],      // page 1: 2 mains in sec0, 1 in sec1
 *   }
 *
 * Format: [{mainCount: N}, {mainCount: M}, ...]
 */
export function getPageSections(chapterIdx, pageIdx) {
    var ch = LIBRARY[chapterIdx];
    if (!ch) return [{ mainCount: 0 }];
    if (ch.pageSections && ch.pageSections[pageIdx] !== undefined) {
        return ch.pageSections[pageIdx];
    }
    /* Default: each main = its own section (stacked vertically, scrollable) */
    var page = ch.pages[pageIdx];
    var n = page ? page.length : 0;
    var sections = [];
    for (var i = 0; i < n; i++) sections.push({ mainCount: 1 });
    return sections;
}

/** Backward-compatible CHAPTER_DEFS (reads from LIBRARY). */
export var CHAPTER_DEFS = LIBRARY.map(function(ch) {
    return { name: ch.name, color: ch.color };
});

/* Window globals for backward compat (letter-system.js, inline scripts) */
window.LIBRARY = LIBRARY;
window.NAV_TEXT_MODE = NAV_TEXT_MODE;
window.CHAPTER_DEFS = CHAPTER_DEFS;
window.getChapterCount = getChapterCount;
window.getPageCount = getPageCount;
window.getMainNodesForPage = getMainNodesForPage;
window.getPageThumbnail = getPageThumbnail;
window.getPageSections = getPageSections;
