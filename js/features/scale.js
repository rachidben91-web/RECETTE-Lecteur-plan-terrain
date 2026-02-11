/**
 * SCALE FEATURE V4
 * - Étape d’étalonnage
 * - Définition pixels-per-meter
 */

import { State } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { Utils } from "../core/utils.js";
import { clearPreview } from "../renderer/canvas.js";
import { Modal } from "../ui/modal.js";

export const ScaleFeature = {

    async finalize(p1, p2) {
        const distPx = Utils.distance(p1, p2);

        if (Utils.isTooSmall(distPx, CONFIG.MIN_DRAW_PX))
            return { ok: false, msg: "Distance trop courte" };

        const real = await Modal.open({
            title: "Étalonnage",
            label: "Distance réelle (en mètres)",
            placeholder: "1.00",
            type: "number",
            defaultValue: "1.00"
        });

        if (!real || Number(real) <= 0)
            return { ok: false, msg: "Étalonnage annulé" };

        const meters = Number(real);

        State.pixelsPerMeter = distPx / meters;
        State.detectedScale = null;

        // On calcule l'échelle : 1:n
        const n = Math.round(1 / (meters / distPx));
        document.dispatchEvent(new CustomEvent("ui:scale-update", { detail: n }));

        clearPreview();

        return { ok: true, msg: `Échelle définie (1:${n})` };
    }
};
