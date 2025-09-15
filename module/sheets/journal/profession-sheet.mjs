import WWCharOptionSheet from './charoption-sheet.mjs';

/**
 * Extend the WWCharOptionSheet with some very simple modifications
 * @extends {WWCharOptionSheet}
*/

export default class WWProfessionSheet extends WWCharOptionSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['profession'],
    window: {
      icon: 'fa-solid fa-hammer'
    }
  }

  /** @inheritDoc */
  static EDIT_PARTS = {
    header: super.EDIT_PARTS.header,
    content: {
      template: 'systems/weirdwizard/templates/journal/profession-edit.hbs',
      classes: ["standard-form"]
    },
    footer: super.EDIT_PARTS.footer
  };

  /** @inheritDoc */
  static VIEW_PARTS = {
    content: {
      template: "systems/weirdwizard/templates/journal/profession-view.hbs",
      root: true
    }
  };

}