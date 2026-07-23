import { addInstEffs, addActEffs, targetHeader } from '../sidebar/chat-html-templates.mjs';
import RollAttribute from '../dice/roll-attribute.mjs';

/**
 * Extend FormApplication to make a prompt shown by damage rolls
 * @extends {FormApplication}
*/

export default class TargetingHUD extends Application {
  debounceRender = foundry.utils.debounce(this.render, 50)

  constructor(options) {
    super(); // This is required for the constructor to work
    
    this.context = {
      ...options,
      method: 'manual'
    };

    Hooks.on("targetToken", () => {
      this.debounceRender();
    });

    // Start drawing a template if the method uses template
    if (this.context.method === 'areaTarget') this.drawTemplate();
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
    context.isTemplate = this.context.method === 'areaTarget' ? true : false;
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    html.find('#targeting-confirm').click(() => {
      this.return();

      // Don't roll, just create a chat message
      if (this.context.dontRoll) {
        
        const { action, attKey, content, label, origin } = this.context,
          item = fromUuidSync(origin),
          instEffs = item.system.instant,
          actEffs = item.effects,
          baseHtml = {};
        let rollHtml = '';
        
        // Record Instant Effect parameters in baseHtml
        if (instEffs) {
          
          for (const t of game.user.targets) {
            baseHtml[t.id] = addInstEffs(instEffs, origin, t.id);
          }
          
        }
        
        // Record Active Effect parameters in baseHtml
        if (actEffs) {
          
          for (const t of game.user.targets) {
            baseHtml[t.id] = addActEffs(actEffs, origin, t.id);
          }

        }

        for (const t of game.user.targets) {
          rollHtml += targetHeader(t, baseHtml[t.id]);
        }
        
        // Create message data to sell
        let messageData = {
          speaker: game.weirdwizard.utils.getSpeaker({ actor: item.actor }),
          flavor: label,
          content: content,
          sound: CONFIG.sounds.dice,
          'flags.weirdwizard': {
            icon: item.img,
            item: item.uuid,
            rollHtml: rollHtml,
            emptyContent: !content ?? true
          }
        }
        
        ChatMessage.create(messageData);
      // Roll
      } else new RollAttribute(this.context).render(true);
    })

    html.find('#targeting-cancel').click(() => {
      this.return();
    })

    html.find('#targeting-replace').click(() => {
      this.drawTemplate();
    })

  }

  return() {
    this.close();

    // If the initial layer was the token layer, first switch the active tool to select
    //if (initialLayer.options.name == 'tokens') canvas.tokens.activate({ tool: 'select' });

    this.context.initialLayer.activate();

    // Maximize actor sheet
    this.context.actor.sheet.maximize();
    
    // Turn off the targetToken hook
    Hooks.off('targetToken');
  }

}