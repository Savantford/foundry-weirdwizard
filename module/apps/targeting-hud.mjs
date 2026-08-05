import { addInstEffs, addActEffs, targetHeader } from '../sidebar/chat-html-templates.mjs';
import RollAttribute from '../dice/roll-attribute.mjs';

/**
 * Extend FormApplication to make a prompt shown by damage rolls
 * @extends {FormApplication}
*/

export default class TargetingHUD extends Application {
  debounceRender = foundry.utils.debounce(this.render, 50);

  constructor(options={}) {
    super(options); // Required for "this." to work
    
    this.context = options;
    this.initialLayer = canvas.activeLayer;
    this.activityApp = options.activityApp;
    //this.actorSheet = options.actor.sheet;

    // Activate the Targeting tool in the Tokens layer
    canvas.tokens.activate({ tool: 'target' });

    // Hide the app that originated the HUD
    this.activityApp.minimize();

    Hooks.on("targetToken", () => this.debounceRender() );
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = 'targeting-hud';
    options.template = 'systems/weirdwizard/templates/apps/targeting-hud.hbs';
    options.height = 'auto';
    options.popOut = false;
    options.width = 400;

    return options;
  }

  getData(options = {}) {
    const context = super.getData()
    context.hasTargets = !game.user.targets.size;
    
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    html.find('#targeting-confirm').click(() => this.return() );
  }

  return() {
    this.close();

    // Switch back to the initial layer
    this.initialLayer.activate();

    // Maximize the Activity App
    this.activityApp.maximize();
    
    // Turn off the targetToken hook
    Hooks.off('targetToken');
  }

}