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

  

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  get combat () {
    return this.combats.filter(c => c.active === true)[0];
  }

}
