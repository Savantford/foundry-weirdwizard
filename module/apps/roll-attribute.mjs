/**
 * Extend FormApplication to make a prompt shown by attribute and luck rolls
 * @extends {FormApplication}
*/

import { i18n, plusify } from '../helpers/utils.mjs'

export class rollAttribute extends FormApplication {
  constructor(obj) {
    super(); // This is required for the constructor to work
    this.component = obj.target; // Assign HTML component
    this.system = obj.actor.system; // Assign actor data
    const attKey = obj.attKey;

    // Assign label, name and fixed boons/banes
    this.label = obj.label;
    this.content = obj.content;
    this.name = attKey == 'luck' ? 'Luck' : this.system.attributes[attKey].name;
    this.effectBoonsGlobal = this.system.boons.attributes[attKey].global ?
      this.system.boons.attributes[attKey].global : 0;
    this.fixedBoons = obj.fixedBoons ? obj.fixedBoons : 0;

    // Assign mod
    this.mod = this.system.attributes[attKey]?.mod ?
      plusify(this.system.attributes[attKey].mod) : 0; // If undefined, set it to 0
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "roll-attribute";
    options.template = "systems/weirdwizard/templates/apps/roll-attribute.hbs";
    options.height = "auto";
    options.width = 400;
    options.title = "Roll Details";

    return options;
  }

  getData(options = {}) {
    let context = super.getData()

    // Pass data to application template.
    context.system = this.system;
    context.mod = this.mod;
    context.fixedBoons = this.fixedBoons;
    context.effectBoons = this.effectBoonsGlobal; // Conditional boons should be added here later

    return context
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    // Handle closing the window without saving
    html.find('#boons-cancel').click(() => this.close({ submit: false }))

    // Get roll variables
    let boonsFinal = 0;
    const label = this.label;
    const content = this.content;
    const mod = this.mod;
    const name = this.name;
    const fixedBoons = this.fixedBoons;
    const effectBoons = this.effectBoonsGlobal; // Conditional boons should be added here later

    let att = '1d20 + 0';
    if (name) att = name + " (" + plusify(mod) + ")"

    function updateFields(ev) { // Update html fields
      const parent = ev.target.closest('.boons-details');

      // Calculate and display final boons
      boonsFinal = parseInt(parent.querySelector('input[type=number].situational').value); // Set boonsFinal to the situational input value
      if (effectBoons) boonsFinal += effectBoons; // If there are boons or banes applied by Active Effects, add it
      if (fixedBoons) boonsFinal += fixedBoons; // If there are fixed boons or banes, add it

      boonsFinal = (boonsFinal < 0 ? "" : "+") + boonsFinal; // Add a + sign if positive

      parent.querySelector('.boons-display.total').innerHTML = boonsFinal;

      if (boonsFinal > 1) {
        parent.querySelector('.boons-expression').innerHTML = att + " " + i18n("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + i18n("WW.Boons.Boons");
      } else if (boonsFinal > 0) {
        parent.querySelector('.boons-expression').innerHTML = att + " " + i18n("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + i18n("WW.Boons.Boon");
      } else if (boonsFinal < -1 ) {
        parent.querySelector('.boons-expression').innerHTML = att + " " + i18n("WW.Boons.With") + " " + boonsFinal*-1 + " " + i18n("WW.Boons.Banes");
      } else if (boonsFinal < 0) {
        parent.querySelector('.boons-expression').innerHTML = att + " " + i18n("WW.Boons.With") + " " + boonsFinal*-1 + " " + i18n("WW.Boons.Bane");
      } else {
        parent.querySelector('.boons-expression').innerHTML = att;
      }
      
    }

    const el = html.find('input[type=number]');
    el.change((ev) => updateFields(ev));
    el.change();

    // Roll dice when the Roll button is clicked
    html.find('#boons-submit').click(async () => {
      let boons = "0";

      if (boonsFinal != 0) { boons = boonsFinal + "d6kh" } else { boons = ""; };

      let rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + boons;

      // Construct the Roll instance
      let r = new Roll(rollFormula);

      // Execute the roll
      await r.evaluate();
      
      // Send to chat
      /**/

      if (content) {
        let rollHtml = await r.render();

        let messageData = {
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          content: rollHtml + content/* + '<a class="damage-roll" data-damage="1d6" title="Roll Damage Dice"><i class="fas fa-burst"></i></a>'*/,
          sound: CONFIG.sounds.dice
        };

        ChatMessage.applyRollMode(messageData,  game.settings.get('core', 'rollMode'));

        ChatMessage.create(messageData);

      } else {
        let message = await r.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label,
          rollMode: game.settings.get('core', 'rollMode')
        });
      }

      // The resulting equation after it was rolled
      console.log('Formula = ' + r.formula + '\nResult = ' + r.result + '\nTotal = ' + r.total);   // 16 + 2 + 4; 22

    })

  }

  async _updateObject(event, formData) { // Update actor data.
    //
    /*this.object.update({
        'system.stats.health': {
        'starting': formData.starting,
        'novice': formData.novice,
        'expert': formData.expert,
        'master': formData.master,
        'bonus': formData.bonus,
        'lost': formData.lost
        }
    })*/
  }
}