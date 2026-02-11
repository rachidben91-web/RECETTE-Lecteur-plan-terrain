/**
 * UI MANAGER – Mesures Terrain V4
 * Thème clair B3 glass-matte
 * Gère :
 *  - status bubble
 *  - scale badge
 *  - toolbars & boutons
 *  - palette de couleurs
 *  - composants UI génériques
 */

export const UI = {
    els: {},

    init() {
        this.cacheDOM();
        this.bindToolbarButtons();
        this.initColorPicker();
        this.initStatusBubble();
        this.initScaleBadge();
    },

    // -----------------------------
    // CACHE DOM
    // -----------------------------
    cacheDOM() {
        this.els.statusBubble = document.getElementById('statusBubble');
        this.els.scaleBadge = document.getElementById('scaleBadge');
        this.els.scaleValue = document.getElementById('scaleValue');
        this.els.scaleMini = document.getElementById('scaleMini');
        this.els.colorDots = [...document.querySelectorAll('.color-dot')];

        this.els.btnPan        = document.getElementById('btnPan');
        this.els.btnScale      = document.getElementById('btnScale');
        this.els.btnMeasure    = document.getElementById('btnMeasure');
        this.els.btnAnnot      = document.getElementById('btnAnnotation');
        this.els.btnText       = document.getElementById('btnText');
        this.els.btnUndo       = document.getElementById('btnUndo');
        this.els.btnDelete     = document.getElementById('btnDelete');
        this.els.btnSavePNG    = document.getElementById('btnSave');
        this.els.btnSavePDF    = document.getElementById('btnSavePDF');
        this.els.btnFullscreen = document.getElementById('btnFullscreen');
    },

    // -----------------------------
    // STATUS BUBBLE
    // -----------------------------
    initStatusBubble() {
        this._statusTimer = null;
    },

    showStatus(message, type = "normal") {
        const b = this.els.statusBubble;
        if (!b) return;

        b.textContent = message;
        b.className = "status-bubble glass visible";

        b.classList.remove("success", "warning", "error");
        if (type === "success") b.classList.add("success");
        if (type === "warning") b.classList.add("warning");
        if (type === "error")   b.classList.add("error");

        clearTimeout(this._statusTimer);
        this._statusTimer = setTimeout(() => {
            b.classList.remove("visible");
        }, 2200);
    },

    // -----------------------------
    // COLOR PICKER
    // -----------------------------
    initColorPicker() {
        this.els.colorDots.forEach(dot => {
            dot.addEventListener('click', () => {
                this.els.colorDots.forEach(d => {
                    d.classList.remove("selected");
                    d.setAttribute("aria-checked", "false");
                });
                dot.classList.add("selected");
                dot.setAttribute("aria-checked", "true");

                const color = dot.dataset.color;
                document.dispatchEvent(new CustomEvent("ui:color-change", { detail: color }));
            });
        });
    },

    // -----------------------------
    // SCALE BADGE
    // -----------------------------
    initScaleBadge() {
        if (!this.els.scaleBadge) return;
        this.els.scaleBadge.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("ui:scale-edit"));
            this.showStatus("Redéfinir l’échelle", "warning");
        });
    },

    updateScaleBadge(scale) {
        const badge = this.els.scaleBadge;
        if (!badge) return;

        if (!scale) {
            badge.classList.remove("ok", "compact");
            this.els.scaleValue.textContent = "Non détectée";
            this.els.scaleMini.textContent = "—";
            return;
        }

        badge.classList.add("ok", "compact");
        this.els.scaleValue.textContent = `1:${scale}`;
        this.els.scaleMini.textContent = `1:${scale}`;
    },

    // -----------------------------
    // TOOLBAR
    // -----------------------------
    bindToolbarButtons() {
        const bind = (btn, evt) => {
            if (!btn) return;
            btn.addEventListener("click", () => {
                document.dispatchEvent(new CustomEvent(evt));
            });
        };

        bind(this.els.btnPan, "ui:mode-pan");
        bind(this.els.btnScale, "ui:mode-scale");
        bind(this.els.btnMeasure, "ui:mode-measure");
        bind(this.els.btnAnnot, "ui:mode-annot");
        bind(this.els.btnText, "ui:mode-text");

        bind(this.els.btnUndo, "ui:undo");
        bind(this.els.btnDelete, "ui:delete");
        bind(this.els.btnSavePNG, "ui:save-png");
        bind(this.els.btnSavePDF, "ui:save-pdf");
        bind(this.els.btnFullscreen, "ui:fullscreen");
    },

    highlightMode(modeName) {
        const map = {
            pan: this.els.btnPan,
            scale: this.els.btnScale,
            measure: this.els.btnMeasure,
            annotation: this.els.btnAnnot,
            text: this.els.btnText
        };

        Object.values(map).forEach(b => b?.classList.remove("active"));
        map[modeName]?.classList.add("active");
    }
};
