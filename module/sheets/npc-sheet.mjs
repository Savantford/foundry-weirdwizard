import WWActorSheet from './actor-sheet.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {WWActorSheet}
*/

export default class WWNpcSheet extends WWActorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'actor', 'npc'],
    window: {
      icon: 'far fa-user'
    },
    position: {
      width: 600,
      height: 500
    }
  }

  static PARTS = {
    menu: { template: 'systems/weirdwizard/templates/actors/header/sheet-menu.hbs' },
    sidetabs: { template: 'systems/weirdwizard/templates/actors/header/side-tabs.hbs' },
    namestripe: { template: 'systems/weirdwizard/templates/actors/header/name-stripe.hbs' },
    banner: {
      template: 'systems/weirdwizard/templates/actors/header/npc-banner.hbs',
      templates: [
        'systems/weirdwizard/templates/actors/header/portrait.hbs'
      ]
    },
    
    summary: {
      template: 'systems/weirdwizard/templates/actors/tabs/npc-summary.hbs',
      templates: [
        'systems/weirdwizard/templates/actors/tabs/npc-summary-item.hbs',
        'systems/weirdwizard/templates/actors/tabs/npc-summary-weapon.hbs'
      ]
    },
    description: { template: 'systems/weirdwizard/templates/actors/tabs/npc-description.hbs' },
    effects: { template: 'systems/weirdwizard/templates/actors/tabs/effects.hbs' },
    
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Completely overriding the parts
    options.parts = ['menu', 'sidetabs', 'namestripe', 'banner', 'summary', 'description', 'effects'];
    
    return options;
  }
  
}