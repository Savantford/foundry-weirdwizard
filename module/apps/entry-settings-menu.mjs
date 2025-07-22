import { capitalize, defaultListEntryKey, defaultListEntryName, i18n } from '../helpers/utils.mjs';
import WWDialog from './dialog.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend FormApplication to make windows to display a compendium more neatly
 * @extends {ApplicationV2}
*/

export class EntrySettingsMenu extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'entry-settings-menu',
    tag: 'form',
    window: {
      contentClasses: ['standard-form'],
      icon: 'fa-regular fa-scroll'
    },
    actions: {
      addEntry: this.#addEntry,
      addSet: this.#addSet,
      editEntry: this.#editEntry,
      removeEntry: this.#removeEntry
    },
    form: {
      handler: this.#submitHandler,
      closeOnSubmit: true
    },
    position: {
      width: 600
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
    form: { template: 'systems/weirdwizard/templates/apps/entry-settings-menu.hbs' },
    buttons: { template: 'templates/generic/form-footer.hbs' }
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
      list: this.list,
      buttons: [
        {type: "submit", icon: "fa-solid fa-save", label: "PERMISSION.Submit"},
        {type: "cancel", action: "cancel", icon: "fa-solid fa-xmark", label: "WW.System.Dialog.Cancel"}
      ]
    }

    return context;
  }

  /* -------------------------------------------- */
  /*  Form handling                               */
  /* -------------------------------------------- */

  /**
   * Handle form submission. The basic usage of this function is to set `#list`
   * when the form is valid and submitted, thus returning `config: null` when
   * cancelled, or non-`null` when successfully submitted. The `#list` property
   * should not be used to store data across re-renders of this application.
   * @this {DSApplication}
   * @param {SubmitEvent} event           The submit event.
   * @param {HTMLFormElement} form        The form element.
   * @param {FormDataExtended} formData   The form data.
   */
  static #submitHandler(event, form, formData) {
    return game.settings.set('weirdwizard', this.settingName, this.list);
  }

  /* -------------------------------------------- */
  /*  Entry actions                               */
  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} button - the capturing HTML element which defined a [data-action]
  */
  static async #addEntry(event, button) {
    const newList = {... this.list},
      listKey = this.listKey,
      entryKey = defaultListEntryKey(this.list, listKey),
      entryName = defaultListEntryName(this.list, listKey),
    entry = { name: entryName };

    const context = {
      entry: entry,
      key: entryKey,
      showKey: true,
      grantedBy: await fromUuid(entry.grantedBy) ?
        await foundry.applications.ux.TextEditor.implementation.enrichHTML(`@Embed[${entry.grantedBy} inline]`, { secrets: this.actor.isOwner }) : null
    };

    // Show a dialog 
    const dialogInput = await WWDialog.input({
      window: {
        icon: "fa-solid fa-circle-plus",
        title: 'WW.Settings.Entry.Add',
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
  static async #editEntry(event, button) {
    const newList = {... this.list};
    const entryKey = button.dataset.entryKey;
    
    const context = {
      entry: await newList[entryKey],
      key: entryKey,
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

    newList[dialogInput.key] = dialogInput;

    delete await newList[dialogInput.key].key;
    
    // Delete old key if key has changed
    if (entryKey !== dialogInput.key) delete newList[entryKey];
    
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
    const entryKey = button.dataset.entryKey;
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
    delete newList[entryKey];
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

}

/* Other Subclasses */
export class LanguagesMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { listKey: 'languages' };
}

export class SensesMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { listKey: 'senses' };
}

export class ImmunitiesMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { listKey: 'immunities' };
}

export class MovementTraitsMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { listKey: 'movementTraits' };
}

export class DescriptorsMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { listKey: 'descriptors' };
}

export class WeaponTraitsMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { listKey: 'weaponTraits' };
}

export class AfflictionsMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { listKey: 'afflictions' };
}

