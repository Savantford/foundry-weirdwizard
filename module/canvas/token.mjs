import { mapRange } from './canvas-functions.mjs';

// Code base borrowed from SWADE game system. Thank you!
export default class WWToken extends foundry.canvas.placeables.Token {

  /* Color macros */
  #blk = 0x000000;
  #wht = 0xFFFFFF;
  #red = 0xDD0000;
  #drd = 0x880000;
  #ddr = 0x440000;
  #grn = 0x00FF33;
  #ylw = 0xDDDD00;
  #gry = 0x999999;

  /* Flip Damage Bar Gradiant */
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
    let colorPct = Math.clamp(value, 0, max) / max;
    if (game.settings.get('weirdwizard', 'damageBarReverse')) {
      colorPct = Math.clamp(max-value, 0, max) / max;
    }
    const damageColor = WWToken.getDamageColor(value, max);
    
    // Determine the container size (logic borrowed from core)
    const w = this.w;
    let h = Math.max(canvas.dimensions.size / 12, 8);
    if (this.document.height >= 2) {
      h *= 1.6;
    }
    const stroke = Math.clamp(h / 8, 1, 2);

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
    // Create containers
    const TopContainer = this.createIconContainer('Top'), BottomContainer = this.createIconContainer('Bottom');
    
    // Add Health status icon
    this.displayHealthIcon(TopContainer);
    
    // Add turn status icon to bottom container
    if (this.combatant) this.displayTurnIcon(BottomContainer);
  }

  /**
   * Create an icon container for status icons.
  */
  createIconContainer(anchor) {
    this.children.find(c => c.name === `iconContainer${anchor}`)?.destroy();

    const tokenSize = canvas.grid.size * this.document.width;
    const iconSize = tokenSize / 4;
    const offset = 4;

    // Set parameters
    const container = this.addChild(new PIXI.Container());
    container.name = `iconContainer${anchor}`;
    container.x = tokenSize - iconSize + offset;

    switch (anchor) {
      case 'Top': container.y = - iconSize + 2 * offset; break;
      case 'Bottom': container.y = 2 * iconSize + 2 * offset; break;
    }
    
    container.height = iconSize;
    container.width = iconSize;
    
    // Reorder overlays
    this.setChildIndex(container, 2);

    return container;
  }

  /**
   * Display a health icon overlay
  */
  displayHealthIcon(container) {
    const injured = this.document.actor?.injured,
      incapacitated = this.document.actor?.incapacitated,
      dead = this.document.actor?.dead;
    
    // Return if not injured, incapacitated or dead
    if (!(dead || incapacitated || injured)) return;

    const index = container.children.length;
    const tokenSize = canvas.grid.size * this.document.width;
    const iconSize = tokenSize / 5;

    let texture = PIXI.Texture.from('/systems/weirdwizard/assets/icons/shattered-heart.svg');
    let tint = this.#drd;

    if (dead) {
      texture = PIXI.Texture.from('/icons/svg/skull.svg');
      tint = this.#blk;
    } else if (incapacitated) {
      texture = PIXI.Texture.from('/systems/weirdwizard/assets/icons/cross-mark.svg');
      tint = this.#ddr;
    }
    
    // Set icon parameters
    const healthIcon = container.addChild(new PIXI.Sprite(texture));
    healthIcon.y = iconSize - iconSize * Math.floor(index/2);
    healthIcon.height = iconSize;
    healthIcon.width = iconSize;
    healthIcon.name = "healthIcon";
    healthIcon.tint = tint;

    // Set icon background parameters
    const healthBg = container.addChild(new PIXI.Sprite(texture));
    healthBg.y = iconSize - iconSize * Math.floor(index/2);
    healthBg.height = iconSize;
    healthBg.width = iconSize;
    healthBg.name = "healthBg";
    healthBg.tint = this.#wht;

    // Background blur
    const blur = new PIXI.BlurFilter();
    blur.blur = 10;
    blur.quality = 20;
    healthBg.filters = [blur, blur];
    
    // Reorder overlays
    const newIndex = container.children.length-1;
    container.setChildIndex(healthIcon, newIndex);
    container.setChildIndex(healthBg, newIndex-1);
  }

  /**
   * Display a combat turn icon overlay
  */
  displayTurnIcon(container) {
    
    const combatant = this.combatant, acted = combatant.acted, takingInit = combatant.takingInit,
      current = combatant == combatant.combat.combatant,
      dispo = combatant.token.disposition
    ;

    const index = container.children.length;
    const tokenSize = canvas.grid.size * this.document.width;
    const iconSize = tokenSize / 5;

    let texture = PIXI.Texture.from('/systems/weirdwizard/assets/icons/skull-shield.svg');
    let tint = this.#drd;

    if (current) {
      texture = PIXI.Texture.from('/systems/weirdwizard/assets/icons/pointy-sword.svg');
      tint = this.#grn;
    } else if (acted) {
      texture = PIXI.Texture.from('/systems/weirdwizard/assets/icons/hourglass.svg');
      tint = this.#gry;
    } else if (takingInit) {
      texture = PIXI.Texture.from('/systems/weirdwizard/assets/icons/reactions.svg');
      tint = this.#ylw;
    } else if (combatant.actor?.type === 'character' || (combatant.actor?.type == 'npc' && dispo === 1)) {
      texture = PIXI.Texture.from('/systems/weirdwizard/assets/icons/heart-shield.svg');
      tint = this.#wht;
    }
    
    // Set icon parameters
    const turnIcon = container.addChild(new PIXI.Sprite(texture));
    turnIcon.y = iconSize - iconSize * Math.floor(index/2);
    turnIcon.height = iconSize;
    turnIcon.width = iconSize;
    turnIcon.name = "turnIcon";
    turnIcon.tint = tint;

    // Set icon background parameters
    const turnBg = container.addChild(new PIXI.Sprite(texture));
    turnBg.y = iconSize - iconSize * Math.floor(index/2);
    turnBg.height = iconSize;
    turnBg.width = iconSize;
    turnBg.name = "turnBg";
    turnBg.tint = combatant.actor?.type == 'npc' && dispo !== 1 ? this.#wht : this.#blk;
    
    // Background blur
    const blur = new PIXI.BlurFilter();
    blur.blur = 10;
    blur.quality = 20;
    turnBg.filters = [blur];
    
    // Reorder overlays
    const newIndex = container.children.length-1;
    container.setChildIndex(turnIcon, newIndex);
    container.setChildIndex(turnBg, newIndex-1);
  }

  /** @inheritdoc */
  _applyRenderFlags(flags) {
    super._applyRenderFlags(flags);
    
    if (this.actor.type !== 'group') this.updateStatusIcons();
  }

}
