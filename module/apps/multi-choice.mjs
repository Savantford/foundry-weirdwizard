import { capitalize, i18n } from '../helpers/utils.mjs';

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
  }

  static DEFAULT_OPTIONS = {
    id: 'multi-choice',
    classes: ['weirdwizard'],
    tag: 'form',
    window: {
      resizable: false,
      contentClasses: ['scrollable']
    },
    actions: {
      openSheet: MultiChoice.openSheet,
      collapseSection: MultiChoice.collapseSection
    },
    form: {
      handler: MultiChoice.formHandler,
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
    form: {
      template: 'systems/weirdwizard/templates/contextual/multi-choice.hbs'
    }
  }

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);

    // Completely overriding the parts
    //options.parts = ['header', 'generic', 'weapons', 'armor', 'paths', 'professions' ];
    
    return options;
  }

  //tabGroups = {'primary': 'generic'};

  /* -------------------------------------------- */

  /**
   * Prepare application rendering context data for a given render request.
   * @param {RenderOptions} options                 Options which configure application rendering behavior
   * @returns {Promise<ApplicationRenderContext>}   Context data for the render operation
   */
  async _prepareContext(options = {}) {
    
    const context = {};
    const opt = this.options;
    
    // Prepare item
    context.item = opt.item; 

    // Prepare sections
    context.sections = {...opt.sections};

    for (const s in context.sections) {
      const section = context.sections[s];
      
      // Prepare Attack Rider
      if (section.type === 'attackRider') {
        
        section.attackRider = {
          field: opt.item.system.schema.getField("attackRider.value"),
          value: section.attackRider,
          enriched: await TextEditor.enrichHTML(section.attackRider, {rollData: opt.item.getRollData(), relativeTo: opt.item})
        }
        
      } else {

        // Prepare cols
        if (!section.cols) section.cols = 'auto auto auto';

        // Prepare choices
        for (const c in section.choices) {
          const choice = section.choices[c];
          
          if (choice.path) choice.value = foundry.utils.getProperty(context.item, choice.path);
          
        }
        
      }

    }
    
    // Define submit button label
    context.submitLabel = opt.purpose === 'editWeaponTraits' ? i18n('WW.System.Dialog.Save') : i18n('WW.System.Dialog.Confirm');

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Prepare context that is specific to only a single rendered part.
   *
   * It is recommended to augment or mutate the shared context so that downstream methods like _onRender have
   * visibility into the data that was used for rendering. It is acceptable to return a different context object
   * rather than mutating the shared context at the expense of this transparency.
   *
   * @param {string} partId                         The part being rendered
   * @param {ApplicationRenderContext} context      Shared context provided by _prepareContext
   * @returns {Promise<ApplicationRenderContext>}   Context data for a specific part
   * @protected
   */
  /*async _preparePartContext(partId, context) {
    
    
    return context;
  }*/

  /* -------------------------------------------- */

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
    
    // Handle Items
    if (obj['attackRider.value']) {
      obj['system.attackRider.value'] = obj['attackRider.value'];
      delete obj['attackRider.value'];
    }
    
    if (opt.item) return opt.item.update(obj);

    // Handle Chat Application Operations
    if (opt.purpose === 'applyEffect') {
      const selected = Object.fromEntries(Object.entries(obj).filter(([_, v]) => v));
    
      //if (opt.operation === 'applyEffect') {

        const value = opt.dataset.value,
          effect = opt.dataset.effectUuid;
        
        for (const uuid in selected) {
          
          const target = await fromUuid(uuid);
          
          switch (opt.dataset.action) {
            case 'apply-damage': target.applyDamage(value); break;
            case 'apply-damage-half': target.applyDamage(Math.floor(value/2)); break;
            case 'apply-damage-double': target.applyDamage(2*value); break;
            case 'apply-healing': target.applyHealing(value); break;
            case 'apply-health-loss': target.applyHealthLoss(value); break;
            case 'apply-health-regain': target.applyHealthRegain(value); break;
            case 'apply-affliction': target.applyAffliction(value); break;
            case 'apply-effect': target.applyEffect(effect); break;
          }

        }
        
      
      /*} else if (opt.operation === 'callAttributeRoll') {
        const { attribute, fixedBoons } = opt.dataset;
        
        const obj = {
          origin: target.uuid,
          label: i18n(CONFIG.WW.ROLL_ATTRIBUTES[attribute]),
          content: '',
          attKey: attribute,
          fixedBoons: parseInt(fixedBoons)
        }
    
        new RollAttribute(obj).render(true);

      }*/

    }
    
  }


  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  /*static openSheet(event, target) {
    fromUuidSync(target.dataset.itemUuid)?.sheet.render(true);
  }*/

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static collapseSection(event, target) {
    
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

  /*static changeType(event, app, nav) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const value = event.currentTarget.value;
    app.type = value;
    
    app.changeTab(this.inferType(value), 'primary', {event, navElement: nav});
    
  }*/

  /*inferType(value, context) {
    
    // Set the type automatically for core Compendia
    switch (value) {
      case 'paths': this.type = 'paths'; break;
      case 'professions': this.type = 'professions'; break;
      case 'armor': this.type = 'armor'; break;
      case 'weapons': this.type = 'weapons'; break;
      default: this.type = 'generic'; break;
    }
    
    return this.type;
  }*/

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
