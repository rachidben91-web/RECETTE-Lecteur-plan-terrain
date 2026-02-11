/**
 * CONFIG V4 – Mesures Terrain
 * Configuration centrale et modes d’outils
 */

export const CONFIG = Object.freeze({

    APP_VERSION: "4.0.0",
    APP_NAME: "Mesures Terrain v4",

    // PDF rendering
    PDF_RENDER_SCALE: 2.5,
    EXPORT_MULTIPLIER: 3,

    // Zoom limits
    MAX_ZOOM: 20,
    MIN_ZOOM: 0.10,

    // Drawing rules
    MIN_DRAW_PX: 5,
    STROKE_WIDTH: 3,
    ARROW_SIZE: 14,

    // OCR parameters
    OCR: {
        LANG: "eng",
        MIN_SCALE: 10,
        MAX_SCALE: 5000,
        SCALE_REGEX: /1\s*[:\/.,-]\s*([0-9]{2,5})/,
        CROP_ZONES: [
            { x: 0.00, y: 0.00, w: 0.50, h: 0.30 }, // haut gauche
            { x: 0.50, y: 0.00, w: 0.50, h: 0.30 }, // haut droite
            { x: 0.00, y: 0.70, w: 0.50, h: 0.30 }  // bas gauche
        ]
    },

    // Colors defaults (terrain)
    COLORS: {
        ELEC: "#ff5252",
        GAZ: "#ffab00",
        EAU: "#00b0ff",
        TELECOM: "#00e676",
        FIBRE: "#e040fb"
    },

    DEFAULT_COLOR: "#ff5252"
});

// Modes d’outils
export const MODES = Object.freeze({
    PAN: "pan",
    SCALE: "scale",
    MEASURE: "measure",
    ANNOTATION: "annotation",
    TEXT: "text"
});
