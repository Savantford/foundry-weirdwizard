import WWActorSheet from './actor-sheet.mjs';

/**
 * Extend the WWActorSheet with some modifications
 * @extends {WWActorSheet}
*/

export default class WWCharacterSheet extends WWActorSheet {
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'actor', 'character'],
    window: {
      icon: 'fa-solid fa-user',
      controls: super.DEFAULT_OPTIONS.window.controls.concat([ // Remove concat in V13
        {
          action: "startRest",
          icon: "fa-solid fa-campground",
          label: "WW.Rest.Label",
          ownership: "OWNER"
        }
      ])
    },
    position: {
      width: 850,
      height: 550
    }
  }

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