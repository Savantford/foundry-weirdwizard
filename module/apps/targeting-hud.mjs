import { addInstEffs, addActEffs, targetHeader } from '../chat/chat-html-templates.mjs';
import GridTemplate from '../canvas/grid-template.mjs';
import RollAttribute from '../dice/roll-attribute.mjs';

/**
 * Extend FormApplication to make a prompt shown by damage rolls
 * @extends {FormApplication}
*/

export default class TargetingHUD extends Application {
  debounceRender = foundry.utils.debounce(this.render, 50)

  constructor(obj, initLayer, method) {
    super(); // This is required for the constructor to work

    this.obj = obj;
    this.initLayer = initLayer;
    this.method = method;
    const item = fromUuidSync(obj.origin);

    Hooks.on("targetToken", () => {
      this.debounceRender();
    });

    // Start drawing a template if the method uses template
    if (method === 'template') this.drawTemplate();
    
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
    context.isTemplate = this.method === 'template' ? true : false;
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    html.find('#targeting-confirm').click(() => {
      this.return();

      // Don't roll, just create a chat message
      if (this.obj.dontRoll) {
        
        const { action, attKey, content, label, origin } = this.obj,
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
      } else new RollAttribute(this.obj).render(true);
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
    
    // Go back to previous layer
    const initLayer = this.initLayer;

    // If the initial layer was the token layer, first switch the active tool to select
    if (initLayer.options.name == 'tokens') canvas.controls.activate({tool: 'select'});

    initLayer.activate();

    // Maximize actor sheet
    const actor = fromUuidSync(this.obj.origin).parent;
    actor.sheet.maximize();
    
    // Turn off the targetToken hook
    Hooks.off('targetToken');
  }

  drawTemplate() {
    const item = fromUuidSync(this.obj.origin);

    GridTemplate.fromItem(item)?.drawPreview(this.obj);
  }

  
  

}