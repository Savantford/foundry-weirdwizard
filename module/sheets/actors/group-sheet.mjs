import { prepareActiveEffectCategories } from '../../helpers/effect-actions.mjs';
import WWSheetMixin from '../ww-sheet.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ActorSheetV2 = foundry.applications?.sheets?.ActorSheetV2 ?? (class {});

/**
 * Extend the basic ActorSheetV2 with modifications tailored for SotWW
 * @extends {ActorSheetV2}
 */
export default class WWGroupSheet extends WWSheetMixin(ActorSheetV2) {

  constructor(options = {}) {
    super(options); // Required for the constructor to work 
  }
  
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard', 'sheet', 'group'],
    tag: 'form',
    window: {
      icon: 'fa-solid fa-users',
      resizable: true,
      contentClasses: ['scrollable'],
      controls: [
      ]
    },
    actions: {
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 500,
      height: 500
    }
  }

  /* -------------------------------------------- */
  static PARTS = {
    main: { template: 'systems/weirdwizard/templates/actors/group/main.hbs' }
  }

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const actorData = this.actor;
    
    // Ensure editMode has a value
    if (this.editMode === undefined) this.editMode = false;
    
    const context = {
      actor: actorData, // Use a safe clone of the actor data for further operations.
    
      system: actorData.system, // Add the actor's data to context.system for easier access, as well as flags.
      folder: await actorData.folder,
      flags: actorData.flags,
      dtypes: ['String', 'Number', 'Boolean'],
      //tabs: this._getTabs(options.parts),
    }

    // Prepare Items
    context.items = this.actor.items.contents.toSorted((a, b) => a.sort - b.sort);
    //await this._prepareItems(context);

    // Add roll data for Prose Mirror editors
    context.rollData = actorData.getRollData();
    
    return context;
  }

  /** @override */
  async _preparePartContext(partId, context, options) {
    await super._preparePartContext(partId, context, options);

    switch (partId) {
      // Summmary tab
      case 'summary':
        context.tab = context.tabs[partId];
      break;
      
      // Details tab
      case 'details':
        context.tab = context.tabs[partId];
      break;
      
      // Equipment tab
      case 'equipment':
        context.tab = context.tabs[partId];
      break;
      
      // Talents tab
      case 'talents':
        context.tab = context.tabs[partId];
      break;
      
      // Spells tab
      case 'spells':
        context.tab = context.tabs[partId];
      break;
      
      // Description tab
      case 'description':
        context.tab = context.tabs[partId];
        context.system.descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description, { secrets: this.actor.isOwner });
      break;
      
      // Effects tab
      case 'effects':
        context.tab = context.tabs[partId];

        // Prepare all applied active effects
        context.appliedEffects = await prepareActiveEffectCategories(await this.actor.appliedEffects);
        
        for (const c in context.appliedEffects) {
          context.appliedEffects[c].effects = context.appliedEffects[c].effects.toSorted((a, b) => a.sort - b.sort)
        }

        // Prepare all embedded active effects
        context.effects = await prepareActiveEffectCategories(await this.actor.effects);

        for (const c in context.effects) {
          context.effects[c].effects = context.effects[c].effects.toSorted((a, b) => a.sort - b.sort)
        };
        
      break;
    }

    return context;
  }

  /* -------------------------------------------- */
  /*  General Event Listeners and Handlers        */
  /* -------------------------------------------- */


  /* -------------------------------------------- */
  /*  Miscellaneous actions                       */
  /* -------------------------------------------- */

  static #onToggleEditMode() {
    this.editMode = !this.editMode;
    
    this.render(true);
  }

  static async #onGroupRest() {
    // Rest all characters
  }

  /* -------------------------------------------- */
  /*  Utility methods                             */
  /* -------------------------------------------- */

  
  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

}