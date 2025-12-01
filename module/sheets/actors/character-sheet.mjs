import WWCreatureSheet from './base-creature-sheet.mjs';

/**
 * Extend the WWActorSheet with some modifications
 * @extends {WWActorSheet}
*/
export default class WWCharacterSheet extends WWCreatureSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'actor', 'character'],
    window: {
      controls: [
        {
          action: "startRest",
          icon: "fa-solid fa-campground",
          label: "WW.Rest.Label",
          ownership: "OWNER"
        }
      ]
    },
    position: {
      width: 850,
      height: 550
    }
  }

  /** @override */
  static PARTS = {
    menu: { template: 'systems/weirdwizard/templates/generic/edit-mode.hbs' },
    sidetabs: { template: 'systems/weirdwizard/templates/generic/side-tabs.hbs' },
    namestripe: { template: 'systems/weirdwizard/templates/actors/name-stripe.hbs' },
    banner: {
      template: 'systems/weirdwizard/templates/actors/character/banner.hbs',
      templates: [
        'systems/weirdwizard/templates/actors/portrait.hbs'
      ]
    },
    
    summary: {
      template: 'systems/weirdwizard/templates/actors/character/summary.hbs',
      templates: [
        'systems/weirdwizard/templates/actors/character/parts/summary-item.hbs',
        'systems/weirdwizard/templates/actors/character/parts/summary-weapon.hbs',
        'systems/weirdwizard/templates/generic/list-entry.hbs'
      ]
    },
    details: { template: 'systems/weirdwizard/templates/actors/character/details.hbs' },
    equipment: { template: 'systems/weirdwizard/templates/actors/character/equipment.hbs' },
    talents: { template: 'systems/weirdwizard/templates/actors/character/talents.hbs' },
    spells: { template: 'systems/weirdwizard/templates/actors/character/spells.hbs' },
    effects: { template: 'systems/weirdwizard/templates/actors/effects.hbs' },
    
  }

  /* -------------------------------------------- */

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        {id: 'summary', tooltip: 'WW.Actor.Summary', iconType: 'img', icon: 'systems/weirdwizard/assets/icons/diploma.svg'},
        {id: 'details', tooltip: 'WW.Actor.Details', icon: 'systems/weirdwizard/assets/icons/scroll-quill.svg', iconType: 'img'},
        {id: 'equipment', tooltip: 'WW.Equipment.Label', icon: 'systems/weirdwizard/assets/icons/backpack.svg', iconType: 'img'},
        {id: 'talents', tooltip: 'WW.Talents.Label', icon: 'systems/weirdwizard/assets/icons/skills.svg', iconType: 'img'},
        {id: 'spells', tooltip: 'WW.Spells.Label', icon: 'systems/weirdwizard/assets/icons/spell-book.svg', iconType: 'img'},
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
    options.parts = ['menu', 'sidetabs', 'namestripe', 'banner', 'summary', 'details', 'equipment', 'talents', 'spells', 'effects'];
    
    return options;
  }

}