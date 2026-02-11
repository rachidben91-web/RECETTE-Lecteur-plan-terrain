/**
 * OCR WORKER V4
 * - Multi zones
 * - Nettoyage de l’image
 * - Extraction robuste de l’échelle
 */

importScripts("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");

function preprocess(canvas) {
    const c = new OffscreenCanvas(canvas.width, canvas.height);
    const ctx = c.getContext("2d");

    ctx.drawImage(canvas, 0, 0);

    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data;

    for (let i = 0; i < d.length; i += 4) {
        let v = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

        v = (v - 128) * 1.1 + 128;
        v = v > 150 ? 255 : (v > 110 ? 190 : 0);

        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);
    return c;
}

async function detectScale(canvas, config) {
    const zones = config.CROP_ZONES;

    for (const z of zones) {
        const crop = new OffscreenCanvas(
            canvas.width * z.w,
            canvas.height * z.h
        );

        const ctx = crop.getContext("2d");
        ctx.drawImage(
            canvas,
            canvas.width * z.x,
            canvas.height * z.y,
            canvas.width * z.w,
            canvas.height * z.h,
            0, 0,
            canvas.width * z.w,
            canvas.height * z.h
        );

        const p = preprocess(crop);

        const result = await Tesseract.recognize(p, config.LANG);
        const txt = result.data.text.replace(/O/g, "0").replace(/o/g, "0");

        const m = txt.match(config.SCALE_REGEX);
        if (m) {
            const val = parseInt(m[1], 10);
            if (val >= config.MIN_SCALE && val <= config.MAX_SCALE) {
                return val;
            }
        }
    }

    return null;
}

onmessage = async (evt) => {
    const { canvas, config } = evt.data;

    const scale = await detectScale(canvas, config);
    postMessage({ scale });
};
