/**
 * EXPORT SERVICE V4
 * - Fusion plan + objets
 * - Export PNG HD
 * - Export PDF HD
 */

import { State } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { canvas } from "../renderer/canvas.js";

export const ExportService = {

    _extractBackground() {
        const bg = canvas.backgroundImage;
        if (!bg || !bg._element) return null;

        const w = bg._element.naturalWidth || bg.width;
        const h = bg._element.naturalHeight || bg.height;

        return { img: bg._element, w, h };
    },

    async _buildComposite(mult = CONFIG.EXPORT_MULTIPLIER) {
        const bg = this._extractBackground();
        if (!bg) throw new Error("NO_BACKGROUND");

        const base = document.createElement("canvas");
        base.width = bg.w * mult;
        base.height = bg.h * mult;

        const bctx = base.getContext("2d");
        bctx.imageSmoothingEnabled = true;
        bctx.drawImage(bg.img, 0, 0, base.width, base.height);

        // Overlay
        const json = canvas.toDatalessJSON();
        delete json.backgroundImage;

        const off = new fabric.StaticCanvas(null, {
            width: bg.w,
            height: bg.h,
            backgroundColor: "transparent"
        });

        await new Promise(resolve => {
            off.loadFromJSON(json, () => {
                off.requestRenderAll();
                resolve();
            });
        });

        const overlayURL = off.toDataURL({
            format: "png",
            multiplier: mult,
            quality: 1
        });

        const overlayImg = await new Promise((ok, err) => {
            const i = new Image();
            i.src = overlayURL;
            i.onload = () => ok(i);
            i.onerror = err;
        });

        bctx.drawImage(overlayImg, 0, 0, base.width, base.height);

        return base.toDataURL("image/png");
    },

    async exportPNG() {
        const url = await this._buildComposite();

        const a = document.createElement("a");
        a.download = `mesures-terrain-page-${State.currentPage}.png`;
        a.href = url;
        a.click();
    },

    async exportPDF() {
        const url = await this._buildComposite();

        const { jsPDF } = window.jspdf;

        const img = new Image();
        img.src = url;

        await new Promise(r => (img.onload = r));

        const orientation = img.width > img.height ? "landscape" : "portrait";

        // format basé sur ratio
        let w = orientation === "landscape" ? 297 : 210;
        let h = orientation === "landscape" ? 210 : 297;

        const ratio = img.width / img.height;
        if (ratio > w / h) h = w / ratio;
        else w = h * ratio;

        const pdf = new jsPDF({ orientation, unit: "mm", format: [w, h] });
        pdf.addImage(url, "PNG", 0, 0, w, h);
        pdf.save(`mesures-terrain-page-${State.currentPage}.pdf`);
    }
};
