/**
 * SHARED LETTER SYSTEM
 * 3D letter loading, caching, placeholder creation, text layout.
 * Used by nav.js and content3d.js.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LIBRARY } from '../../../library.js';

/* ── Config ── */
export const LETTER_BASE    = 'https://qahjdthakxhbrxkyorow.supabase.co/storage/v1/object/public/website_dateien/letters/';
export const LETTER_SPACING = -0.08;
export const LINE_SPACING   = 1.15;
export const LETTER_DEPTH   = 0.18;
export const QUADRANT_FILL  = 1.05;

/* ── Character width table ── */
export const WIDTH_TABLE = {
    'a': 0.65, 'b': 0.65, 'c': 0.58, 'd': 0.65, 'e': 0.60,
    'f': 0.45, 'g': 0.65, 'h': 0.65, 'i': 0.30, 'j': 0.35,
    'k': 0.62, 'l': 0.32, 'm': 0.90, 'n': 0.65, 'o': 0.68,
    'p': 0.65, 'q': 0.68, 'r': 0.48, 's': 0.55, 't': 0.48,
    'u': 0.65, 'v': 0.62, 'w': 0.90, 'x': 0.62, 'y': 0.60,
    'z': 0.58, '0': 0.68, '1': 0.40, '2': 0.60, '3': 0.58,
    '4': 0.62, '5': 0.58, '6': 0.62, '7': 0.55, '8': 0.62,
    '9': 0.62, ' ': 0.40, '-': 0.45,
};

/* ── Shared state ── */
const glbLoader = new GLTFLoader();
export const letterCache = {};
export let lettersAvailable = false;

/**
 * Load all letter GLBs needed for the given character set.
 * @param {Set<string>} neededChars - lowercase single chars
 * @returns {Promise<void>} resolves when all loaded
 */
export function loadLetterGLBs(neededChars) {
    return new Promise(resolve => {
        let loaded = 0;
        const total = neededChars.size;
        if (total === 0) { lettersAvailable = true; resolve(); return; }

        neededChars.forEach(ch => {
            if (letterCache[ch]) { loaded++; if (loaded >= total) { lettersAvailable = true; resolve(); } return; }
            const url = LETTER_BASE + ch + '.glb';
            glbLoader.load(url, gltf => {
                gltf.scene.rotation.x = Math.PI / 2;
                gltf.scene.updateMatrixWorld(true);

                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = new THREE.Vector3(); box.getSize(size);
                const center = new THREE.Vector3(); box.getCenter(center);

                letterCache[ch] = { scene: gltf.scene, capHeight: size.y, width: size.x, depth: size.z, centerOffset: center };
                loaded++;
                if (loaded >= total) {
                    lettersAvailable = true;
                    console.log('All letters loaded (' + total + ')');
                    resolve();
                }
            }, undefined, () => {
                loaded++;
                console.warn('Could not load ' + ch + '.glb');
                if (loaded >= total) { lettersAvailable = true; resolve(); }
            });
        });
    });
}

/**
 * Collect all unique characters needed from LIBRARY chapter names.
 */
export function collectNeededChars() {
    const needed = new Set();
    if (LIBRARY && LIBRARY.length) {
        LIBRARY.forEach(ch => {
            for (const c of ch.name.toLowerCase()) {
                if (c !== ' ') needed.add(c);
            }
        });
    }
    // Also add 'info' label characters
    for (const c of 'info') needed.add(c);
    return needed;
}

/**
 * Create a placeholder letter mesh (box-based, for use before GLBs load).
 */
export function createPlaceholderLetter(char, color) {
    const charLower = char.toLowerCase();
    const bw = WIDTH_TABLE[charLower] || 0.6;

    if (charLower === ' ') {
        const geo = new THREE.BoxGeometry(bw, 1, 0.01);
        const mat = new THREE.MeshBasicMaterial({ visible: false });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.letterWidth = bw;
        mesh.userData.isSpace = true;
        return mesh;
    }

    const geo = new THREE.BoxGeometry(bw, 1, LETTER_DEPTH, 2, 2, 1);
    const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness: 0.35,
        metalness: 0.05,
        clearcoat: 0.3,
        clearcoatRoughness: 0.2,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.letterWidth = bw;
    return mesh;
}

/**
 * Create a GLB-based letter mesh (clone from cache, normalize to cap-height = 1).
 */
export function createGLBLetter(char, color) {
    const charLower = char.toLowerCase();
    const cached = letterCache[charLower];
    if (!cached || !cached.scene) return null;

    const clone = cached.scene.clone(true);
    clone.traverse(child => {
        if (child.isMesh) {
            if (Array.isArray(child.material)) {
                child.material = child.material.map(m => m.clone());
            } else {
                child.material = child.material.clone();
            }
        }
    });

    const wrapper = new THREE.Group();
    const scale = 1.0 / cached.capHeight;
    clone.scale.set(scale, scale, scale);
    clone.position.set(
        -cached.centerOffset.x * scale,
        -cached.centerOffset.y * scale + 0.5,
        -cached.centerOffset.z * scale
    );

    wrapper.add(clone);
    wrapper.userData.letterWidth = cached.width * scale;
    wrapper.userData.isGLBLetter = true;
    return wrapper;
}

/**
 * Create a single letter mesh — tries GLB first, falls back to placeholder.
 */
export function createLetter(char, color) {
    if (lettersAvailable && letterCache[char.toLowerCase()]) {
        const mesh = createGLBLetter(char, color);
        if (mesh) return mesh;
    }
    return createPlaceholderLetter(char, color);
}

