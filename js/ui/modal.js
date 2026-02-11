/**
 * MODAL V4 – verre mat, focus trap, thème B3
 */

export const Modal = {
    els: {},

    init() {
        this.cacheDOM();
        this.bindEvents();
    },

    cacheDOM() {
        this.els.overlay = document.getElementById("modalOverlay");
        this.els.dialog  = document.getElementById("modalDialog");
        this.els.title   = document.getElementById("modalTitle");
        this.els.label   = document.getElementById("modalLabel");
        this.els.input   = document.getElementById("modalInput");
        this.els.btnOK   = document.getElementById("modalConfirm");
        this.els.btnCancel = document.getElementById("modalCancel");
    },

    bindEvents() {
        this.els.btnOK.addEventListener("click", () => this.close("ok"));
        this.els.btnCancel.addEventListener("click", () => this.close("cancel"));

        document.addEventListener("keydown", e => {
            if (e.key === "Escape" && this.isOpen()) {
                e.preventDefault();
                this.close("cancel");
            }
        });

        this.els.overlay.addEventListener("mousedown", e => {
            if (e.target === this.els.overlay) this.close("cancel");
        });
    },

    trapFocus(e) {
        const focusables = [...this.els.dialog.querySelectorAll("button,input")];
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];

        if (e.key !== "Tab") return;

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    },

    open({ title, label, placeholder = "", type = "text", defaultValue = "" }) {
        this.promise = null;
        this.els.title.textContent = title;
        this.els.label.textContent = label;
        this.els.input.type = type;
        this.els.input.value = defaultValue;
        this.els.input.placeholder = placeholder;

        this.els.overlay.classList.add("visible");

        setTimeout(() => {
            this.els.input.focus();
        }, 100);

        return new Promise(resolve => {
            this._resolver = resolve;
            this.els.dialog.addEventListener("keydown", this._trapHandler = e => this.trapFocus(e));
        });
    },

    close(action) {
        this.els.overlay.classList.remove("visible");
        this.els.dialog.removeEventListener("keydown", this._trapHandler);

        if (this._resolver) {
            if (action === "ok") this._resolver(this.els.input.value || null);
            else this._resolver(null);
        }
    },

    isOpen() {
        return this.els.overlay.classList.contains("visible");
    }
};
