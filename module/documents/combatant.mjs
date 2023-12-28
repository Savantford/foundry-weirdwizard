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

  async takingInit(taking) {

    // Set takingInit
    await this.setFlag('weirdwizard', 'takingInit', taking)

    // Push the taking initiative status to the token
    const token = this.token;
    if ( !token ) return;
    
    const status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.TAKINGINITIATIVE);
    if ( !status && !token.object ) return;
    const effect = token.actor && status ? status : CONFIG.controlIcons.takingInit;
    /*if ( token.object ) await token.object.toggleEffect(effect, {overlay: true, active: taking});
    else await token.toggleActiveEffect(effect, {overlay: true, active: taking});*/
    
    // Send to chat
    ChatMessage.create({
      content: '<div><b>' + token.actor.name + '</b> ' + (taking ? i18n('WW.Combat.InitiativeMsg') : i18n('WW.Combat.TurnMsg')) + '.</div>',
      sound: CONFIG.sounds.notification
    });

    // Reorder turns
    this.combat.setAll();
  }
  

}