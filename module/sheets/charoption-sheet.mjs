import WWItemSheet from './item-sheet.mjs';

/**
 * Extend WWItemSheet with some very simple modifications
 * @extends {WWItemSheet}
*/

export default class WWCharOptionSheet extends WWItemSheet {
  
  /** @override */
  static get defaultOptions() {
    
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'item', 'charoption'],
      width: 600,
      height: 420
    });
  }

  /** @override */
  get template() {
    const path = "systems/weirdwizard/templates/items";
    
    switch (this.document.type) {
      case 'Ancestry': return `${path}/ancestry-sheet.hbs`;
      case 'Profession': return `${path}/profession-sheet.hbs`;
      case 'Path': return `${path}/path-sheet.hbs`;
    }
    
  }

  constructor(object, options = {}) {
    super(object, options);
    
    this.position.width = this.document.type === 'Profession' ? 350 : 600;
  }
}