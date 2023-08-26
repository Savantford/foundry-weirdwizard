/**
 * Extend FormApplication to make a prompt shown by damage rolls
 * @extends {FormApplication}
*/

import { i18n } from '../helpers/utils.mjs'

export class rollDamage extends FormApplication {
  constructor(obj) {
    super(); // This is required for the constructor to work

    // Assign variables
    this.component = obj.target; // Assign HTML component
    this.actor = obj.actor;
    this.system = obj.actor.system; // Assign actor data
    this.label = obj.label;
    this.baseDamage = obj.baseDamage;
    this.bonusDamage = obj.bonusDamage;
    this.properties = obj.properties;
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = 'roll-damage';
    options.template = 'systems/weirdwizard/templates/apps/roll-damage.hbs';
    options.height = 'auto';
    options.width = 400;
    options.title = 'Damage Dice';

    return options;
  }

  getData(options = {}) {
    let context = super.getData()

    // Pass data to application template.
    context.label = this.label;
    context.system = this.system;
    context.baseDamage = this.baseDamage;
    context.bonusDamage = this.bonusDamage;
    context.shattering = this.properties.shattering;
    context.versatile = this.properties.versatile;

    return context
  }

  activateListeners(html) {
    super.activateListeners(html);
    
    // Handle closing the window without saving
    html.find('#damage-cancel').click(() => this.close({ submit: false }))

    // Get roll variables
    const label = this.label;
    const baseDamage = this.properties.brutal ? this.baseDamage + 'r1' : this.baseDamage;
    const bonusDamage = this.bonusDamage;
    const brutal = this.properties.brutal;

    let finalExp = baseDamage; // Set the final expression to base damage

    function updateFields(ev) { // Update html fields
      const parent = ev.target.closest('.damage-details');

      // Get checkbox values
      let applyBothHands = parent.querySelector('input[name=bothHands]:checked');
      let applyShattering = parent.querySelector('input[name=shattering]:checked');
      let applyBonus = parent.querySelector('input[name=applyBonus]:checked');

      // Get other field variables
      let otherdice = parseInt(parent.querySelector('input[name=otherdice]').value);
      let othermod = parseInt(parent.querySelector('input[name=othermod]').value);

      // Reset finalExp
      finalExp = baseDamage;
      
      // Count extra dice
      let extraDice = 0;

      if (applyBothHands) extraDice += 1;

      if (applyShattering) extraDice += 1;

      if (applyBonus && bonusDamage) extraDice += bonusDamage;

      if (otherdice) extraDice += otherdice;

      if (extraDice) finalExp += ' + ' + extraDice + (brutal ? 'd6r1' : 'd6');

      // Add othermod to finalExp
      if (othermod) finalExp += ' + ' + othermod;

      // Display final expression
      parent.querySelector('.damage-expression').innerHTML = finalExp;
      
    }

    const el = html.find('input');
    el.change((ev) => updateFields(ev));
    el.change();

    // Roll dice when the Roll button is clicked
    html.find('#damage-submit').click(async () => {
      
      // Construct the Roll instance
      let r = new Roll(finalExp);
      
      // Execute the roll
      await r.evaluate();

      // Send to chat
      await r.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: i18n('WW.Damage.Of') + ' ' + label,
        rollMode: game.settings.get('core', 'rollMode')
      });
      
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