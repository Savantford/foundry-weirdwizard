import WWActorSheet from './base-creature-sheet.mjs';

/**
 * Extend the WWActorSheet with some modifications
 * @extends {WWActorSheet}
*/

export default class WWNpcSheet extends WWActorSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'actor', 'npc'],
    window: {
      icon: 'fa-regular fa-user',
      controls: [
        {
          action: "resetSheet",
          icon: "fa-solid fa-eraser",
          label: "WW.Actor.Reset",
          ownership: "OWNER"
        }
      ]
    },
    position: {
      width: 600,
      height: 500
    }
  }

  static PARTS = {
    menu: { template: 'systems/weirdwizard/templates/actors/header/edit-mode.hbs' },
    sidetabs: { template: 'systems/weirdwizard/templates/generic/side-tabs.hbs' },
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
        'systems/weirdwizard/templates/actors/tabs/npc-summary-weapon.hbs',
        'systems/weirdwizard/templates/actors/tabs/list-entry.hbs'
      ]
    },
    description: { template: 'systems/weirdwizard/templates/actors/tabs/npc-description.hbs' },
    effects: { template: 'systems/weirdwizard/templates/actors/tabs/effects.hbs' },
    
  }

  /* -------------------------------------------- */

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        {id: 'summary', tooltip: 'WW.Actor.Summary', iconType: 'img', icon: 'systems/weirdwizard/assets/icons/diploma.svg'},
        {id: 'description', tooltip: 'WW.Item.Description', icon: 'systems/weirdwizard/assets/icons/scroll-quill.svg', iconType: 'img'},
        {id: 'effects', tooltip: 'WW.Effects.Label', iconType: 'img', icon: '/icons/svg/aura.svg', iconType: 'img'}
      ],
      initial: "summary",
      labelPrefix: "EFFECT.TABS"
    }
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Completely overriding the parts
    options.parts = ['menu', 'sidetabs', 'namestripe', 'banner', 'summary', 'description', 'effects'];
    
    return options;
  }
  
}