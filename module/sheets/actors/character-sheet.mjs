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
    sidetabs: { template: 'systems/weirdwizard/templates/generic/side-tabs.hbs' },
    namestripe: { template: 'systems/weirdwizard/templates/sheets/actors/common/name-stripe.hbs' },
    banner: {
      template: 'systems/weirdwizard/templates/sheets/actors/character/banner.hbs',
      templates: [
        'systems/weirdwizard/templates/sheets/actors/common/portrait.hbs'
      ]
    },
    
    summary: {
      template: 'systems/weirdwizard/templates/sheets/actors/character/summary.hbs',
      templates: [
        'systems/weirdwizard/templates/sheets/actors/character/parts/summary-item.hbs',
        'systems/weirdwizard/templates/sheets/actors/character/parts/summary-weapon.hbs',
        'systems/weirdwizard/templates/generic/list-entry.hbs'
      ]
    },
    details: { template: 'systems/weirdwizard/templates/sheets/actors/character/details.hbs' },
    equipment: { template: 'systems/weirdwizard/templates/sheets/actors/character/equipment.hbs' },
    talents: { template: 'systems/weirdwizard/templates/sheets/actors/character/talents.hbs' },
    spells: { template: 'systems/weirdwizard/templates/sheets/actors/character/spells.hbs' },
    temporary: {
      template: 'systems/weirdwizard/templates/sheets/actors/common/temporary-effects.hbs',
      templates: [
        'systems/weirdwizard/templates/sheets/actors/common/parts/effect-card.hbs'
      ]
    },
    permanent: {
      template: 'systems/weirdwizard/templates/sheets/actors/common/permanent-effects.hbs',
      templates: [
        'systems/weirdwizard/templates/sheets/actors/common/parts/effect-row.hbs'
      ]
    }
  }

  /* -------------------------------------------- */

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        {id: 'summary',   tooltip: 'WW.Actor.Summary',                   icon: 'systems/weirdwizard/assets/icons/diploma.svg',      iconType: 'img' },
        {id: 'details',   tooltip: 'WW.Actor.Details',                   icon: 'systems/weirdwizard/assets/icons/scroll-quill.svg', iconType: 'img' },
        {id: 'equipment', tooltip: 'WW.Equipment.Label',                 icon: 'systems/weirdwizard/assets/icons/backpack.svg',     iconType: 'img' },
        {id: 'talents',   tooltip: 'WW.Talents.Label',                   icon: 'systems/weirdwizard/assets/icons/skills.svg',       iconType: 'img' },
        {id: 'spells',    tooltip: 'WW.Spells.Label',                    icon: 'systems/weirdwizard/assets/icons/spell-book.svg',   iconType: 'img' },
        {id: 'temporary', tooltip: 'WW.Effects.AfflictionsAndTemporary', icon: 'systems/weirdwizard/assets/icons/duration.svg',     iconType: 'img' },
        {id: 'permanent', tooltip: 'WW.Effects.Permanent',               icon: 'icons/svg/aura.svg',                                iconType: 'img' }
      ],
      initial: "summary",
      labelPrefix: "EFFECT.TABS"
    }
  };
}