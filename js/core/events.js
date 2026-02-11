/**
 * EVENTS V4 – Unification mouse + touch + UI dispatch
 */

export const Events = {

    init() {
        this.bindMouse();
        this.bindTouch();
        this.bindUI();
    },

    // --------------------------
    // MOUSE
    // --------------------------
    bindMouse() {
        document.addEventListener("mousedown", e => {
            document.dispatchEvent(new CustomEvent("input:down", { detail: e }));
        });

        document.addEventListener("mousemove", e => {
            document.dispatchEvent(new CustomEvent("input:move", { detail: e }));
        });

        document.addEventListener("mouseup", e => {
            document.dispatchEvent(new CustomEvent("input:up", { detail: e }));
        });
    },

    // --------------------------
    // TOUCH
    // --------------------------
    bindTouch() {
        document.addEventListener("touchstart", e => {
            document.dispatchEvent(new CustomEvent("input:down", { detail: e.touches[0] }));
            e.preventDefault();
        }, { passive: false });

        document.addEventListener("touchmove", e => {
            document.dispatchEvent(new CustomEvent("input:move", { detail: e.touches[0] }));
            e.preventDefault();
        }, { passive: false });

        document.addEventListener("touchend", () => {
            document.dispatchEvent(new CustomEvent("input:up"));
        });
    },

    // --------------------------
    // UI EVENTS
    // --------------------------
    bindUI() {
        // Déjà dispatchés depuis ui.js (toolbar, palette…)
        // Ici on ne fait que centraliser si besoin d’extension plus tard.
    }
};
