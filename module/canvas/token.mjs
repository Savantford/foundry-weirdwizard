import { mapRange } from './canvas-functions.mjs';

// Code base borrowed from SWADE game system. Thank you!
export default class WWToken extends Token {
    #blk = 0x000000;

    static getDamageColor(current, max) {
        const minDegrees = 30;
        const maxDegrees = 120;

        // Get the degrees on the HSV wheel, going from 30° (greenish-yellow) to 120° (green)
        const degrees = mapRange(current, 0, max, minDegrees, maxDegrees);
        // Invert the degrees and map them from 0 to a third
        const hue = mapRange(maxDegrees - degrees, 0, maxDegrees, 0, 1 / 3);
        // Get a usable color value with 100% saturation and 90% value

        return Color.fromHSV([hue, 1, 0.9]);
    }
    
    _drawBar(number, bar, data) {
        if (data?.attribute === 'stats.damage') {
            return this._drawDamageBar(number, bar, data);
        }

        return super._drawBar(number, bar, data);
    }
    
    _drawDamageBar(number, bar, data) {
        const { value, max } = data;
        const colorPct = Math.clamped(value, 0, max) / max;
        const damageColor = WWToken.getDamageColor(value, max);

        // Determine the container size (logic borrowed from core)
        const w = this.w;
        let h = Math.max(canvas.dimensions.size / 12, 8);
        if (this.document.height >= 2)
            h *= 1.6;
        const stroke = Math.clamped(h / 8, 1, 2);

        // Set up bar container
        this._resetVitalsBar(bar, w, h, stroke);

        // Fill bar as damage increases, gradually going from green to red as it fills
        bar
            .beginFill(damageColor, 1.0)
            .lineStyle(stroke, this.#blk, 1.0)
            .drawRoundedRect(0, 0, colorPct * w, h, 2);
        
        // Position the bar according to its number
        this._setVitalsBarPosition(bar, number, h);
    }
   
    _resetVitalsBar(bar, width, height, stroke) {
        bar
            .clear()
            .beginFill(this.#blk, 0.5)
            .lineStyle(stroke, this.#blk, 1.0)
            .drawRoundedRect(0, 0, width, height, 3);
    }

    _setVitalsBarPosition(bar, order, height) {
        // Set position
        const posY = order === 0 ? this.h - height : 0;
        bar.position.set(0, posY);
    }
}