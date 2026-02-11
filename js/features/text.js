/**
 * TEXT FEATURE V4 – Texte libre Plan Minute
 */

import { State } from "../core/state.js";
import { Modal } from "../ui/modal.js";
import { canvas, add } from "../renderer/canvas.js";

export const TextFeature = {

    async place(point) {
        const txt = await Modal.open({
            title: "Texte libre",
            label: "Entrez votre texte",
            placeholder: "",
            type: "text"
        });

        if (!txt?.trim())
            return { ok: false, msg: "Texte annulé" };

        const zoom = canvas.getZoom();

        const t = new fabric.Text(txt.trim(), {
            left: point.x,
            top:  point.y,
            originX: "center",
            originY: "center",
            fontFamily: "Segoe UI",
            fill: "#000",
            backgroundColor: "#ffffffdd",
            stroke: State.currentColor,
            strokeWidth: 0.6 / zoom,
            fontWeight: 600,
            padding: 6,
            fontSize: 16 / zoom,
            selectable: true,
            evented: true
        });

        add(t);

        return { ok: true, msg: "Texte ajouté" };
    }
};
