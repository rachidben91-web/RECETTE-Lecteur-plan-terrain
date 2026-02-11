/**
 * MEASURE FEATURE V4
 * - Mesure de distance
 * - Ligne fléchée
 * - Label dynamique
 */

import { State } from "../core/state.js";
import { CONFIG, MODES } from "../core/config.js";
import { Utils } from "../core/utils.js";
import { canvas, add, clearPreview } from "../renderer/canvas.js";

function buildArrow(size, color, strokeWidth) {
    const half = size / 2;
    const len = size * 0.9;

    return new fabric.Polyline([
        { x: -len, y: -half },
        { x: 0,    y: 0     },
        { x: -len, y: half  }
    ], {
        stroke: color,
        strokeWidth,
        fill: null,
        originX: "right",
        originY: "center",
        selectable: false,
        evented: false
    });
}

function buildMeasureLine(p1, p2, text, color) {
    const zoom = canvas.getZoom();
    const stroke = CONFIG.STROKE_WIDTH / zoom;

    const line = new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: color,
        strokeWidth: stroke,
        selectable: false,
        evented: false
    });

    const angle = Utils.angle(p1, p2);
    const arrowSize = Math.max(CONFIG.ARROW_SIZE / zoom, 6);

    const a1 = buildArrow(arrowSize, color, stroke);
    a1.set({ left: p1.x, top: p1.y, angle: angle + 180 });

    const a2 = buildArrow(arrowSize, color, stroke);
    a2.set({ left: p2.x, top: p2.y, angle });

    const mid = Utils.midpoint(p1, p2);
    const label = new fabric.Text(text, {
        left: mid.x,
        top: mid.y - (18 / zoom),
        originX: "center",
        originY: "center",
        fontFamily: "Segoe UI",
        fill: "#000",
        backgroundColor: "#ffffffcc",
        fontSize: 14 / zoom,
        fontWeight: 600,
        padding: 4,
        selectable: false,
        evented: false
    });

    return new fabric.Group([line, a1, a2, label], { selectable: true });
}

export const MeasureFeature = {

    finalize(p1, p2) {
        const distPx = Utils.distance(p1, p2);

        if (Utils.isTooSmall(distPx, CONFIG.MIN_DRAW_PX))
            return { ok: false, msg: "Distance trop courte" };

        if (!State.hasScale())
            return { ok: false, msg: "Pas d’échelle définie" };

        const meters = distPx / State.pixelsPerMeter;
        const txt = `${meters.toFixed(2)} m`;

        const g = buildMeasureLine(p1, p2, txt, State.currentColor);
        add(g);

        clearPreview();

        return { ok: true, msg: `Mesure : ${txt}` };
    }
};
