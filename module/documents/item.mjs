import WWDocumentMixin from "./ww-document.mjs";

/**
 * Extend the basic Item with some modifications.
 * @extends {Item}
*/
export default class WWItem extends WWDocumentMixin(Item) {

  /* -------------------------------------------- */
  /*  Document Creation                           */
  /* -------------------------------------------- */

  /**
   * @override
   * Determine default artwork based on the provided item data.
   * @param {ItemData} itemData  The source item data.
   * @returns {{img: string}}    Candidate item image.
   */
  static getDefaultArtwork(itemData) {
    const icon = {
      equipment: 'icons/svg/item-bag.svg',
      talent: 'icons/svg/card-hand.svg',
      spell: 'icons/svg/lightning.svg'
    }[itemData.type] ?? this.DEFAULT_ICON;

    return { img: icon };
  }

  /* -------------------------------------------- */

  async _preCreate(data, options, user) {
    let icon = data.img;
    
    // If no image is provided, set default by category.
    if (!icon) {

      switch (this.type) {
        case 'equipment':
          icon = '';
        break;
   
        case 'talent':
          icon = '';
        break;
  
        case 'spell':
          icon = '';
        break;
      }

    }

    await this.updateSource({ img: icon });
    
    return await super._preCreate(await data, options, user);
  }

  /* -------------------------------------------- */
  /*  Document Update                             */
  /* -------------------------------------------- */

  async _preUpdate(changes, options, user) {
    await super._preUpdate(changes, options, user);
    
    // Null heldBy if item has no actor
    if (!this.actor && this.system.heldBy) this.system.heldBy = null;

  }

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  get isActivity() {
    return (i.system.attribute || i.effects.size || i.system.instant.length);
  }

  /* -------------------------------------------- */

  /**
   * Check if item needs targets
   * @returns needTargets
  */ 
  get needTargets() {
    let need = false;
  
    // Check if an against attribute is checked
    if (this.system?.against) need = true;
  
    // Check if any Active Effect needs tokens as targets
    if (this.effects) {
      for (const e of this.effects) {
        if (e.target != 'none') need = true;
      }
    }
  
    // Check if any Active Effect needs tokens as targets
    if (this.system?.instant) {
      for (const e of this.system.instant) {
        if (e.target != 'none') need = true;
      }
    }
  
    return need;
  }

  /* -------------------------------------------- */

  get charOption() {
    if (this.type == 'Ancestry' || this.type == 'Profession' || this.type == 'Path') return true; else return false;
  }

}