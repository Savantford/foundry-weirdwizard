import WWCharOptionSheet from './charoption-sheet.mjs';

/**
 * Extend the WWCharOptionSheet with some very simple modifications
 * @extends {WWCharOptionSheet}
*/

export default class WWPathSheet extends WWCharOptionSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'charoption', 'path'],
    window: {
      icon: 'fa-solid fa-route'
    }
  }

}