/**
 * Extend the basic Token Document with modifications.
 * @extends {TokenDocument}
*/

export default class WWTokenDocument extends foundry.documents.TokenDocument {

  /**
   * Convenient reference to the special movement traits on the associated actor.
   * @type {Set<string>}
   */
  get movementTraits() {
    const traits = this.actor?.system.listEntries?.movementTraits;
    return traits ? new Set(Object.keys(traits)) : new Set();
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _inferMovementAction() {
    // Flying creatures should always prefer it
    if (this.movementTraits.has("fly")) return "fly";
    // Prone should only Crawl
    else if (this.hasStatusEffect("prone")) return "crawl";
    else return super._inferMovementAction();
  }

  /* -------------------------------------------------- */

  /**
   * If the token's movementAction is invalid, force it to null (default).
   * @returns {Promise<boolean>} Whether the refresh has caused a change in movementAction.
   */
  async refreshMovementAction() {
    if (!CONFIG.Token.movement.actions[this.movementAction].canSelect(this)) {
      await this.update({ movementAction: null }, { diff: false });
      return true;
    }
    return false;
  }

  /* -------------------------------------------- */

  /**
   * Test whether a Token has a specific status effect.
   * @param {Array} statusIds     An array of status effect IDs as defined in CONFIG.statusEffects
   * @returns {boolean}           Does the Actor of the Token have any of these status effects?
   */
  hasAnyStatusEffect(statusIds) {
    return statusIds.some(statusId => this.actor?.statuses.has(statusId));
  }

  /* -------------------------------------------------- */

  /**
   * @override
   * Get the width and height of the Token in pixels.
   * @param {Partial<{width: number; height: number}>} [data] The width and/or height in grid units (must be positive)
   * @returns {{width: number; height: number}} The width and height in pixels
   */
  getSize(data={}) {
    let width = data.width ?? this.overrides.width ?? this.width;
    let height = data.height ?? this.overrides.width ?? this.height;

    const grid = this.parent?.grid ?? BaseScene.defaultGrid;
    if ( grid.isHexagonal ) {
      if ( grid.columns ) width = (0.75 * Math.floor(width)) + (0.5 * (width % 1)) + 0.25;
      else height = (0.75 * Math.floor(height)) + (0.5 * (height % 1)) + 0.25;
    }

    width *= grid.sizeX;
    height *= grid.sizeY;
    return {width, height};
  }

  /* -------------------------------------------------- */

  /** @override */
  /*getTrackedAttributes(data, path = []) {
    const attr = 0;/*super.getTrackedAttributes(data, path);
    
    if (path.length === 0) {
      attr.value.push(["stats", "damage", "value"], ["stats", "health", "total"]);
    }* /
    return attr;
  }*/
}
