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

  /** @override */
  /*getTrackedAttributes(data, path = []) {
    const attr = 0;/*super.getTrackedAttributes(data, path);
    
    if (path.length === 0) {
      attr.value.push(["stats", "damage", "value"], ["stats", "health", "total"]);
    }* /
    return attr;
  }*/
}
