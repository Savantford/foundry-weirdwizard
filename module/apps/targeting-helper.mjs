import { addInstEffs, addActEffs, targetHeader } from '../sidebar/chat-html-templates.mjs';

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * A powerful general app to handle general activity use and dice rolling.
 * @extends {ApplicationV2}
*/
export default class TargetingHelper extends HandlebarsApplicationMixin(ApplicationV2) {
  debounceRender = foundry.utils.debounce(this.render, 50);

  constructor(options={}) {
    super(options); // Required for "this." to work
    console.log(options)

    this.initialLayer = canvas.activeLayer;

    // Activate the Targeting tool in the Tokens layer
    canvas.tokens.activate({ tool: 'target' });

    // Hide the app that originated the Helper
    options.originApp?.minimize();

    Hooks.on("targetToken", () => this.debounceRender() );
  }

  /* -------------------------------------------- */

  static DEFAULT_OPTIONS = {
    id: 'targeting-helper',
    classes: ['weirdwizard', 'targeting-helper'],
    window: {
      frame: false,
      positioned: false
    },
    position: {
      width: "auto",
      height: "auto"
    },
    actions: {
      cancel: this.#cancel
    }
  }

  /* -------------------------------------------- */

  static PARTS = {
    main: {
      template: 'systems/weirdwizard/templates/apps/targeting-helper.hbs'
    }
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async _prepareContext(options = {}) {
    const context = {
      noTargets: false, //!game.user.targets.size
      cancelable: this.options.cancelable
    };

    return context;
  }

  /* -------------------------------------------- */
  /*  Lifecycle & Form handling                   */
  /* -------------------------------------------- */

  #resolvers = Promise.withResolvers();

  get promise() { return this.#resolvers.promise; };

  /* -------------------------------------------- */

  /**
   * Create an Activity app instance and wait for it to be closed or confirmed.
   * @param config
   * @returns {Promise<any>}
   */

  static async wait(options) {
    const app = new this(options);
    app.render(true);
    return app.promise;
  }

  /* -------------------------------------------- */

  /**
   * @param {PointerEvent} event - The originating click event
   * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
   * @this {ActivityUse}
   */
  static async #cancel(event, target) {
    this.#resolvers.resolve({ cancel: true });
    this.close();
  }

  /* -------------------------------------------- */

  /** @override */
  _onClose(options) {
    this.#resolvers.resolve({ cancel: false });

    // Turn off targeting hook
    Hooks.off('targetToken');

    // Clear preview templates (Range)
    canvas.regions.clearPreviewContainer();

    // Switch back to the initial layer
    this.initialLayer.activate();
    
    // Maximize the origin app
    options.originApp?.maximize();
  }
}