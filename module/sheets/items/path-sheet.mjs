import WWItemSheet from './item-sheet.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {WWItemSheet}
*/

export default class WWCharOptionSheet extends WWItemSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'item', 'charOption'],
    window: {
      icon: 'fas fa-user'
    },
    position: {
      width: 560,
      height: 420
    }
  }

  /** @override */
  /*get template() {
    const path = "systems/weirdwizard/templates/items";
    
    switch (this.document.type) {
      case 'Ancestry': return `${path}/ancestry-sheet.hbs`;
      case 'Profession': return `${path}/profession-sheet.hbs`;
      case 'Path': return `${path}/path-sheet.hbs`;
    }
    
  }*/

  /** @override */
  static PARTS = {
    menu: { template: 'systems/weirdwizard/templates/actors/header/edit-mode.hbs' },
    sidetabs: { template: 'systems/weirdwizard/templates/actors/header/side-tabs.hbs' },
    namestripe: { template: 'systems/weirdwizard/templates/actors/header/name-stripe.hbs' },
    banner: {
      template: 'systems/weirdwizard/templates/actors/header/character-banner.hbs',
      templates: [
        'systems/weirdwizard/templates/actors/header/portrait.hbs'
      ]
    },
    
    summary: {
      template: 'systems/weirdwizard/templates/actors/tabs/character-summary.hbs',
      templates: [
        'systems/weirdwizard/templates/actors/tabs/character-summary-item.hbs',
        'systems/weirdwizard/templates/actors/tabs/character-summary-weapon.hbs'
      ]
    },
    details: { template: 'systems/weirdwizard/templates/actors/tabs/character-details.hbs' },
    equipment: { template: 'systems/weirdwizard/templates/actors/tabs/character-equipment.hbs' },
    talents: { template: 'systems/weirdwizard/templates/actors/tabs/character-talents.hbs' },
    spells: { template: 'systems/weirdwizard/templates/actors/tabs/character-spells.hbs' },
    effects: { template: 'systems/weirdwizard/templates/actors/tabs/effects.hbs' },
    
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Completely overriding the parts
    options.parts = ['menu', 'sidetabs', 'namestripe', 'banner', 'summary', 'details', 'equipment', 'talents', 'spells', 'effects'];
    
    return options;
  }

}