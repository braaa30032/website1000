/* ═══════════════════════════════════════════════════════════════
   THREE.js Bootstrap Module
   Imports Three.js + addons and exposes them on window.THREE
   so that classic (non-module) scripts like app.js can use them.
   ═══════════════════════════════════════════════════════════════ */
import * as THREE_NS from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Module namespace objects are frozen — spread into a plain mutable object
const THREE = Object.assign({}, THREE_NS, { GLTFLoader });
window.THREE = THREE;

console.log('[THREE-boot] Three.js r' + THREE.REVISION + ' + GLTFLoader ready on window.THREE');
