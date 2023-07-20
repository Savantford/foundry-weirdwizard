/**
 * Extend FormApplication to make a prompt shown by attribute and luck rolls
 * @extends {FormApplication}
*/

export class rollPrompt extends FormApplication {
  constructor(obj) {
    super(); // This is required for the constructor to work
    this.component = obj.target; // Assign HTML component
    this.system = obj.actor.system; // Assign actor data

    // Assign label, name and fixed boons/banes
    this.label = obj.label;
    this.name = obj.name;
    this.fixed = obj.fixed ? obj.fixed : 0;
    this.damage = obj.damage;
    this.healing = obj.healing;

    // Assign mod
    this.mod = (obj.mod < 0 ? "" : "+") + obj.mod; // If mod is positive, give a + sign if positive. If undefined, set it to 0
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "roll-prompt";
    options.template = "systems/weirdwizard/templates/roll-prompt.hbs";
    options.height = "auto";
    options.width = 400;
    options.label = "Roll Details";

    return options;
  }

  getData(options = {}) {
    let context = super.getData()

    // Pass down actor data to application.
    context.system = this.system;
    context.mod = this.mod;
    context.fixed = this.fixed;

    // Count affliction banes
    context.affBanes = CONFIG.Global.getAffBanes();

    // Prepare dropdown menu objects.
    //context.armorObj = Object.fromEntries(Object.entries(CONFIG.WEIRDWIZARD.armor).map(i => [i[0], i[1].label]))

    return context
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    // Handle closing the window without saving
    html.find('#boons-cancel').click(() => this.close({ submit: false }))

    // Get roll variables
    let boonsFinal = 0;
    const label = this.label;
    const mod = this.mod;
    const name = this.name;
    const fixed = this.fixed;
    const damage = this.damage;
    const healing = this.healing;

    let att = '1d20 + 0 + ';
    if (name) att = name + " (" + mod + ")"

    function updateFields(ev) { // Update html fields
      const parent = ev.target.closest('.boons-details');

      // Calculate and display final boons
      boonsFinal = parseInt(parent.querySelector('input[type=number].situational').value); // Set boonsFinal to the situational input value
      if (CONFIG.Global.getAffBanes()) boonsFinal += CONFIG.Global.getAffBanes(); // If there are banes imposed by afflictions, add it
      if (fixed) boonsFinal += fixed; // If there are fixed boons or banes, add it

      boonsFinal = (boonsFinal < 0 ? "" : "+") + boonsFinal; // Add a + sign if positive

      parent.querySelector('.boons-display.total').innerHTML = boonsFinal;

      if (boonsFinal > 0) {
        parent.querySelector('.boons-expression').innerHTML = att + " " + game.i18n.format("WEIRDWIZARD.Boons.With") + " " + parseInt(boonsFinal) + " " + game.i18n.format("WEIRDWIZARD.Boons.Boons");
      } else if (boonsFinal < 0) {
        parent.querySelector('.boons-expression').innerHTML = att + " " + game.i18n.format("WEIRDWIZARD.Boons.With") + " " + boonsFinal*-1 + " " + game.i18n.format("WEIRDWIZARD.Boons.Banes");
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

      let rollFormula = "d20" + this.mod + boons;

      // Construct the Roll instance
      let r = new Roll(rollFormula);

      // Execute the roll
      await r.evaluate();

      // Send to chat
      let message = await r.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode')
      });

      // Append damage roll to the chat message
      if (damage) {
        let d = new Roll(damage + "[Damage]");
        await d.evaluate();

        message.update({'rolls': [...message.rolls, d]})
      }

      // Append healing roll to the chat message
      if (healing) {
        let h = new Roll(healing + "[Healing]");
        await h.evaluate();

        message.update({'rolls': [...message.rolls, h]})
      }
      
      // The parsed terms of the roll formula
      //console.log(r.terms);    // [Die, OperatorTerm, NumericTerm, OperatorTerm, NumericTerm]

      // The resulting equation after it was rolled
      console.log('Formula = ' + r.formula + '\nResult = ' + r.result + '\nTotal = ' + r.total);   // 16 + 2 + 4; 22

      /*export class DLEroll extends Roll { // Extended custom Demon Lord Engine roll      // Not Needed ATM
          constructor() { ... }
      }*/
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