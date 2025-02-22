import WWItemSheet from './item-sheet.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {WWItemSheet}
*/

export default class WWEquipmentSheet extends WWItemSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'item', 'equipment'],
    window: {
      icon: 'fas fa-toolbox'
    }
  }

}