/**
 * APP V4 – Contrôleur principal
 * Orchestration complète :
 *  - UI <-> Features <-> Renderer <-> Services
 *  - Gestion des modes
 *  - Input unifié (mouse + touch)
 *  - Sauvegardes par page
 *  - OCR auto
 */

import { UI } from "./ui/ui.js";
import { Modal } from "./ui/modal.js";

import { Events } from "./core/events.js";
import { State } from "./core/state.js";
import { CONFIG, MODES } from "./core/config.js";
import { Utils } from "./core/utils.js";

import { canvas, clientToCanvas, updatePreview, clearPreview,
         add, removeActive, removeLast, clearAll } from "./renderer/canvas.js";

import { PdfService } from "./services/pdf.service.js";
import { ExportService } from "./services/export.service.js";

import { MeasureFeature } from "./features/measure.js";
import { ScaleFeature } from "./features/scale.js";
import { AnnotationFeature } from "./features/annotation.js";
import { TextFeature } from "./features/text.js";


// -------------------------------------------------------------
// MODE SWITCH
// -------------------------------------------------------------
function setMode(mode) {
    State.mode = mode;

    UI.highlightMode(mode);

    // cacher la preview si on change de mode
    clearPreview();

    let msg = "";
    switch (mode) {
        case MODES.PAN:        msg = "Mode déplacement"; break;
        case MODES.SCALE:      msg = "Étalonnage : choisissez 2 points"; break;
        case MODES.MEASURE:    msg = "Mesure : choisissez 2 points"; break;
        case MODES.ANNOTATION: msg = "Cotation : choisissez 2 points"; break;
        case MODES.TEXT:       msg = "Texte : cliquez pour placer"; break;
    }

    UI.showStatus(msg, "normal");
}


// -------------------------------------------------------------
// INPUT UNIFIÉ (souris + tactile)
// -------------------------------------------------------------
let isDown = false;
let startPt = null;

function onInputDown(e) {
    if (!State.pdfDoc) return;

    const { clientX, clientY } = e.detail || e;
    const pt = clientToCanvas(clientX, clientY);

    isDown = true;
    startPt = pt;

    if (State.mode === MODES.TEXT) {
        // Placement immédiat
        TextFeature.place(pt).then(res => {
            if (res.ok) UI.showStatus(res.msg, "success");
            else UI.showStatus(res.msg, "warning");
        });
    }
}

function onInputMove(e) {
    if (!isDown || !startPt) return;
    if (!State.pdfDoc) return;

    const { clientX, clientY } = e.detail || e;
    const pt = clientToCanvas(clientX, clientY);

    // PAN mode (déplacement plan)
    if (State.mode === MODES.PAN) {
        const vpt = canvas.viewportTransform;
        vpt[4] += (clientX - State.dragX);
        vpt[5] += (clientY - State.dragY);
        canvas.requestRenderAll();
    }

    // PREVIEW line pour les autres modes
    if (State.mode !== MODES.PAN && State.mode !== MODES.TEXT) {
        updatePreview(startPt, pt, State.mode, State.currentColor);
    }

    State.dragX = clientX;
    State.dragY = clientY;
}

function onInputUp(e) {
    if (!isDown) return;
    isDown = false;

    const { clientX, clientY } = e.detail || e || {};
    if (clientX === undefined) return; // fin touch sans détail

    const endPt = clientToCanvas(clientX, clientY);
    const distPx = Utils.distance(startPt, endPt);

    // ANNULER preview si trop court
    if (Utils.isTooSmall(distPx, CONFIG.MIN_DRAW_PX)) {
        clearPreview();
        startPt = null;
        return;
    }

    // Mode SCALE
    if (State.mode === MODES.SCALE) {
        ScaleFeature.finalize(startPt, endPt).then(res => {
            if (res.ok) {
                UI.showStatus(res.msg, "success");
            } else {
                UI.showStatus(res.msg, "warning");
            }
        });
    }

    // Mode MESURE
    else if (State.mode === MODES.MEASURE) {
        const res = MeasureFeature.finalize(startPt, endPt);
        UI.showStatus(res.msg, res.ok ? "success" : "warning");
    }

    // Mode ANNOTATION
    else if (State.mode === MODES.ANNOTATION) {
        AnnotationFeature.finalize(startPt, endPt).then(res => {
            UI.showStatus(res.msg, res.ok ? "success" : "warning");
        });
    }

    clearPreview();
    startPt = null;
}


