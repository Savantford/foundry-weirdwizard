import WWCharOptionSheet from './charoption-sheet.mjs';

/**
 * Extend the WWCharOptionSheet with some very simple modifications
 * @extends {WWCharOptionSheet}
*/

export default class WWTraditionSheet extends WWCharOptionSheet {

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['tradition'],
    window: {
      icon: 'fa-solid fa-hand-holding-magic'
    }
  }

  /** @inheritDoc */
  static EDIT_PARTS = {
    header: super.EDIT_PARTS.header,
    content: {
      template: 'systems/weirdwizard/templates/journal/tradition-edit.hbs',
      classes: ["standard-form"]
    },
    footer: super.EDIT_PARTS.footer
  };

  /** @inheritDoc */
  static VIEW_PARTS = {
    content: {
      template: "systems/weirdwizard/templates/journal/tradition-view.hbs",
      root: true
    }
  };

}