import WWItemSheet from './item-sheet.mjs';

/**
 * Extend the WWItemSheet with some very simple modifications
 * @extends {WWItemSheet}
*/

export default class WWTalentSheet extends WWItemSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'item', 'talent'],
    window: {
      icon: 'fas fa-cards'
    }
  }

}