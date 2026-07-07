import WWDocumentMixin from "./ww-document.mjs";

/**
 * Extend the basic Item with some modifications.
 * @extends {Item}
*/
export default class WWItem extends WWDocumentMixin(foundry.documents.Item) {

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
    // Null heldBy if item has no actor
    if (!this.actor && this.system.heldBy) this.system.heldBy = null;

    await super._preUpdate(changes, options, user);
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
  */
  prepareDerivedData() {
    const sys = this.system;

    switch (this.type) {
      case 'spell':
        // Prepare castings label
        this.system.castingsLabel = sys.casting && (sys.casting.replace(/\s/g,'') !== '<p></p>') ? sys.casting : `<p>${sys.uses.max}</p>`;
      break;
    }
    
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
  /*  Methods                                     */
  /* -------------------------------------------- */

  async placeTemplate(options = {}) {
    const {
      type = "emanation",
      radius = 5,
      isAura = true,
      shape = CONST.TOKEN_SHAPES.RECTANGLE_1,
      ... params
    } = options;

    await canvas.regions.placeRegion({
      name: this.name,
      shapes: [{
        type: type,
        base: { type: "token", x: 0, y: 0, width: 1, height: 1, shape: shape },
        radius: radius * canvas.dimensions.distancePixels, // In yards
        gridBased: true
      }],
      color: game.user.color,
      restriction: { enabled: true },
      levels: [canvas.level.id],
      highlightMode: "coverage",
      displayMeasurements: true,
      visibility: CONST.REGION_VISIBILITY.ALWAYS,
      ownership: { [game.user.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
    }, { attachToToken: isAura });
  }

}