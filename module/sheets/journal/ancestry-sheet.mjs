import WWCharOptionSheet from './charoption-sheet.mjs';

/**
 * Extend the WWCharOptionSheet with some very simple modifications
 * @extends {WWCharOptionSheet}
*/

export default class WWAncestrySheet extends WWCharOptionSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['ancestry'],
    window: {
      icon: 'fa-solid fa-people-line'
    }
  }

  /** @inheritDoc */
  static EDIT_PARTS = {
    header: super.EDIT_PARTS.header,
    content: {
      template: 'systems/weirdwizard/templates/journal/ancestry-edit.hbs',
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
      template: "systems/weirdwizard/templates/journal/ancestry-view.hbs",
      templates: [
        'systems/weirdwizard/templates/journal/parts/journal-page-header.hbs'
      ],
      root: true
    }
  };

}