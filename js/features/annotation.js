/**
 * ANNOTATION FEATURE V4 – COTATION
 * - Ligne fléchée + valeur fournie par l’utilisateur
 */

import { State } from "../core/state.js";
import { Utils } from "../core/utils.js";
import { Modal } from "../ui/modal.js";
import { canvas, add, clearPreview } from "../renderer/canvas.js";
import { CONFIG } from "../core/config.js";

function buildAnnotLine(p1, p2, text, color) {
    const zoom = canvas.getZoom();
    const stroke = (CONFIG.STROKE_WIDTH * 1.4) / zoom;

    const line = new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: color,
        strokeWidth: stroke,
        selectable: false,
        evented: false
    });

    const angle = Utils.angle(p1, p2);
    const arrowSize = Math.max(CONFIG.ARROW_SIZE / zoom, 6);

    const a = (side) => {
        const arr = new fabric.Polyline([
            { x: -arrowSize*0.9, y: -arrowSize/2 },
            { x: 0,              y: 0            },
            { x: -arrowSize*0.9, y: arrowSize/2  }
        ], {
            stroke: color,
            strokeWidth: stroke,
            fill: null,
            originX: "right",
            originY: "center",
            selectable: false,
            evented: false
        });
        arr.angle = side;
        return arr;
    };

    const a1 = a(angle + 180);
    a1.set({ left: p1.x, top: p1.y });

    const a2 = a(angle);
    a2.set({ left: p2.x, top: p2.y });

    const mid = Utils.midpoint(p1, p2);
    const label = new fabric.Text(text, {
        left: mid.x,
        top: mid.y - (20 / zoom),
        originX: "center",
        originY: "center",
        fontFamily: "Segoe UI",
        fill: "#000",
        backgroundColor: "#ffffffcc",
        fontWeight: 700,
        fontSize: 14 / zoom,
        padding: 4,
        selectable: true
    });

    return new fabric.Group([line, a1, a2, label], { selectable: true });
}

export const AnnotationFeature = {

    async finalize(p1, p2) {
        const distPx = Utils.distance(p1, p2);
        if (Utils.isTooSmall(distPx, CONFIG.MIN_DRAW_PX))
            return { ok: false, msg: "Distance trop courte" };

        const val = await Modal.open({
            title: "Plan Minute – Cotation",
            label: "Entrez la valeur (m)",
            placeholder: "1.00",
            type: "number"
        });

        if (!val || Number(val) <= 0)
            return { ok: false, msg: "Cotation annulée" };

        const txt = `${Number(val).toFixed(2)} m`;

        const g = buildAnnotLine(p1, p2, txt, State.currentColor);
        add(g);

        clearPreview();

        return { ok: true, msg: `Cotation ajoutée : ${txt}` };
    }
};
