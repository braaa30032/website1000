/**
 * SHARED TEXT HELPERS
 * Fill-box text layout functions used by app.js and nav.js.
 * Each line fills the container width independently at its own font size.
 */

/** Split text: spaces separate, hyphens separate AND become own words */
export function splitFillBoxWords(text) {
    const clean = text.replace(/<[^>]*>/g, '');
    const tokens = [];
    let buf = '';
    for (let i = 0; i < clean.length; i++) {
        const ch = clean[i];
        if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
            if (buf) { tokens.push(buf); buf = ''; }
        } else if (ch === '-' || ch === '\u2010' || ch === '\u2011') {
            if (buf) { tokens.push(buf); buf = ''; }
            tokens.push('-');
        } else {
            buf += ch;
        }
    }
    if (buf) tokens.push(buf);
    return tokens;
}

/** Distribute words into numLines lines, balanced by visual width */
export function distributeToLines(ctx, words, numLines) {
    if (numLines >= words.length) return words.map(w => [w]);
    if (numLines <= 1) return [words.slice()];
    ctx.font = '100px sans-serif';
    const widths = words.map(w => ctx.measureText(w).width);
    const totalW = widths.reduce((a, b) => a + b, 0);
    const cumW = [];
    let sum = 0;
    for (let i = 0; i < widths.length; i++) { sum += widths[i]; cumW.push(sum); }
    const breaks = [];
    for (let b = 1; b < numLines; b++) {
        const target = totalW * b / numLines;
        const lo = breaks.length > 0 ? breaks[breaks.length - 1] : 0;
        const hi = words.length - (numLines - b);
        let bestIdx = lo, bestDist = Infinity;
        for (let j = lo; j < hi; j++) {
            const d = Math.abs(cumW[j] - target);
            if (d < bestDist) { bestDist = d; bestIdx = j + 1; }
        }
        if (bestIdx <= lo) bestIdx = lo + 1;
        breaks.push(bestIdx);
    }
    const lines = [];
    let prev = 0;
    for (let k = 0; k < breaks.length; k++) {
        lines.push(words.slice(prev, breaks[k]));
        prev = breaks[k];
    }
    lines.push(words.slice(prev));
    return lines.filter(l => l.length > 0);
}

/**
 * Compute fill-box layout: each line fills the width at its own font size.
 * Returns { lines: [{words, wordWidths, fontSize, lineH, gap}], totalH }
 */
export function computeFillBox(ctx, words, usableW, usableH) {
    const maxLines = Math.min(words.length, 12);
    let bestTotalH = 0, bestResult = null;
    const ref = 200, LS = 1.08;
    for (let numLines = 1; numLines <= maxLines; numLines++) {
        const dist = distributeToLines(ctx, words, numLines);
        let totalH = 0;
        const lineData = [];
        let valid = true;
        for (let li = 0; li < dist.length; li++) {
            const lw = dist[li];
            ctx.font = ref + 'px sans-serif';
            const natW = lw.map(w => ctx.measureText(w).width);
            const sumNat = natW.reduce((a, b) => a + b, 0);
            if (sumNat <= 0) { valid = false; break; }
            const gapCount = lw.length - 1;
            let fontSize = ref * usableW / sumNat;
            let gap = gapCount > 0 ? fontSize * 0.06 : 0;
            fontSize = ref * (usableW - gap * gapCount) / sumNat;
            gap = gapCount > 0 ? fontSize * 0.06 : 0;
            fontSize = ref * (usableW - gap * gapCount) / sumNat;
            if (fontSize < 4) { valid = false; break; }
            const lineH = fontSize * LS;
            totalH += lineH;
            ctx.font = Math.round(fontSize) + 'px sans-serif';
            const ww = lw.map(w => ctx.measureText(w).width);
            lineData.push({ words: lw, wordWidths: ww, fontSize, lineH, gap });
        }
        if (!valid || totalH > usableH + 1) continue;
        if (totalH > bestTotalH) {
            bestTotalH = totalH;
            bestResult = { lines: lineData, totalH };
        }
    }
    return bestResult;
}

/** Render fill-box layout into canvas context */
export function renderFillBox(ctx, layout, padX, padY, cvsW, cvsH, hAlign, vAlign) {
    const usH = cvsH - 2 * padY;
    const extraV = usH - layout.totalH;
    let yOff;
    if (vAlign === 'top') yOff = padY;
    else if (vAlign === 'bottom') yOff = padY + extraV;
    else yOff = padY + extraV / 2;

    ctx.textBaseline = 'top';
    let cumY = 0;
    for (let li = 0; li < layout.lines.length; li++) {
        const line = layout.lines[li];
        const y = yOff + cumY;
        let goRight;
        if (hAlign === 'left') goRight = false;
        else if (hAlign === 'right') goRight = true;
        else goRight = (li % 2 !== 0); /* alternate */

        ctx.font = Math.round(line.fontSize) + 'px sans-serif';
        if (goRight) {
            ctx.textAlign = 'right';
            let x = cvsW - padX;
            for (let wi = line.words.length - 1; wi >= 0; wi--) {
                ctx.fillText(line.words[wi], x, y);
                x -= line.wordWidths[wi] + line.gap;
            }
        } else {
            ctx.textAlign = 'left';
            let x = padX;
            for (let wi = 0; wi < line.words.length; wi++) {
                ctx.fillText(line.words[wi], x, y);
                x += line.wordWidths[wi] + line.gap;
            }
        }
        cumY += line.lineH;
    }
}qqqqqqq
