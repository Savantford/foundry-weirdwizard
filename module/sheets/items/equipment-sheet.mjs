import WWItemSheet from './item-sheet.mjs';

/**
 * Extend the WWItemSheet with some very simple modifications
 * @extends {WWItemSheet}
*/

export default class WWEquipmentSheet extends WWItemSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'item', 'equipment'],
    window: {
      icon: 'fa-solid fa-toolbox'
    }
  }

}