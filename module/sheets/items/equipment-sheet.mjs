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

  /** @override */
  static PARTS = {
    sidetabs: { template: 'systems/weirdwizard/templates/generic/side-tabs.hbs' },
    
    details: {
      template: 'systems/weirdwizard/templates/items/details/tab.hbs',
      templates: [
        'systems/weirdwizard/templates/items/header.hbs',
        'systems/weirdwizard/templates/items/banner.hbs',
        'systems/weirdwizard/templates/items/details/equipment-edit.hbs',
        'systems/weirdwizard/templates/items/details/equipment-view.hbs'
      ],
    },

    automation: {
      template: 'systems/weirdwizard/templates/items/automation/tab.hbs',
      templates: [
        'systems/weirdwizard/templates/items/automation/settings.hbs',
        'systems/weirdwizard/templates/items/automation/effects.hbs'
      ]
    }
    
  };

}