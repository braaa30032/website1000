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

/* Nav-Quadranten: '2d' = Canvas-Fill-Box | '3d' = 3D-Letter-System */
var NAV_TEXT_MODE = '2d';

var LIBRARY = [

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
        pageLayouts: { 1: 'timeline' },
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

            // --- Seite 1 (99 Main-Nodes) ---
            [
                {
                    type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/001.jpg', color: '#3498DB',
                    subs: [
                        { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/002.jpg', color: '#3498DB' },
                        { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/003.jpg', color: '#3498DB' },
                        { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/004.jpg', color: '#3498DB' },
                        { type: 'text', color: '#3498DB', text: 'Erste Performanzen Skizze mit Fiberglaszeltstangen' }
                    ]
                },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/008.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/006.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/012.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/017.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/020.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/025.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/027.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/029.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/032.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/036.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/039.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/041.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/043.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/050.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/0511.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/052.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/053.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/056.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/059.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/061.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/062.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/063.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/064.jpeg', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/065.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/068.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/072.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/077.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/078.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/081.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/083.jpeg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/085.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/090.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/091.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/092.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/101.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/112.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/113.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/114.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/115.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/116.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/117.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/118.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/119.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/120.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/121.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/122.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/123.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/124.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/125.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/126.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/127.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/128.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/129.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/130.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/132.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/133.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/134.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/135.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/136.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/140.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/141.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/152.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/153.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/1541.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/1551.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/156.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/157.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/158.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/159.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/1604.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/161.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/162.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/163.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/164.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/165.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/166.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/167.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/168.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/169.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/170.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/171.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/172.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/173.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/1741.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/175.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/1771.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/178.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/179.jpg', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/180.png', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/181.png', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/182.png', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/183.png', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/184.png', color: '#1F618D' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/185.jpg', color: '#1A5276' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/186.jpg', color: '#3498DB' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/187.jpg', color: '#2980B9' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/189.jpg', color: '#2471A3' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/0/sprints/190.jpg', color: '#1F618D' }
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
        materialSet: [
            { color: '#9B59B6', roughness: 0.7, metalness: 0.0, sheen: 1.0, sheenColor: '#D2B4DE', sheenRoughness: 0.5 },
            { color: '#8E44AD', roughness: 0.3, metalness: 0.0, clearcoat: 0.4 },
            { color: '#BB8FCE', roughness: 0.15, metalness: 0.0, transmission: 0.6, ior: 1.45, thickness: 0.3 },
            { color: '#7D3C98', roughness: 0.55, metalness: 0.05, iridescence: 0.6 },
            { color: '#AF7AC5', roughness: 0.8, metalness: 0.0, sheen: 0.7, sheenColor: '#E8DAEF', sheenRoughness: 0.6 },
        ],
        pages: [

            // --- Seite 0 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/flower-3.png', color: '#9B59B6' }
            ],

            // --- Seite 1 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-18%20at%2017.09.46%20(2).jpeg', color: '#9B59B6' }
            ],

            // --- Seite 2 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/WhatsApp%20Image%202025-12-23%20at%2021.40.23%20(1).jpeg', color: '#9B59B6' }
            ],

            // --- Seite 3 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/flower-1.png', color: '#9B59B6' }
            ],

            // --- Seite 4 (1 Main-Nodes) ---
            [
                { type: 'image', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/3.png', color: '#9B59B6' }
            ],

            // --- Seite 5 (1 Main-Nodes) ---
            [
                { type: 'video', url: 'https://raw.githubusercontent.com/DavidStHH/Website-Assets/main/assets/Sequenz%2001.mp4', color: '#9B59B6' }
            ]
        ]
    },

    // ===== Kapitel 4: displaydisplay =====
    {
        name: 'displaydisplay', color: '#F39C12',
        materialSet: [
            { color: '#F39C12', roughness: 0.2, metalness: 0.6, clearcoat: 0.3 },
            { color: '#E67E22', roughness: 0.4, metalness: 0.1, sheen: 0.5, sheenColor: '#F9E79F', sheenRoughness: 0.3 },
            { color: '#F5B041', roughness: 0.1, metalness: 0.0, transmission: 0.4, ior: 1.5 },
            { color: '#D68910', roughness: 0.5, metalness: 0.8 },
            { color: '#FAD7A0', roughness: 0.05, metalness: 0.0, transmission: 0.7, ior: 1.52, thickness: 0.4 },
        ],
        pages: [

            // --- Seite 0 (2 Main-Nodes) ---
            [
                { id: 'dd-foto1', type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/1.jpg', color: '#F39C12', connectsTo: ['dd-foto2'] },
                { id: 'dd-foto2', type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/10.jpg', color: '#E67E22' }
            ],

            // --- Seite 1 (5 Main-Nodes) ---
            [
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/11.jpg', color: '#F39C12' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/12.jpg', color: '#E67E22' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/13.jpg', color: '#D68910' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/14.jpg', color: '#B9770E' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/15.jpg', color: '#9C640C' }
            ],

            // --- Seite 2 (7 Main-Nodes) ---
            [
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/3.jpg', color: '#F39C12' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/4.jpg', color: '#E67E22' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/5.jpg', color: '#D68910' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/6.jpg', color: '#B9770E' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/7.jpg', color: '#9C640C' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/8.jpg', color: '#F39C12' },
                { type: 'image', url: 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/pictures/9.jpg', color: '#E67E22' }
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
function getChapterCount() {
    return LIBRARY.length;
}

/** Zaehlt die Seiten eines Kapitels. */
function getPageCount(chapterIdx) {
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
function getMainNodesForPage(chapterIdx, pageIdx) {
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
function getPageThumbnail(chapterIdx, pageIdx) {
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
function getPageSections(chapterIdx, pageIdx) {
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
var CHAPTER_DEFS = LIBRARY.map(function(ch) {
    return { name: ch.name, color: ch.color };
});
