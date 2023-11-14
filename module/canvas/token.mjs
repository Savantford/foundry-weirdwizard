import { mapRange } from './canvas-functions.mjs';

// Code base borrowed from SWADE game system. Thank you!
export default class WWToken extends Token {

  /** @override */
  _onUpdate(data, options, userId) {
    console.log('updated')
    //super._onUpdate(data, options, userId);
    
    //console.log(super.changed)
  }

  /* Flip Damage Bar Gradiant */
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

  /* Update Status Icons Display */

  updateStatusIcons() {
    const container = this.createIconContainer(); // Create container
    this.displayHealthIcon(container); // Add health icon
    if (this.combatant) this.displayTurnIcon(container); // Add turn icon
  }

  /**
   * Create an icon container for status icons.
  */
  createIconContainer() {
    
    this.children.find(c => c.name === "iconContainer")?.destroy();

    const tokenSize = canvas.grid.size * this.document.width;
    const iconSize = tokenSize / 5;

    // Set parameters
    const container = this.addChild(new PIXI.Container());
    container.name = "iconContainer";
    container.x = tokenSize - iconSize;
    container.y = tokenSize - 2*iconSize - iconSize/2;
    container.height = iconSize * 2;
    container.width = iconSize;
    
    // Reorder overlays
    this.setChildIndex(container, 0);

    return container;
  }

  /**
   * Display a health icon overlay
  */
  displayHealthIcon(container) {
    const injured = this.document.actor.injured,
      incapacitated = this.document.actor.incapacitated,
      dead = this.document.actor.dead;
    
    // Return if not injured, incapacitated or dead
    if (!(dead || incapacitated || injured)) return;

    const index = container.children.length;
    const tokenSize = canvas.grid.size * this.document.width;
    const iconSize = tokenSize / 5;

    let texture = PIXI.Texture.from('/icons/svg/blood.svg');
    if (dead) texture = PIXI.Texture.from('/icons/svg/skull.svg');
    else if (incapacitated) texture = PIXI.Texture.from('/icons/svg/unconscious.svg');
    
    // Set icon parameters
    const healthIcon = container.addChild(new PIXI.Sprite(texture));
    healthIcon.y = iconSize - iconSize * Math.floor(index/2);
    healthIcon.height = iconSize -1;
    healthIcon.width = iconSize -1;
    healthIcon.name = "healthIcon";
    healthIcon.tint = 0xFF0000;

    // Set icon background parameters
    const healthBg = container.addChild(new PIXI.Sprite(texture));
    healthBg.y = iconSize - iconSize * Math.floor(index/2);
    healthBg.height = iconSize;
    healthBg.width = iconSize;
    healthBg.name = "healthBg";
    healthBg.tint = 0x000000;
    
    // Reorder overlays
    const newIndex = container.children.length-1;
    container.setChildIndex(healthIcon, newIndex);
    container.setChildIndex(healthBg, newIndex-1);
  }

  /**
   * Display a combat turn icon overlay
  */
  displayTurnIcon(container) {
    
    const acted = this.combatant.flags.weirdwizard?.acted,
      takingInit = this.combatant.flags.weirdwizard?.takingInit,
      current = this.combatant == this.combatant.combat.combatant
    ;

    const index = container.children.length;
    const tokenSize = canvas.grid.size * this.document.width;
    const iconSize = tokenSize / 5;

    let texture = PIXI.Texture.from('/icons/svg/combat.svg');
    let tint = 0xFFFFFF;

    if (current) {
      texture = PIXI.Texture.from('/icons/svg/aura.svg');
      tint = 0x00DD00;
    } else if (acted) {
      texture = PIXI.Texture.from('/icons/svg/clockwork.svg');
      tint = 0xAAAAAA;
    } else if (takingInit) {
      texture = PIXI.Texture.from('/icons/svg/lightning.svg');
      tint = 0xDDDD00;
    }
    
    
    // Set icon parameters
    const turnIcon = container.addChild(new PIXI.Sprite(texture));
    turnIcon.y = iconSize - iconSize * Math.floor(index/2);
    turnIcon.height = iconSize -1;
    turnIcon.width = iconSize -1;
    turnIcon.name = "turnIcon";
    turnIcon.tint = tint;

    // Set icon background parameters
    const turnBg = container.addChild(new PIXI.Sprite(texture));
    turnBg.y = iconSize - iconSize * Math.floor(index/2);
    turnBg.height = iconSize;
    turnBg.width = iconSize;
    turnBg.name = "turnBg";
    turnBg.tint = 0x000000;
    
    // Reorder overlays
    const newIndex = container.children.length-1;
    container.setChildIndex(turnIcon, newIndex);
    container.setChildIndex(turnBg, newIndex-1);
  }

  /** @inheritdoc */
  _applyRenderFlags(flags) {
    super._applyRenderFlags(flags);
    
    this.updateStatusIcons();
  }

}
