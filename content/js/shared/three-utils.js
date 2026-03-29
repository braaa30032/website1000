/* Shared Three.js utilities — used by nav.js */
import * as THREE from 'three';

export function createEnvMap() {
    const size = 256;
    const data = new Float32Array(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const t = y / size;
            data[i]     = 0.85 + 0.15 * t;
            data[i + 1] = 0.85 + 0.15 * t;
            data[i + 2] = 0.9 + 0.1 * t;
            data[i + 3] = 1.0;
        }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.needsUpdate = true;
    return tex;
}
