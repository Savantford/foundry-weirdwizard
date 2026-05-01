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
      icon: 'fa-solid fa-list',
      resizable: true
    },
    actions: {},
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
    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: ".draggable",
      dropSelector: null,
      callbacks: {
        dragstart: this._onDragStart.bind(this)
      }
    }).bind(this.element);

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