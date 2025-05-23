import WWItemSheet from './item-sheet.mjs';

/**
 * Extend the WWItemSheet with some very simple modifications
 * @extends {WWItemSheet}
*/

export default class WWSpellSheet extends WWItemSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'item', 'spell'],
    window: {
      icon: 'fa-solid fa-bolt-lightning'
    }
  }

}