import { i18n } from '../helpers/utils.mjs'

export default class WWCombatant extends Combatant {

  /**
   * Update the value of the tracked resource for this Combatant.
   * @override
   * @returns {null|object}
   */
  updateResource() {
    if ( !this.actor || !this.combat ) return this.resource = null;

    const valueStr = this.parent.settings.resource,
      value = foundry.utils.getProperty(this.actor.system, valueStr),
      maxStr = valueStr ? valueStr.split(".value")[0] + '.max' : null,
      max = maxStr ? foundry.utils.getProperty(this.actor.system, maxStr) : null;
    
    if (max) {
      return this.resource = value, this.resourceMax = max;
    } else {
      return this.resource = value;
    }
    
  }

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  async takeInit(taking) {
    
    // Set takingInit flag
    await this.setFlag('weirdwizard', 'takingInit', taking)

    // Push the taking initiative status to the token
    const token = this.token;
    if ( !token ) return;
    
    // Prepare message
    const name = token.actor ? `@UUID[${c.actor.uuid}]` : '<b>' + game.weirdwizard.utils.getAlias({ token: token }) + '</b>';
    const msg = taking ? i18n('WW.Combat.Initiative.ChatMsg', {name: name}) :i18n('WW.Combat.RegularTurn.ChatMsg', {name: name});

    // Send to chat
    ChatMessage.create({
      content: '<p>' + msg + '</p>',
      sound: CONFIG.sounds.notification
    });

    // Reorder turns
    this.combat.setAll();
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  get acted() {
    return this.flags.weirdwizard?.acted ?? false;
  }

  get takingInit() {
    return this.flags.weirdwizard?.takingInit ?? false;
  }
  
  get initiativeBracket() {
    if ((this.actor?.type == 'character')) {
      if (this.takingInit) return 1000; // Taking the Initiative
      else return 3000; // Allies' regular turn
    } else { // NPCs
      if (this.token.disposition === 1) return 3000; // Allies' regular turn
      else return 2000; // Enemies' Taking the Initiative
    }
  }

}