import WWItemSheet from './item-sheet.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {WWItemSheet}
*/

export default class WWProfessionSheet extends WWItemSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'item', 'charOption', 'profession'],
    window: {
      icon: 'fas fa-hammer'
    },
    position: {
      width: 500,
      height: 300
    }
  }

  /** @override */
  static PARTS = {
    sidetabs: { template: 'systems/weirdwizard/templates/items/header/side-tabs.hbs' },
    namestripe: { template: 'systems/weirdwizard/templates/items/header/name-stripe.hbs' },
    banner: {
      template: 'systems/weirdwizard/templates/items/header/character-banner.hbs',
      templates: [
        'systems/weirdwizard/templates/items/header/portrait.hbs'
      ]
    },
    
    details: {
      template: 'systems/weirdwizard/templates/items/tabs/profession-details.hbs',
      templates: [
        'systems/weirdwizard/templates/items/tabs/character-summary-item.hbs',
        'systems/weirdwizard/templates/items/tabs/character-summary-weapon.hbs'
      ]
    },
    effects: { template: 'systems/weirdwizard/templates/items/tabs/effects.hbs' },
    
  }

}