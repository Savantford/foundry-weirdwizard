import WWCreatureSheet from './base-creature-sheet.mjs';

/**
 * Extend the WWActorSheet with some modifications
 * @extends {WWActorSheet}
*/
export default class WWNpcSheet extends WWCreatureSheet {

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'actor', 'npc'],
    window: {
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
    },
    actions: {
      // Edit mode:
      //normalizeResults: WWNpcSheet.#onNormalizeResults,
      //createResult: WWNpcSheet.#onCreateResult,
      //openResultSheet: WWNpcSheet.#onOpenResultSheet,
      //deleteResult: WWNpcSheet.#onDeleteResult,
      // View mode:
      //drawSpecificResult: WWNpcSheet.#onDrawSpecificResult,
      // Shared:
      //changeMode: WWNpcSheet.#onChangeMode,
      //lockResult: WWNpcSheet.#onLockResult,
      //drawResult: WWNpcSheet.#onDrawResult,
      //resetResults: WWNpcSheet.#onResetResults
    }
  }

  /** @override */
  static PARTS = {
    // Shared Parts:
    menu: { template: 'systems/weirdwizard/templates/actors/header/edit-mode.hbs' },
    // View Mode Parts:
    sidetabs: { template: 'systems/weirdwizard/templates/generic/side-tabs.hbs' },
    namestripe: { template: 'systems/weirdwizard/templates/actors/name-stripe.hbs' },
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
    // Edit Mode Parts:
    npcform: {
      template: 'systems/weirdwizard/templates/actors/npc/form.hbs',
      templates: [
        'systems/weirdwizard/templates/actors/tabs/npc-summary-item.hbs',
        'systems/weirdwizard/templates/actors/tabs/npc-summary-weapon.hbs',
        'systems/weirdwizard/templates/actors/tabs/list-entry.hbs'
      ]
    },
  }

  /**
   * Parts for each view
   */
  static MODE_PARTS = {
    edit: ["menu", "npcform"],
    view: ["menu", "sidetabs", "namestripe", "banner", "summary", "description", "effects"]
  };

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

  /* -------------------------------------------- */

  /** @override */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    const allowedParts = this.constructor.MODE_PARTS[this.mode];
    for ( const partId in parts ) {
      if ( !allowedParts.includes(partId) ) delete parts[partId];
    }
    console.log(parts)
    return parts;
  }
  
}