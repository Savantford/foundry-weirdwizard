/**
 * Extend FormApplication to make a prompt shown by attribute and luck rolls
 * @extends {FormApplication}
*/

import { i18n, plusify } from '../helpers/utils.mjs'

export class rollAttribute extends FormApplication {
  constructor(obj) {
    super(); // This is required for the constructor to work
    this.component = obj.target; // Assign HTML component
    this.actor = obj.actor;
    this.system = obj.actor.system; // Assign actor data
    const attKey = obj.attKey;
    this.against = obj.against;

    // Assign label, name and fixed boons/banes
    this.label = obj.label;
    this.content = obj.content;
    this.name = attKey == 'luck' ? 'Luck' : this.system.attributes[attKey].name;
    this.effectBoonsGlobal = this.system.boons.attributes[attKey].global ?
      this.system.boons.attributes[attKey].global : 0;
    this.fixedBoons = obj.fixedBoons ? obj.fixedBoons : 0;

    // Assign mod
    this.mod = this.system.attributes[attKey]?.mod ?
      plusify(this.system.attributes[attKey].mod) : '+0'; // If undefined, set it to +0
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
    context.hasAgainst = this.against ? true : false;

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
    const fixedBoons = this.fixedBoons;
    const effectBoons = this.effectBoonsGlobal; // Conditional boons should be added here later
    const against = this.against;
    let targets = [];

    game.user.targets.forEach(t => {
      targets.push({
        id: t.id,
        name: t.document.name,
        attributes: t.document.actor.system.attributes,
        defense: t.document.actor.system.stats.defense.total,
        boonsAgainst: t.document.actor.system.boons.against
      })
    });

    // Set attribute display
    let attDisplay = '1d20 + 0';
    if (this.name) attDisplay = this.name + " (" + this.mod + ")"

    // Set against display
    let againstDisplay = ' ' + i18n('WW.Roll.Against').toLowerCase() + ' ';
    
    switch (against) {
      case 'def': {
        againstDisplay += i18n('WW.Defense.Label');
        break;
      }
      case 'str': {
        againstDisplay += i18n('WW.Strength');
        break;
      }
      case 'agi': {
        againstDisplay += i18n('WW.Agility');
        break;
      }
      case 'int': {
        againstDisplay += i18n('WW.Intellect');
        break;
      }
      case 'wil': {
        againstDisplay += i18n('WW.Will');
        break;
      }
    }

    function updateFields(ev) { // Update html fields
      const parent = ev.target.closest('.boons-details');

      // Calculate and display final boons
      boonsFinal = parseInt(parent.querySelector('input[type=number].situational').value); // Set boonsFinal to the situational input value
      if (effectBoons) boonsFinal += effectBoons; // If there are boons or banes applied by Active Effects, add it
      if (fixedBoons) boonsFinal += fixedBoons; // If there are fixed boons or banes, add it

      boonsFinal = (boonsFinal < 0 ? "" : "+") + boonsFinal; // Add a + sign if positive

      parent.querySelector('.boons-display.total').innerHTML = boonsFinal;

      let boonsDisplay = '';

      if (boonsFinal > 1) {
        boonsDisplay = + " " + i18n("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + i18n("WW.Boons.Boons");
      } else if (boonsFinal > 0) {
        boonsDisplay = " " + i18n("WW.Boons.With") + " " + parseInt(boonsFinal) + " " + i18n("WW.Boons.Boon");
      } else if (boonsFinal < -1 ) {
        boonsDisplay = " " + i18n("WW.Boons.With") + " " + boonsFinal*-1 + " " + i18n("WW.Boons.Banes");
      } else if (boonsFinal < 0) {
        boonsDisplay = " " + i18n("WW.Boons.With") + " " + boonsFinal*-1 + " " + i18n("WW.Boons.Bane");
      }

      parent.querySelector('.boons-expression').innerHTML = attDisplay + boonsDisplay + (against ? againstDisplay : '');

      // Targets display
      if (game.user.targets.size > 0) {
        let targetsDisplay = '';

        targets.forEach(t => {
          const boonsNo = t.boonsAgainst[against];

          targetsDisplay += '<p>' + t.name;
          
          if (boonsNo > 1) targetsDisplay += ': ' + boonsNo + ' ' + i18n('WW.Boons.ExtraBoons')
          else if (boonsNo == 1) targetsDisplay += ': ' + boonsNo + ' ' + i18n('WW.Boons.ExtraBoon');

          targetsDisplay += '</p>';
        });

        parent.querySelector('.boons-targets').innerHTML = targetsDisplay;
      }
      
    }

    const el = html.find('input[type=number]');
    el.change((ev) => updateFields(ev));
    el.change();

    // Roll dice when the Roll button is clicked
    html.find('#boons-submit').click(async () => {
      let rollHtml = '';
      
      if (game.user.targets.size > 0) {

        for (const t of targets) {
          const boonsNo = parseInt(boonsFinal) + t.boonsAgainst[against];

          let boons = "0";

          if (boonsNo != 0) { boons = (boonsNo < 0 ? "" : "+") + boonsNo + "d6kh" } else { boons = ""; };

          let rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + boons;

          // Construct the Roll instance
          let r = new Roll(rollFormula);

          // Execute the roll
          await r.evaluate();

          // Add the target name and roll result to the chat message
          rollHtml += '<p class="owner-only chat-target">' + i18n('WW.Target') + ': ' + t.name + '</p><p class="non-owner-only chat-target">' + i18n('WW.Target') + ': ???</p>';
          rollHtml += '<span class="owner-only">' + await r.render() + '</span><h4 class="secret-dice-total non-owner-only">' + await r.total + '</h4>';
          //rollHtml += '<a class="damage-roll" data-damage="1d6" title="Roll Damage Dice"><i class="fas fa-burst"></i></a>';

          // Get and set target number
          const targetNo = against == 'def' ? t.defense : t.attributes[against];
          
          // Evaluate target number
          if (await r.total >= 20 && await r.total >= targetNo + 5) {
            rollHtml += '<div class="chat-success">' + i18n('WW.Roll.CriticalSuccess') + '!</div>';
          } else if (await r.total >= targetNo) {
            rollHtml += '<div class="chat-success">' + i18n('WW.Roll.Success') + '</div>';
          } else {
            rollHtml += '<div class="chat-failure">' + i18n('WW.Roll.Failure') + '</div>';
          }
          
          // The resulting equation after it was rolled
          console.log('Formula = ' + r.formula + '\nResult = ' + r.result + '\nTotal = ' + r.total);   // 16 + 2 + 4; 22
        };

      } else {
  
        let boons = "0";

        if (boonsFinal != 0) { boons = boonsFinal + "d6kh" } else { boons = ""; };

        let rollFormula = "1d20" + (this.mod != "+0" ? this.mod : "") + boons;

        // Construct the Roll instance
        let r = new Roll(rollFormula);

        // Execute the roll
        await r.evaluate();

        // Add the target name and roll result to the chat message
        rollHtml += '<span class="owner-only">' + await r.render() + '</span><h4 class="secret-dice-total non-owner-only">' + await r.total + '</h4>';
        //rollHtml += '<a class="damage-roll" data-damage="1d6" title="Roll Damage Dice"><i class="fas fa-burst"></i></a>';

        // Evaluate target number
        const targetNo = 10; 

        if (await r.total >= 20 && await r.total >= targetNo + 5) {
          rollHtml += '<div class="chat-success">' + i18n('WW.Roll.CriticalSuccess') + '!</div>';
        } else if (await r.total >= targetNo) {
          rollHtml += '<div class="chat-success">' + i18n('WW.Roll.Success') + '</div>';
        } else {
          rollHtml += '<div class="chat-failure">' + i18n('WW.Roll.Failure') + '</div>';
        }

        // The resulting equation after it was rolled
        console.log('Formula = ' + r.formula + '\nResult = ' + r.result + '\nTotal = ' + r.total);   // 16 + 2 + 4; 22
        
      }

      // Create message data
      const messageData = {
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        content: content + rollHtml,
        sound: CONFIG.sounds.dice
      };

      await ChatMessage.applyRollMode(messageData,  game.settings.get('core', 'rollMode'));

      // Send to chat
      await ChatMessage.create(messageData);

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