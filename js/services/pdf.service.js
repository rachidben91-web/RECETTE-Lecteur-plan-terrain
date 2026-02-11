/**
 * PDF SERVICE V4
 * - Chargement PDF
 * - Rendu HD (vers Fabric background)
 * - Gestion multi-pages
 * - Liaison Renderer V4
 */

import { State } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { setCanvasBackground } from "../renderer/canvas.js";

export const PdfService = {

    async load(file) {
        State.pdfDoc = null;
        State.pages.clear();
        State.currentPage = 1;

        const buffer = await file.arrayBuffer();
        const typed = new Uint8Array(buffer);
        
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        
        State.pdfDoc = await pdfjsLib.getDocument(typed).promise;
        State.pageCount = State.pdfDoc.numPages;

        document.dispatchEvent(new CustomEvent("pdf:loaded", {
            detail: { count: State.pageCount }
        }));

        await this.renderPage(1);
    },

    async renderPage(pageNumber) {
        if (!State.pdfDoc) return;

        State.currentPage = pageNumber;

        const page = await State.pdfDoc.getPage(pageNumber);

        const viewport = page.getViewport({ scale: CONFIG.PDF_RENDER_SCALE });

        // Canvas intermédiaire
        const c = document.createElement("canvas");
        c.width = viewport.width;
        c.height = viewport.height;

        const ctx = c.getContext("2d", { willReadFrequently: true });

        await page.render({ canvasContext: ctx, viewport }).promise;

        const url = c.toDataURL("image/png");

        await new Promise(resolve => {
            fabric.Image.fromURL(url, img => {
                setCanvasBackground(img);

                const saved = State.loadPageState(pageNumber);
                if (saved?.json) {
                    document.dispatchEvent(new CustomEvent("pdf:restorePage", { detail: saved }));
                }

                resolve();
            }, { crossOrigin: "anonymous" });
        });

        // OCR auto (lancé via event)
        document.dispatchEvent(new CustomEvent("pdf:pageReady", {
            detail: { pageNumber }
        }));
    },

    goTo(n) {
        n = Math.max(1, Math.min(State.pageCount, n));
        return this.renderPage(n);
    },

    next() {
        if (State.currentPage < State.pageCount) {
            return this.goTo(State.currentPage + 1);
        }
    },

    prev() {
        if (State.currentPage > 1) {
            return this.goTo(State.currentPage - 1);
        }
    }
};
