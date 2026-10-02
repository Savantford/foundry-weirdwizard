import { capitalize, inferDataFromKey } from '../helpers/utils.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend FormApplication to make windows to display a compendium more neatly
 * @extends {ApplicationV2}
*/
export class ListEntryConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    classes: ['weirdwizard', 'list-entry-config'],
    window: {
      icon: 'fa-solid fa-list',
      resizable: true
    },
    actions: {},
    position: {
      width: 400
    },
    form: {
      handler: this.#onSubmit
    }
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    const type = this.options.listKey;
    
    return _loc(`WW.Settings.${capitalize(type, 1)}.Name`);
  }

  /* -------------------------------------------- */

  constructor(options = {}) {
    super(options); // This is required for the constructor to work
    
    // Record important data
    this.entryKey = this.options.entryKey;
    this.settingKey = 'available' + capitalize(this.options.listKey, 1);
    this.setting = game.settings.get('weirdwizard', this.settingKey);
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
    const listKey = this.options.listKey;

    const context = {
      listTitle: _loc(`WW.Settings.${capitalize(listKey, 1)}.EntryType`),
      listName: _loc(`WW.Settings.${capitalize(listKey, 1)}.Name`),
      list: this.setting
    }

    // Add entry data preview
    context.entry = this.entryKey ? inferDataFromKey(this.entryKey) : null;

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
    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: ".draggable",
      dropSelector: null,
      callbacks: {
        dragstart: this._onDragStart.bind(this)
      }
    }).bind(this.element);
  }

  /* -------------------------------------------- */
  /*  Form handling                               */
  /* -------------------------------------------- */

  /**
   * Handle changes to an input element within the form.
   * @param {ApplicationFormConfiguration} formConfig     The form configuration for which this handler is bound
   * @param {Event} event                                 An input change event within the form
   * @protected
   */
  _onChangeForm(formConfig, event) {
    this.entryKey = event.target.value;

    this.render();
  }

  /* -------------------------------------------- */

  /**
   * Handle the sidebar's form submission
   * @this {DocumentSheetV2}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async #onSubmit(event, form, formData) {
    const {view, searchQuery, sourceCompendia, ...filters} = formData.object;
    console.loog(formData.object)
    /*this.view = view;
    this.searchQuery = searchQuery;
    this.searchFilters = filters;

    // Update full document data if it does not exist
    if (sourceCompendia !== this.sourceCompendia) {
      this.sourceCompendia = sourceCompendia;
      await this._updateFullDocumentData(sourceCompendia);
    }
    
    return this.render();*/
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
      listKey: this.options.listKey,
      entryKey: li.dataset.entryKey,
      entryName: _loc(li.dataset.entryName),
      desc: li.dataset.tooltip
    };
    
    // Set data transfer
    if ( !dragData ) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }
}