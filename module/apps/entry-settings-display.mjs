import { capitalize, i18n } from '../helpers/utils.mjs';
import WWDialog from './dialog.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend FormApplication to make windows to display a compendium more neatly
 * @extends {ApplicationV2}
*/

export class EntrySettingsDisplay extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'entry-settings-display',
    tag: 'div',
    classes: ['weirdwizard'],
    window: {
      icon: 'fa-solid fa-list'
    },
    actions: {
      addEntry: this.#addEntry,
      addSet: this.#addSet,
      editEntry: this.#editEntry,
      removeEntry: this.#removeEntry
    },
    position: {
      width: 400
    }
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    const type = this.options.listKey;
    
    return i18n(`WW.Settings.${capitalize(type, 1)}.Name`);
  }

  /* -------------------------------------------- */

  constructor(options = {}) {
    super(options); // This is required for the constructor to work

    const opt = this.options;
    
    // Record important data
    this.listKey = opt.listKey;
    this.settingName = 'available' + capitalize(this.listKey, 1);
    this.list = game.settings.get('weirdwizard', this.settingName);
  }

  /* -------------------------------------------- */

  static PARTS = {
    form: { template: 'systems/weirdwizard/templates/apps/entry-settings-display.hbs' }
  }

  /* -------------------------------------------- */
  /*  Context preparation                         */
  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {

    const context = {
      listTitle: i18n(`WW.Settings.${capitalize(this.listKey, 1)}.EntryType`),
      list: this.list
    }

    return context;
  }

  /* -------------------------------------------- */

  
  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Create dragDrop listener
    new DragDrop({ // Remove in v13; core implementation
      dragSelector: ".draggable",
      dropSelector: null,
      callbacks: {
        dragstart: this._onDragStart.bind(this)
      }
    }).bind(this.element);

  }
  
  /* -------------------------------------------- */
  /*  Entry actions                               */
  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} button - the capturing HTML element which defined a [data-action]
  */
  static async #addEntry(event, button) {
    const newList = {... this.list};

    // Show a dialog 
    const dialogInput = await WWDialog.input({
      window: {
        icon: "fa-solid fa-circle-plus",
        title: 'WW.Settings.Entry.Add',
      },
      content: await foundry.applications.handlebars.renderTemplate('systems/weirdwizard/templates/configs/list-entry-dialog.hbs', { showKey: true }),
      ok: {
        label: 'EFFECT.Submit',
        icon: 'fa-solid fa-save'
      },
      buttons: [
        {
          label: 'WW.System.Dialog.Cancel',
          icon: 'fa-solid fa-xmark'
        },
      ]
    });

    // Return if cancelled
    if (!dialogInput) return;

    // Return with warning if the key or name are missing
    if (!dialogInput.key || !dialogInput.name) return ui.notifications.warn(i18n('WW.Settings.Entry.EditWarning'));

    newList[dialogInput.key] = dialogInput;

    delete newList[dialogInput.key].key;
    
    // Update list and re-render
    this.list = await newList;

    this.render(true);
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} button - the capturing HTML element which defined a [data-action]
  */
  static #addSet(event, button) {
    
    // Fetch default lists
    const systemDefaults = {
      languages: CONFIG.WW.DEFAULT_LANGUAGES,
      senses: CONFIG.WW.DEFAULT_SENSES,
      immunities: CONFIG.WW.DEFAULT_IMMUNITIES,
      movementTraits: CONFIG.WW.DEFAULT_MOVEMENT_TRAITS,
      descriptors: CONFIG.WW.DEFAULT_DESCRIPTORS,
      weaponTraits: CONFIG.WW.DEFAULT_WEAPON_TRAITS,
      afflictions: CONFIG.WW.DEFAULT_AFFLICTIONS
    }

    // Update list with the default values
    this.list = {
      ...this.list,
      ...systemDefaults[this.listKey]
    };

    ui.notifications.info(i18n('WW.Settings.Entry.SetNotification'));

    this.render(true);
    
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} button - the capturing HTML element which defined a [data-action]
  */
  static async #editEntry(event, button) {
    const key = button.dataset.key;
    const newList = {... this.list};

    const context = {
      entry: await newList[key],
      key: key,
      showKey: true
    };

    // Show a dialog 
    const dialogInput = await WWDialog.input({
      window: {
        icon: "fa-solid fa-edit",
        title: 'WW.Settings.Entry.Edit',
      },
      content: await foundry.applications.handlebars.renderTemplate('systems/weirdwizard/templates/configs/list-entry-dialog.hbs', context),
      ok: {
        label: 'EFFECT.Submit',
        icon: 'fa-solid fa-save'
      },
      buttons: [
        {
          label: 'WW.System.Dialog.Cancel',
          icon: 'fa-solid fa-xmark'
        },
      ]
    });

    // Return if cancelled
    if (!dialogInput) return;

    // Return with warning if the key or name are missing
    if (!dialogInput.key || !dialogInput.name) return ui.notifications.warn(i18n('WW.Settings.Entry.EditWarning'));

    newList[key] = dialogInput;
    
    // Update list and re-render
    this.list = await newList;

    this.render(true);
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} button - the capturing HTML element which defined a [data-action]
  */
  static async #removeEntry(event, button) {
    const key = button.dataset.key;
    const newList = {... this.list};
    
    // Open a dialog to confirm
    const confirm = await WWDialog.confirm({
      window: {
        title: 'WW.Settings.Entry.Remove',
        icon: 'fa-solid fa-trash'
      },
      content: i18n('WW.Settings.Entry.RemoveDialog.Msg')
    });

    if (!confirm) return;

    // Delete and re-render
    delete newList[key];
    this.list = await newList;
    this.render(true);
  }

  /* -------------------------------------------- */
  /*  Drag and Drop                               */
  /* -------------------------------------------- */

  /**
   * An event that occurs when a drag workflow begins for a draggable item on the sheet.
   * @param {DragEvent} event       The initiating drag start event
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _onDragStart(event, test) {
    const li = event.currentTarget;

    const dragData =  {
      listKey: this.listKey,
      entryKey: li.dataset.entryKey,
      entryName: i18n(li.dataset.entryName),
      desc: li.dataset.tooltip
    };
    
    // Set data transfer
    if ( !dragData ) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

}