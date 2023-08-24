//import { rollAttribute } from './apps/roll-attribute.mjs' NOT NEEDED

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
*/

import { onManageActiveEffect, prepareActiveEffectCategories } from '../active-effects/effects.mjs';

export class WeirdWizardItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["weirdwizard", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/weirdwizard/templates/items";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;
    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `item-Weapon-sheet.hbs`
    return `${path}/item-${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    context.system = context.data.system;

    // Prepare enriched variables for editor
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true })
    
    if (context.item.type == 'Equipment' && context.item.system.subtype == 'weapon' && context.system.attackRider.value) {
      context.system.attackRider.enriched = await TextEditor.enrichHTML(context.system.attackRider.value, { async: true })
    }

    // Prepare dropdown menu objects.
    switch (context.item.type) {
  
      case 'Equipment':
        context.subtypesObj = CONFIG.WW.itemSubtypes;
        context.coinsObj = CONFIG.WW.coins;
        context.qualitiesObj = CONFIG.WW.itemQualities;
        context.attributesObj = CONFIG.WW.dropdownAttributes;
        //context.frequenciesObj = CONFIG.WW.dropdownFrequencies;
        context.armorObj = CONFIG.WW.armorTypes;

        if (context.system.subtype == 'weapon') {
          context.gripObj = CONFIG.WW.weaponGrip;
          context.properties = CONFIG.WW.weaponProperties;
        }

      break;

      case 'Trait or Talent':
        context.subtypesObj = CONFIG.WW.dropdownSubtypes;
        context.sourcesObj = CONFIG.WW.talentSources;
        //context.frequenciesObj = CONFIG.WW.dropdownFrequencies;
        context.attributesObj = CONFIG.WW.dropdownAttributes;
      break;

      case 'Spell':
        context.tiersObj = CONFIG.WW.dropdownTiers;
        //context.sourcesObj = CONFIG.WW.dropdownSources;
        context.attributesObj = CONFIG.WW.dropdownAttributes;
      break;
      
      case 'Ancestry':

      break;

      case 'Path':

      break;
      
    }

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.object.effects);

    // Prepare effect change key-labels
    context.effectChangeKeys = CONFIG.WW.effectChangeKeys;
    
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    const system = this.object.system;
    
    ////////////////// EFFECTS ////////////////////

    // Active Effect management
    html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.object));

  }

}
