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