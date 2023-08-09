import { rollPrompt } from './apps/roll-prompt.mjs'


/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */

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

    // Prepare enriched variables for editor.
    context.system.description.enriched = await TextEditor.enrichHTML(context.system.description.value, { async: true })

    if (context.item.type == 'Talent') {

    }

    // Prepare dropdown menu objects.
    switch (context.item.type) {
      case 'Container':

        break;

      case 'Weapon':
        context.gripObj = CONFIG.WEIRDWIZARD.dropdownGrip;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;

      case 'Ancestry':

        break;

      case 'Path':

        break;

      case 'Talent':
        context.sourcesObj = CONFIG.WEIRDWIZARD.dropdownSources;
        context.typesObj = CONFIG.WEIRDWIZARD.dropdownTypes;
        context.frequenciesObj = CONFIG.WEIRDWIZARD.dropdownFrequencies;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;

      case 'Spell':
        context.tiersObj = CONFIG.WEIRDWIZARD.dropdownTiers;
        //context.sourcesObj = CONFIG.WEIRDWIZARD.dropdownSources;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;
      
      case 'Aura (NPC)':
        context.frequenciesObj = CONFIG.WEIRDWIZARD.dropdownFrequencies;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;

      case 'Talent (NPC)':
        context.frequenciesObj = CONFIG.WEIRDWIZARD.dropdownFrequencies;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;
      case 'Weapon (NPC)':
        context.frequenciesObj = CONFIG.WEIRDWIZARD.dropdownFrequencies;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;
      case 'Action (NPC)':
        context.frequenciesObj = CONFIG.WEIRDWIZARD.dropdownFrequencies;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;
      case 'Reaction (NPC)':
        context.frequenciesObj = CONFIG.WEIRDWIZARD.dropdownFrequencies;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;
      case 'End of Round Effect (NPC)':
        context.frequenciesObj = CONFIG.WEIRDWIZARD.dropdownFrequencies;
        context.attributesObj = CONFIG.WEIRDWIZARD.dropdownAttributes;
        break;
    }

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
    //if (!this.options.editable) return;

    html.find('.rollable').click(ev => { //this._onRoll.bind(this)
      // Define variables to be used
      let label = '';
      let mod = '';
      let fixed = '';
      let system = this.object.system;
      //html.find('.rollable')

      // If the clicked element has a data-label, use it to determine the mod and label
      switch (ev.target.getAttribute('data-label')) {
        case 'Strength': {
          mod = system.attributes.str.mod;
          label = system.attributes.str.name;
          break;
        }
        case 'Agility': {
          mod = system.attributes.agi.mod;
          label = system.attributes.agi.name;
          break;
        }
        case 'Intellect': {
          mod = system.attributes.int.mod;
          label = system.attributes.int.name;
          break;
        }
        case 'Will': {
          mod = system.attributes.wil.mod;
          label = system.attributes.wil.name;
          break;
        }
      }

      new rollPrompt(this.actor, ev, label, mod, fixed).render(true)
    });
  }
}