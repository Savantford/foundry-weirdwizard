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
      classes: ["standard-form"],
      scrollable: [""],
      templates: [
        'systems/weirdwizard/templates/journal/parts/list-entry.hbs',
        'systems/weirdwizard/templates/journal/parts/item-reference.hbs'
      ]
    },
    footer: super.EDIT_PARTS.footer
  };

  /** @inheritDoc */
  static VIEW_PARTS = {
    content: {
      template: "systems/weirdwizard/templates/journal/profession-view.hbs",
      templates: [
        'systems/weirdwizard/templates/journal/parts/journal-page-header.hbs'
      ],
      root: true
    }
  };

}