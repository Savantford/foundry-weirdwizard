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

    this.initialLayer = canvas.activeLayer;
    this.activityApp = options.activityApp;

    // Activate the Targeting tool in the Tokens layer
    canvas.tokens.activate({ tool: 'target' });

    // Hide the app that originated the Helper
    this.activityApp.minimize();

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
      noTargets: false //!game.user.targets.size
    };

    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  /** @override */
  _onClose(options) {
    // Turn off targeting hook
    Hooks.off('targetToken');

    // Clear preview templates (Range)
    canvas.regions.clearPreviewContainer();

    // Switch back to the initial layer
    this.initialLayer.activate();
    
    // Maximize the Activity App
    this.activityApp.maximize();
  }

}