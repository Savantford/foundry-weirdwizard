import { onManageActiveEffect, onManageInstantEffect, prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { resizeInput } from '../helpers/utils.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
*/

export default class WWItemSheet extends ItemSheet {

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
    return `${path}/${this.item.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    context.system = context.data.system;

    // Prepare enriched variables for editor
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true, relativeTo: this.document })
    
    if (context.item.type == 'Equipment' && context.item.system.subtype == 'weapon' && context.system.attackRider.value) {
      context.system.attackRider.enriched = await TextEditor.enrichHTML(context.system.attackRider.value, { async: true })
    }

    context.system.attributeLabel = CONFIG.WW.ATTRIBUTES[context.system.attribute];

    // Prepare common dropdown menu objects
    context.attributesObj = CONFIG.WW.rollAttributes;
    context.againstObj = CONFIG.WW.rollAgainst;
    context.afflictionsObj = CONFIG.WW.bestowAfflictions;
    context.targetingMethods = CONFIG.WW.TARGETING_METHODS;
    context.templateTypes = CONFIG.WW.TEMPLATE_TYPES;

    // Prepare specific dropdown menu objects
    switch (context.item.type) {
  
      case 'Equipment':
        context.subtypesObj = CONFIG.WW.itemSubtypes;
        context.coinsObj = CONFIG.WW.coins;
        context.qualitiesObj = CONFIG.WW.itemQualities;
        //context.frequenciesObj = CONFIG.WW.dropdownFrequencies;
        context.armorObj = CONFIG.WW.armorTypes;

        if (context.system.subtype == 'weapon') {
          context.requirements = CONFIG.WW.weaponRequirements;
          context.gripObj = CONFIG.WW.weaponGrip;
          context.traits = CONFIG.WW.weaponTraits;
          context.advantages = CONFIG.WW.weaponAdvantages;
          context.disadvantages = CONFIG.WW.weaponDisadvantages;
          
        }

      break;

      case 'Trait or Talent':
        context.subtypesObj = CONFIG.WW.dropdownSubtypes;
        context.sourcesObj = CONFIG.WW.talentSources;
        //context.frequenciesObj = CONFIG.WW.dropdownFrequencies;
      break;

      case 'Spell':
        context.tiersObj = CONFIG.WW.dropdownTiers;
        //context.sourcesObj = CONFIG.WW.dropdownSources;
      break;
      
      case 'Ancestry':

      break;

      case 'Path':

      break;
      
    }

    // Prepare instant effects
    let instEffs = context.system.instant;

    instEffs.forEach((e,id) => {
      const obj = e;
      obj.locLabel = CONFIG.WW.instantLabels[e.label];
      obj.locTrigger = CONFIG.WW.instantTriggers[e.trigger];
      obj.locTarget = CONFIG.WW.effectTargets[e.target];
      obj.icon = CONFIG.WW.instantIcons[e.label];
      
      instEffs[id] = obj;
    })
    
    context.instantEffects = instEffs;

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.document.effects);
    
    for (const cat in context.effects) {
      const category = context.effects[cat];
      for (const e in category.effects) {
        const effect = category.effects[e];
        effect.locTrigger = CONFIG.WW.instantTriggers[effect.trigger];
        effect.locTarget = CONFIG.WW.effectTargets[effect.target];
      }
    }

    // Prepare effect change labels to display
    context.effectChangeLabels = CONFIG.WW.effectChangeLabels;

    // Pass down whether the item needs targets or not
    context.needTargets = this.document.needTargets;
    
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

    // Input resize
    resizeInput(html);

    const system = this.document.system;
    
    ////////////////// EFFECTS ////////////////////

    // Active Effect management
    html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.document));
    html.find('.instant-control').click(ev => onManageInstantEffect(ev, this.document));

  }

}