// -------------------------------------------------------------
// EVENTS UI
// -------------------------------------------------------------
function bindUIEvents() {

    // Modes
    document.addEventListener("ui:mode-pan",       () => setMode(MODES.PAN));
    document.addEventListener("ui:mode-scale",     () => setMode(MODES.SCALE));
    document.addEventListener("ui:mode-measure",   () => {
        if (!State.hasScale()) {
            UI.showStatus("Définissez une échelle d’abord", "warning");
            return setMode(MODES.SCALE);
        }
        setMode(MODES.MEASURE);
    });
    document.addEventListener("ui:mode-annot",     () => setMode(MODES.ANNOTATION));
    document.addEventListener("ui:mode-text",      () => setMode(MODES.TEXT));

    // Undo / Delete
    document.addEventListener("ui:undo", () => {
        if (removeLast()) UI.showStatus("Annulé", "normal");
    });

    document.addEventListener("ui:delete", () => {
        if (removeActive()) UI.showStatus("Supprimé", "normal");
    });

    // Exports
    document.addEventListener("ui:save-png", () => {
        ExportService.exportPNG().then(() => {
            UI.showStatus("PNG généré", "success");
        });
    });

    document.addEventListener("ui:save-pdf", () => {
        ExportService.exportPDF().then(() => {
            UI.showStatus("PDF généré", "success");
        });
    });

    // Plein écran
    document.addEventListener("ui:fullscreen", async () => {
        try {
            if (!document.fullscreenElement)
                await document.documentElement.requestFullscreen();
            else
                await document.exitFullscreen();
        } catch {
            UI.showStatus("Plein écran indisponible", "warning");
        }
    });

    // Couleur
    document.addEventListener("ui:color-change", e => {
        State.currentColor = e.detail;
        UI.showStatus("Couleur changée", "normal");
    });

    // Modification échelle après clic badge
    document.addEventListener("ui:scale-edit", () => setMode(MODES.SCALE));

    // Mise à jour du badge échelle
    document.addEventListener("ui:scale-update", e => {
        UI.updateScaleBadge(e.detail);
    });
}


// -------------------------------------------------------------
// PDF EVENTS
// -------------------------------------------------------------
function bindPDFEvents() {

    document.addEventListener("pdf:loaded", e => {
        UI.showStatus(`PDF chargé (${e.detail.count} pages)`, "success");
    });

    // Restauration page
    document.addEventListener("pdf:restorePage", e => {
        State.pixelsPerMeter = e.detail.ppm || 0;
        State.detectedScale  = e.detail.scale || null;
        UI.updateScaleBadge(State.detectedScale);
    });

    // OCR auto
    document.addEventListener("pdf:pageReady", e => {
        // Ici tu pourras brancher plus tard le Worker OCR
        // Je laisse le hook prêt mais vide pour l’instant :
        UI.showStatus(`Page ${e.detail.pageNumber} affichée`, "normal");
    });
}


// -------------------------------------------------------------
// FILE INPUT INIT
// -------------------------------------------------------------
function bindFileInput() {
    const input = document.getElementById("fileInput");
    input.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        UI.showStatus("Chargement PDF...", "normal");

        try {
            await PdfService.load(file);
        } catch (err) {
            console.error(err);
            UI.showStatus("Erreur chargement PDF", "error");
        }

        input.value = "";
    });
}


// -------------------------------------------------------------
// BOOTSTRAP APP
// -------------------------------------------------------------
export function bootApp() {

    console.log("🚀 Mesures Terrain V4 – initialization");

    // 1) UI & Modals
    UI.init();
    Modal.init();

    // 2) Canvas
    window.canvas = initCanvas();

    // 3) Core events
    Events.init();

    // Inputs
    document.addEventListener("input:down", onInputDown);
    document.addEventListener("input:move", onInputMove);
    document.addEventListener("input:up",   onInputUp);

    // 4) UI events
    bindUIEvents();

    // 5) PDF events
    bindPDFEvents();

    // 6) File Input
    bindFileInput();

    // 7) État initial
    State.currentColor = CONFIG.DEFAULT_COLOR;
    setMode(MODES.PAN);

    UI.updateScaleBadge(null);
    UI.showStatus("Bienvenue — ouvrez un PDF", "success");
}


// Lancer l’app
document.addEventListener("DOMContentLoaded", bootApp);
