import { addInstEffs, addActEffs, targetHeader } from '../sidebar/chat-html-templates.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * A powerful general app to handle general activity use and dice rolling.
 * @extends {ApplicationV2}
*/
export default class TargetingHUD extends HandlebarsApplicationMixin(ApplicationV2) {
  debounceRender = foundry.utils.debounce(this.render, 50);

  constructor(options={}) {
    super(options); // Required for "this." to work
    
    this.context = options;
    this.initialLayer = canvas.activeLayer;
    this.activityApp = options.activityApp;

    // Activate the Targeting tool in the Tokens layer
    canvas.tokens.activate({ tool: 'target' });

    // Hide the app that originated the HUD
    this.activityApp.minimize();

    Hooks.on("targetToken", () => this.debounceRender() );
    const rangeRegion = this.activityApp.config.item.displayRange();
  }

  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: 'targeting-hud',
    classes: ['weirdwizard', 'targeting-hud'],
    actions: {
      confirm: TargetingHUD.#onConfirm
    },
    window: {
      frame: false,
      positioned: false
    },
    position: {
      width: "auto",
      height: "auto"
    }
  }

  /* -------------------------------------------- */

  static PARTS = {
    main: {
      template: 'systems/weirdwizard/templates/apps/targeting-hud.hbs'
    }
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async _prepareContext(options = {}) {
    const context = {
      hasTargets: !game.user.targets.size
    };

    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
  */
  static #onConfirm(event, target) {
    this.close();
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _onClose(options) {
    super._onClose(options);

    // Switch back to the initial layer
    this.initialLayer.activate();
    
    // Turn off targeting hook
    Hooks.off('targetToken');

    // Clear preview templates (Range)
    canvas.regions.clearPreviewContainer();
    
    // Maximize the Activity App
    this.activityApp.maximize();
  }

}