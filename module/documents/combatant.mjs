import { i18n } from '../helpers/utils.mjs'
import WWDialog from '../apps/dialog.mjs';

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
  /*  Methods                                     */
  /* -------------------------------------------- */

  async takeInit(taking) {
    
    // Set takingInit flag
    await this.setFlag('weirdwizard', 'takingInit', taking)

    // Push the taking initiative status to the token
    const token = this.token;
    if ( !token ) return;
    
    // Prepare message
    const name = token?.actor ? `@UUID[${ this.actor.uuid }]` : '<b>' + game.weirdwizard.utils.getAlias({ token }) + '</b>';
    const msg = taking ? i18n('WW.Combat.Initiative.ChatMsg', { name }) : i18n('WW.Combat.RegularTurn.ChatMsg', { name });

    // Send to chat
    ChatMessage.create({
      type: 'status',
      content: msg,
      sound: CONFIG.sounds.notification
    });

    // Reorder turns
    this.combat.setAll();
  }

  /* -------------------------------------------- */

  /**
   * Reset the "Acted" combat status.
   * @private
   */
  async resetActed() {
    
    // Get combatant
    const combatants = this.combat.combatants;
    const source = await combatants.get(this.id);

    // Confirmation dialog
    const confirm = !source.permission ? false : await WWDialog.confirm({
      window: {
        title: 'WW.Combat.ResetActed.Title',
        icon: 'fa-solid fa-rotate-left'
      },
      content: `<p>${i18n('WW.Combat.ResetActed.Msg')}</p>
        <p class="dialog-sure">${i18n('WW.Combat.ResetActed.Confirm')}</p>`
    });

    if (!confirm) return;

    // Set source's Acted flag to false
    return await source.setFlag('weirdwizard', 'acted', false);

    // Get the drag source and drop target
    /*const bracket = combatants.filter(c => c.initiativeBracket === source.initiativeBracket);
    const target = combatants.find(c => c.initiative === Math.max(...bracket.map(c => c.initiative)));
    const tracker = li[0] ? await li[0].closest(`#combat-tracker`) : await li.closest(`#combat-tracker`);

    // Get dropTarget
    const dropTarget = await tracker.querySelector(`li[data-combatant-id=${target?.id}]`);
    if ( !dropTarget ) return;
    
    // Don't sort on yourself
    if ( source.id === target.id ) return;

    // Identify sibling combatants based on adjacent HTML elements
    const siblings = [];
    for ( let el of dropTarget.parentElement.children ) {
      const siblingId = el.dataset.combatantId;
      if ( siblingId && (siblingId !== source.id) ) siblings.push(combatants.get(el.dataset.combatantId));
    }

    // Perform the sort
    const sortUpdates = this.performIntegerSort(source, {target, siblings, sortBefore: false});
    
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });
    
    // Perform the update
    return this.combat.updateEmbeddedDocuments("Combatant", updateData);*/
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */
  
  get actorType() {
    return this.actor?.type ?? null;
  }

  get injured() {
    return this.actor?.injured ?? false;
  }

  get acted() {
    return this.flags.weirdwizard?.acted ?? false;
  }

  get disposition() {
    return this.token?.disposition ?? -2;
  }

  get takingInit() {
    return this.flags.weirdwizard?.takingInit ?? false;
  }
  
  get initiativeBracket() {
    if ((this.actor?.type == 'character')) {
      if (this.takingInit) return 1000; // Taking the Initiative
      else return 3000; // Allies' regular turn
    } else { // NPCs
      if (this.token?.disposition === 1) return 3000; // Allies' regular turn
      else return 2000; // Enemies' Taking the Initiative
    }
  }

  get phase() {
    if ((this.actor?.type == 'character')) {
      if (this.takingInit) return 'init'; // Taking the Initiative
      else return 'allies'; // Allies' regular turn
    } else { // NPCs
      if (this.token?.disposition === 1) return 'allies'; // Allies' regular turn
      else return 'enemies'; // Enemies' Taking the Initiative
    }
  }

}