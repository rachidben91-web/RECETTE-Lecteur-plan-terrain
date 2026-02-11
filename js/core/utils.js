/**
 * UTILS V4 – fonctions utilitaires communes aux features et services
 */

export const Utils = {

    clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    },

    distance(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    },

    angle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
    },

    midpoint(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    },

    isTooSmall(px, min = 5) {
        return px < min;
    }
};
