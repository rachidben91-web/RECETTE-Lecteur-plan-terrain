/**
 * GLOBAL STATE V4
 * Stocke l’état courant du projet, du canvas et du PDF
 */

import { MODES } from "./config.js";

export const State = {

    // --- Mode d’outil ---
    mode: MODES.PAN,

    // --- PDF ---
    pdfDoc: null,
    pageCount: 0,
    currentPage: 1,
    pages: new Map(), // { pageNumber: { json, scale, ppm } }

    // --- Échelle ---
    pixelsPerMeter: 0,
    detectedScale: null,

    // --- Zoom / Pan ---
    initialZoom: 0.1,
    isDragging: false,
    dragX: 0,
    dragY: 0,

    // --- Couleurs ---
    currentColor: null,

    // --- Input unifié ---
    input: {
        cursorX: 0,
        cursorY: 0,
        drawing: false,
        start: null,
        preview: null
    },

    // ---------------------------
    // RESET PAGE
    // ---------------------------
    resetPage() {
        this.pixelsPerMeter = 0;
        this.detectedScale = null;
    },

    // ---------------------------
    // SAVE PAGE STATE
    // ---------------------------
    savePageState(num, json) {
        this.pages.set(num, {
            json,
            scale: this.detectedScale,
            ppm: this.pixelsPerMeter
        });
    },

    loadPageState(num) {
        return this.pages.get(num) || null;
    },

    // ---------------------------
    // CONDITIONS
    // ---------------------------
    hasScale() {
        return this.pixelsPerMeter > 0;
    }
};