/**
 * Layout meshes into lines that best-fit a given area aspect ratio.
 * Returns array of { meshes, width } per line.
 */
export function layoutTextIntoLines(meshes, areaW, areaH) {
    let totalWidth = 0;
    meshes.forEach(m => { totalWidth += m.userData.letterWidth + LETTER_SPACING; });
    totalWidth -= LETTER_SPACING;

    const areaAspect = areaW / areaH;
    let numLines = 1;
    let bestFit = Infinity;

    for (let n = 1; n <= Math.min(meshes.length, 6); n++) {
        const lineW = totalWidth / n;
        const lineH = n * LINE_SPACING;
        const textAspect = lineW / lineH;
        const fit = Math.abs(Math.log(textAspect / areaAspect));
        if (fit < bestFit) { bestFit = fit; numLines = n; }
    }

    const charsPerLine = Math.ceil(meshes.length / numLines);
    const lines = [];
    let cursor = 0;

    for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
        const end = Math.min(cursor + charsPerLine, meshes.length);
        const lineMeshes = meshes.slice(cursor, end);

        let xPos = 0;
        lineMeshes.forEach(m => {
            m.position.x = xPos + m.userData.letterWidth / 2;
            m.position.y = -(lineIdx * LINE_SPACING);
            m.position.z = (Math.random() - 0.5) * LETTER_DEPTH * 2;
            m.rotation.z = (Math.random() - 0.5) * 0.06;
            m.rotation.x = (Math.random() - 0.5) * 0.08;
            xPos += m.userData.letterWidth + LETTER_SPACING;
        });

        const lineWidth = xPos - LETTER_SPACING;
        lineMeshes.forEach(m => { m.position.x -= lineWidth / 2; });
        lines.push({ meshes: lineMeshes, width: lineWidth });
        cursor = end;
    }

    return lines;
}

/**
 * Build a THREE.Group filled with 3D letter meshes for the given text,
 * scaled to fill the given area dimensions.
 *
 * @param {string} text
 * @param {number} areaW - available width in pixels
 * @param {number} areaH - available height in pixels
 * @param {string} color - hex color
 * @param {number} [chapterIdx] - for material moodboard
 * @returns {THREE.Group}
 */
export function buildLetterGroup(text, areaW, areaH, color, chapterIdx) {
    const group = new THREE.Group();
    if (!text || text.trim().length === 0) return group;

    const chars = text.toUpperCase().split('');
    const meshes = [];

    const materialSet = getChapterMaterialSet(chapterIdx);

    chars.forEach((char, idx) => {
        const matColor = materialSet
            ? materialSet[idx % materialSet.length].color
            : color;

        let mesh = createLetter(char, matColor);

        if (materialSet && !mesh.userData.isSpace) {
            const matDef = materialSet[idx % materialSet.length];
            applyMaterialPreset(mesh, matDef);
        }

        mesh.userData.char = char;
        meshes.push(mesh);
    });

    const lines = layoutTextIntoLines(meshes, areaW, areaH);
    lines.forEach(line => { line.meshes.forEach(m => group.add(m)); });

    const bbox = new THREE.Box3().setFromObject(group);
    const bsize = new THREE.Vector3(); bbox.getSize(bsize);
    if (bsize.x > 0 && bsize.y > 0) {
        const scaleX = (areaW * QUADRANT_FILL) / bsize.x;
        const scaleY = (areaH * QUADRANT_FILL) / bsize.y;
        const finalScale = Math.min(scaleX, scaleY);
        group.scale.setScalar(finalScale);

        const center = new THREE.Vector3(); bbox.getCenter(center);
        group.position.x -= center.x * finalScale;
        group.position.y -= center.y * finalScale;
    }

    return group;
}

/* ── Material Moodboard ── */

function getChapterMaterialSet(chapterIdx) {
    if (LIBRARY && LIBRARY[chapterIdx] && LIBRARY[chapterIdx].materialSet) {
        return LIBRARY[chapterIdx].materialSet;
    }
    return null;
}

export function applyMaterialPreset(obj, preset) {
    if (obj.userData.isSpace) return;

    const apply = (mat) => {
        if (!mat) return;
        if (preset.color) mat.color.set(preset.color);
        if (preset.roughness !== undefined) mat.roughness = preset.roughness;
        if (preset.metalness !== undefined) mat.metalness = preset.metalness;
        if (preset.transmission !== undefined) { mat.transmission = preset.transmission; mat.transparent = true; }
        if (preset.ior !== undefined) mat.ior = preset.ior;
        if (preset.thickness !== undefined) mat.thickness = preset.thickness;
        if (preset.clearcoat !== undefined) mat.clearcoat = preset.clearcoat;
        if (preset.clearcoatRoughness !== undefined) mat.clearcoatRoughness = preset.clearcoatRoughness;
        if (preset.sheen !== undefined) mat.sheen = preset.sheen;
        if (preset.sheenColor !== undefined) mat.sheenColor.set(preset.sheenColor);
        if (preset.sheenRoughness !== undefined) mat.sheenRoughness = preset.sheenRoughness;
        if (preset.iridescence !== undefined) mat.iridescence = preset.iridescence;
        if (preset.opacity !== undefined) { mat.opacity = preset.opacity; mat.transparent = true; }
        mat.needsUpdate = true;
    };

    if (obj.isMesh) {
        if (Array.isArray(obj.material)) obj.material.forEach(apply);
        else apply(obj.material);
    } else {
        obj.traverse(child => {
            if (child.isMesh) {
                if (Array.isArray(child.material)) child.material.forEach(apply);
                else apply(child.material);
            }
        });
    }
}
