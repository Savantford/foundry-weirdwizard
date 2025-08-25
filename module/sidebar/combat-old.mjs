import WWDialog from '../apps/dialog.mjs';
import { i18n } from '../helpers/utils.mjs';
import WWCombatTrackerConfig from '../sheets/configs/combat-config.mjs';

/**
 * The sidebar directory which organizes and displays world-level Combat documents.
*/

export default class WWCombatTrackerOld extends foundry.applications.sidebar.tabs.CombatTracker {

  /* -------------------------------------------- */

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Display Combat settings (@override)
    html.find('.combat-settings').off('click').click(ev => {
      ev.preventDefault();
      new WWCombatTrackerConfig().render(true);
    });

    // Turn Control button
    html.find('.turn-control').click(ev => this._onCombatantTurnControl(ev));

    // Allow context on right-click for players too
    if (!game.user.isGM) this._contextMenu(html);
  }

  /**
   * Handle a Combatant acted toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _onCombatantTurnControl(event) {
    // Stop default behavior if it's an event
    const isHtml = $(event)[0] instanceof HTMLElement;

    if (!isHtml) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Fetch variables
    const li = isHtml ? $(event)[0] : event.currentTarget.closest('.combatant');
    const combat = this.viewed;
    const combatant = combat.combatants.get(li.dataset.combatantId), acted = combatant.acted, takingInit = combatant.takingInit;
    
    if (combatant.permission) { // Check if user has permission

      // Combat NOT in standby; NOT acted; is current turn: End turn
      if (!combat.standby && !acted && combatant === combat.combatant) this._endTurn(li);

      // Combat in standby; Combatant has not acted; NOT current turn: Take a turn
      else if (combat.standby && !acted && combatant !== combat.combatant) combat.startTurn(li, combatant);
      
      // Already acted; is a Character: Toggle between regular turn and taking the initiative
      else if (acted && combatant.actor.type === 'character') {
        if (await combatant.takingInit) await combatant.takeInit(false); else await combatant.takeInit(true);
      }

      // Combatant already acted
      else if (acted) {
        this._resetTurn(li, combatant.toObject());
      }

    }

  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  get combat () {
    return this.combats.filter(c => c.active === true)[0];
  }

}
