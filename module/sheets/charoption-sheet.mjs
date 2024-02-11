import WWItemSheet from './item-sheet.mjs';

/**
 * Extend WWItemSheet with some very simple modifications
 * @extends {WWItemSheet}
*/

export default class WWCharOptionSheet extends WWItemSheet {
  
  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'item'],
      width: 600,
      height: 'auto'/*,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }]*/
    });
  }

  /** @override */
  get template() {
    const path = "systems/weirdwizard/templates/items";
    
    switch (this.item.type) {
      case 'Ancestry': return `${path}/ancestry-sheet.hbs`;
      case 'Profession': return `${path}/profession-sheet.hbs`;
      case 'Path': return `${path}/path-sheet.hbs`;
    }
    
  }
}