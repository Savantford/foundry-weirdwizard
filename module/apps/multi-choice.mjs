import { capitalize, i18n } from '../helpers/utils.mjs';
import { WWAfflictions } from '../helpers/afflictions.mjs'
import RollAttribute from '../dice/roll-attribute.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend FormApplication to make windows to display a compendium more neatly
 * @extends {ApplicationV2}
*/

export default class MultiChoice extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options = {}) {
    super(options); // This is required for the constructor to work
    
    this.document = options.document;
  }

  static DEFAULT_OPTIONS = {
    id: 'multi-choice',
    classes: ['weirdwizard'],
    tag: 'form',
    window: {
      resizable: true,
      contentClasses: ['scrollable']
    },
    actions: {
      collapseSection: this.#collapseSection,
      clearAfflictions: this.#clearAfflictions
    },
    form: {
      handler: this.formHandler,
      submitOnChange: false,
      closeOnSubmit: true
    },
    position: {
      width: 'auto',
      height: 'auto'
    }
  }

  /* -------------------------------------------- */

  static PARTS = {
    form: { template: 'systems/weirdwizard/templates/apps/multi-choice.hbs' }
  }

  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    const opt = this.options;
    
    const context = {
      purpose: opt.purpose,
      document: opt.document,
      sections: {...opt.sections}
    }
    
    // Prepare sections
    for (const s in context.sections) {
      const section = context.sections[s];

      // Prepare Attack Rider
      if (section.type === 'attackRider') {
        section.attackRider = {
          field: opt.document.system.schema.getField("attackRider.value"),
          name: await section.attackRider.name,
          value: await section.attackRider.value
        }

        const TextEditor = foundry.applications.ux.TextEditor.implementation;
        section.attackRiderEnriched = await TextEditor.enrichHTML(section.attackRider.value,
          { rollData: opt.document.getRollData(), relativeTo: opt.document, secrets: opt.document.isOwner }
        );
        
      } else {

        // Prepare cols
        if (!section.cols) section.cols = 'auto auto';

        // Prepare choices
        for (const c in section.choices) {
          const choice = section.choices[c];
          
          if (choice.path) choice.value = foundry.utils.getProperty(this.document, choice.path);
        }
        
      }

    }
    
    // Define submit button label
    context.submitLabel = opt.purpose === 'editWeaponTraits' ? i18n('WW.System.Dialog.Save') : i18n('WW.System.Dialog.Confirm');
    if (opt.purpose === 'updateAfflictions') context.clearAfflictionsLabel =  i18n('WW.Affliction.Clear');

    return context;
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #collapseSection(event, target) {
    const section = target.closest('.mc-section');
    const content = section.querySelector('.section-content');
    
    // Flip states
    if (target.classList.contains('fa-circle-chevron-up')) {
      target.classList.replace('fa-circle-chevron-up', 'fa-circle-chevron-down');

      $(content).slideDown(500);
      
    } else {
      target.classList.replace('fa-circle-chevron-down', 'fa-circle-chevron-up');

      $(content).slideUp(500);
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

    // Get selected choices
    const selected = Object.fromEntries(Object.entries(obj).filter(([_, v]) => v));

    // Handle specific purposes
    switch (opt.purpose) {

      case 'editWeaponTraits':
        opt.document.update(obj);
      break;

      // Update Afflictions
      case 'updateAfflictions':
        for (const aff in CONFIG.WW.AFFLICTIONS) {
          
          if (selected[aff]) {
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
        const value = opt.dataset.value, effect = opt.dataset.effectUuid;

        for (const uuid in selected) {

          const target = await fromUuid(uuid);

          switch (opt.dataset.action) {
            case 'applyDamage': target.applyDamage(value); break;
            case 'applyDamageHalf': target.applyDamage(Math.floor(value / 2)); break;
            case 'applyDamageDouble': target.applyDamage(2 * value); break;
            case 'applyHealing': target.applyHealing(value); break;
            case 'applyHealthLoss': target.applyHealthLoss(value); break;
            case 'applyHealthRegain': target.applyHealthRegain(value); break;
            case 'applyAffliction': target.applyAffliction(value); break;
            case 'applyEffect': target.applyEffect(effect); break;
          }

        }
      break;

      // Inline Attribute Call
      case 'attributeCall':
        const { attribute, fixedBoons } = opt.dataset;

        for (const uuid in selected) {

          const target = await fromUuid(uuid);

          const rollInfo = {
            origin: target.uuid,
            label: i18n(CONFIG.WW.ROLL_ATTRIBUTES[attribute]),
            content: '',
            attKey: attribute,
            fixedBoons: parseInt(fixedBoons)
          }

          new RollAttribute(rollInfo).render(true);

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
