/**
 * CANVAS ENGINE V4 – Mesures Terrain
 * Gestion du canvas Fabric, zoom/pan, rendu background, preview,
 * sérialisation/restauration, conversion de coordonnées.
 */

import { State } from "../core/state.js";
import { CONFIG, MODES } from "../core/config.js";
import { Utils } from "../core/utils.js";

export let canvas = null;

// -----------------------------------------------------
// INIT CANVAS
// -----------------------------------------------------
export function initCanvas() {
    canvas = new fabric.Canvas('mainCanvas', {
        selection: true,
        preserveObjectStacking: true
    });

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    canvas.on("mouse:wheel", onMouseWheel);

    return canvas;
}

// -----------------------------------------------------
// RESIZE
// -----------------------------------------------------
export function resizeCanvas() {
    if (!canvas) return;

    const wrapper = document.getElementById("canvasWrapper");

    canvas.setWidth(wrapper.clientWidth);
    canvas.setHeight(wrapper.clientHeight);

    clampViewport();
    canvas.requestRenderAll();
}

// -----------------------------------------------------
// ZOOM
// -----------------------------------------------------
export function clampZoom(z) {
    return Utils.clamp(z, State.initialZoom, CONFIG.MAX_ZOOM);
}

function onMouseWheel(e) {
    if (!State.pdfDoc) return;

    let zoom = canvas.getZoom();
    zoom *= 0.999 ** e.e.deltaY;
    zoom = clampZoom(zoom);

    canvas.zoomToPoint({ x: e.e.offsetX, y: e.e.offsetY }, zoom);

    clampViewport();
    canvas.requestRenderAll();

    e.e.preventDefault();
    e.e.stopPropagation();
}

// -----------------------------------------------------
// VIEWPORT LIMITS
// -----------------------------------------------------
export function clampViewport() {
    const bg = canvas.backgroundImage;
    if (!bg) return;

    const zoom = canvas.getZoom();
    const contentW = bg.width * zoom;
    const contentH = bg.height * zoom;

    const vpt = canvas.viewportTransform;

    // Horizontal
    if (contentW <= canvas.width) {
        vpt[4] = (canvas.width - contentW) / 2;
    } else {
        const minX = canvas.width - contentW;
        const maxX = 0;
        vpt[4] = Utils.clamp(vpt[4], minX, maxX);
    }

    // Vertical
    if (contentH <= canvas.height) {
        vpt[5] = (canvas.height - contentH) / 2;
    } else {
        const minY = canvas.height - contentH;
        const maxY = 0;
        vpt[5] = Utils.clamp(vpt[5], minY, maxY);
    }
}

// -----------------------------------------------------
// BACKGROUND PDF
// -----------------------------------------------------
export function setCanvasBackground(img) {
    canvas.clear();
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

    const wrapper = document.getElementById("canvasWrapper");

    const ratio = Math.min(
        wrapper.clientWidth / img.width,
        wrapper.clientHeight / img.height
    ) * 0.98;

    State.initialZoom = ratio;

    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        originX: "left",
        originY: "top",
        left: 0,
        top: 0,
        selectable: false,
        evented: false
    });

    resetView();
}

// -----------------------------------------------------
// RESET VIEW TO CENTER
// -----------------------------------------------------
export function resetView() {
    if (!canvas) return;

    canvas.setZoom(State.initialZoom);

    const bg = canvas.backgroundImage;
    const vpt = canvas.viewportTransform;

    vpt[0] = State.initialZoom;
    vpt[3] = State.initialZoom;

    vpt[4] = (canvas.width - bg.width * State.initialZoom) / 2;
    vpt[5] = (canvas.height - bg.height * State.initialZoom) / 2;

    clampViewport();
    canvas.requestRenderAll();
}

// -----------------------------------------------------
// COORDINATE CONVERSION
// -----------------------------------------------------
export function clientToCanvas(x, y) {
    const rect = document.getElementById("canvasWrapper").getBoundingClientRect();
    const px = x - rect.left;
    const py = y - rect.top;

    const pt = new fabric.Point(px, py);
    const inv = fabric.util.invertTransform(canvas.viewportTransform);
    const res = fabric.util.transformPoint(pt, inv);

    return { x: res.x, y: res.y };
}

// -----------------------------------------------------
// OBJECT MANAGEMENT
// -----------------------------------------------------
export function add(obj) {
    canvas.add(obj);
    canvas.requestRenderAll();
}

export function remove(obj) {
    if (!obj) return;
    canvas.remove(obj);
    canvas.requestRenderAll();
}

export function removeActive() {
    const actives = canvas.getActiveObjects();
    if (!actives?.length) return false;

    actives.forEach(o => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    return true;
}

export function removeLast() {
    const objs = canvas.getObjects().filter(o => o !== canvas.backgroundImage);
    if (!objs.length) return false;

    canvas.remove(objs[objs.length - 1]);
    canvas.requestRenderAll();

    return true;
}

export function clearAll() {
    canvas.getObjects().forEach(o => {
        if (o !== canvas.backgroundImage) canvas.remove(o);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
}

// -----------------------------------------------------
// SAVE / RESTORE
// -----------------------------------------------------
export function saveCanvasState() {
    return canvas.toDatalessJSON();
}

export function restoreCanvasState(json) {
    if (!json) return;

    canvas.getObjects().forEach(o => {
        if (o !== canvas.backgroundImage) canvas.remove(o);
    });

    canvas.loadFromJSON(json, () => {
        canvas.requestRenderAll();
    });
}

// -----------------------------------------------------
// PREVIEW LINE (used by features)
// -----------------------------------------------------
export function updatePreview(start, end, mode, color = "#333") {
    if (!State.input.preview) {
        State.input.preview = new fabric.Line(
            [start.x, start.y, end.x, end.y],
            {
                stroke: color,
                strokeWidth: CONFIG.STROKE_WIDTH / canvas.getZoom(),
                selectable: false,
                evented: false
            }
        );
        canvas.add(State.input.preview);
    } else {
        State.input.preview.set({ x2: end.x, y2: end.y });
        canvas.requestRenderAll();
    }
}

export function clearPreview() {
    if (State.input.preview) {
        canvas.remove(State.input.preview);
        State.input.preview = null;
    }
}
