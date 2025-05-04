import WWCharOptionSheet from './charoption-sheet.mjs';

/**
 * Extend the WWCharOptionSheet with some very simple modifications
 * @extends {WWCharOptionSheet}
*/

export default class WWTraditionSheet extends WWCharOptionSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'charoption', 'tradition'],
    window: {
      icon: 'fas fa-hand-holding-magic'
    }
  }

  /** @override */
  /*static PARTS = { // V2 only
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
    
  }*/

  /** @override */
  /*_configureRenderOptions(options) { // V2 only
    super._configureRenderOptions(options);
    
    // Completely overriding the parts
    options.parts = ['menu', 'sidetabs', 'namestripe', 'banner', 'summary', 'details', 'equipment', 'talents', 'spells', 'effects'];
    
    return options;
  }*/

}