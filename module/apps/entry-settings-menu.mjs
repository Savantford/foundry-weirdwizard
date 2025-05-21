import { capitalize, i18n } from '../helpers/utils.mjs';
import { WWAfflictions } from '../helpers/afflictions.mjs'

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend FormApplication to make windows to display a compendium more neatly
 * @extends {ApplicationV2}
*/

class EntrySettingsMenu extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'entry-settings-menu',
    tag: 'form',
    window: {
      contentClasses: ['standard-form'],
      icon: 'far fa-scroll'
    },
    actions: {
      collapseSection: this.#collapseSection,
      clearAfflictions: this.#clearAfflictions
    },
    form: {
      closeOnSubmit: true
    },
    position: {
      width: 600
    }
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    const type = this.options.entryType;
    
    return i18n(`WW.Settings.${capitalize(type, 1)}.Name`);
  }

  /* -------------------------------------------- */

  static PARTS = {
    form: { template: 'systems/weirdwizard/templates/apps/entry-settings-menu.hbs' },
    buttons: { template: 'templates/generic/form-footer.hbs' }
  }

  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const opt = this.options,
      type = opt.entryType,
      setting = 'available' + capitalize(type, 1),
      listTitle = i18n(`WW.Settings.${capitalize(type, 1)}.EntryType`),
    list = game.settings.get('weirdwizard', setting);
    
    const context = {
      listTitle: listTitle,
      list: list,
      buttons: [
        {type: "reset", action: "reset", icon: "fa-solid fa-sync", label: "PERMISSION.Reset"},
        {type: "submit", icon: "fa-solid fa-save", label: "PERMISSION.Submit"}
      ]
    }

    return context;
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #collapseSection(event, target) {
    
    const section = target.closest('.mc-section');
    const grid = section.querySelector('.choices-grid');
    
    // Flip states
    if (target.classList.contains('fa-circle-chevron-up')) {
      target.classList.replace('fa-circle-chevron-up', 'fa-circle-chevron-down');

      $(grid).slideDown(500);
      
    } else {
      target.classList.replace('fa-circle-chevron-down', 'fa-circle-chevron-up');

      $(grid).slideUp(500);
      
    }
    
  }

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #clearAfflictions(event, target) {
    WWAfflictions.clearAfflictions(this.document);
  }

  /**
   * Process form submission for the sheet
   * @this {MyApplication}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async formHandler(event, form, formData) {
    
    const opt = this.options;

    // Return if cancel button is clicked
    if (event.submitter.value === 'cancel') return;
    
    const obj = await formData.object;
    
    // Handle Attack Rider
    if (obj['attackRider.name'] || obj['attackRider.value']) {
      obj['system.attackRider.value'] = obj['attackRider.value'];
      delete obj['attackRider.value'];

      obj['system.attackRider.name'] = obj['attackRider.name'];
      delete obj['attackRider.name'];
    }

    // Handle specific purposes
    switch (opt.purpose) {

      case 'editWeaponTraits':
        opt.document.update(obj);
      break;

      // Update Afflictions
      case 'updateAfflictions':
        const checkedAffs = Object.fromEntries(Object.entries(obj).filter(([_, v]) => v));
        
        for (const aff in CONFIG.WW.AFFLICTIONS) {
          
          if (checkedAffs[aff]) {
            const affliction = CONFIG.statusEffects.find(a => a.id === aff);
            
            if (affliction && !opt.document.effects.find(e => e.statuses.has(aff))) {
              affliction['statuses'] = [affliction.id];
              
              await ActiveEffect.create(affliction, {parent: opt.document});
            }

          } else {
            const affliction = opt.document.effects.find(e => e.statuses.has(aff));
            
            if (affliction) await affliction.delete();
          }

        }
        
      break;

      // Chat Effect Application
      case 'applyEffect':
        const selected = Object.fromEntries(Object.entries(obj).filter(([_, v]) => v));

        const value = opt.dataset.value,
          effect = opt.dataset.effectUuid;

        for (const uuid in selected) {

          const target = await fromUuid(uuid);

          switch (opt.dataset.action) {
            case 'apply-damage': target.applyDamage(value); break;
            case 'apply-damage-half': target.applyDamage(Math.floor(value / 2)); break;
            case 'apply-damage-double': target.applyDamage(2 * value); break;
            case 'apply-healing': target.applyHealing(value); break;
            case 'apply-health-loss': target.applyHealthLoss(value); break;
            case 'apply-health-regain': target.applyHealthRegain(value); break;
            case 'apply-affliction': target.applyAffliction(value); break;
            case 'apply-effect': target.applyEffect(effect); break;
          }

        }
      break;
    }
    
  }

  /* -------------------------------------------- */
  /*  Closing                                     */
  /* -------------------------------------------- */

  /**
   * Close the Application, removing it from the DOM.
   * @param {ApplicationClosingOptions} [options] Options which modify how the application is closed.
   * @returns {Promise<ApplicationV2>}            A Promise which resolves to the closed Application instance
   */
  async close(options={}) {
    
    /*if (this.#onClickElsewhere) {
      document.removeEventListener('click', this.#onClickElsewhere);
      this.#onClickElsewhere = undefined;
    }*/
    
    return super.close(options);
  }

}

/* Other Subclasses */
export class LanguagesMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { entryType: 'languages' };
}

export class SensesMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { entryType: 'senses' };
}

export class ImmunitiesMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { entryType: 'immunities' };
}

export class MovementTraitsMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { entryType: 'movementTraits' };
}

export class DescriptorsMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { entryType: 'descriptors' };
}

export class WeaponTraitsMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { entryType: 'weaponTraits' };
}

export class AfflictionsMenu extends EntrySettingsMenu {
  static DEFAULT_OPTIONS = { entryType: 'afflictions' };
}

