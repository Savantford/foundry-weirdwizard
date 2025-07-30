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
  /*  Drag and Drop                               */
  /* -------------------------------------------- */

  /** @inheritdoc */
  _canDragStart(selector) {
    return game.user.isGM;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _canDragDrop(selector) {
    return game.user.isGM;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onDragStart(event) {
    
    const li = event.currentTarget;
    if ( event.target.classList.contains("content-link") ) return;

    // Create drag data
    let dragData;
    
    // Combatants
    if ( li.dataset.combatantId ) {
      const combatant = this.combat.combatants.get(li.dataset.combatantId);
      dragData = combatant.toDragData();
    }

    /*// Owned Items
    if ( li.dataset.itemId ) {
      const item = this.actor.items.get(li.dataset.itemId);
      dragData = item.toDragData();
    }

    // Active Effect
    if ( li.dataset.effectId ) {
      const effect = this.actor.effects.get(li.dataset.effectId);
      dragData = effect.toDragData();
    }*/

    if ( !dragData ) return;

    // Set data transfer
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onDrop(event) {
    
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    //const actor = this.actor;
    //const allowed = Hooks.call("dropActorSheetData", actor, this, data);
    //if ( allowed === false ) return;

    // Handle different data types
    switch ( data.type ) {
      case "Combatant":
        return this._onDropCombatant(event, data);
      /*case "ActiveEffect":
        return this._onDropActiveEffect(event, data);
      case "Actor":
        return this._onDropActor(event, data);
      case "Item":
        return this._onDropItem(event, data);
      case "Folder":
        return this._onDropFolder(event, data);*/
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an combatant reference or combatant data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropCombatant(event, data) {
    //if ( !this.actor.isOwner ) return false;
    const combatant = await Combatant.implementation.fromDropData(data);
    const combatantData = combatant.toObject();
    
    // Handle combatant sorting within the same Actor
    //if ( this.actor.uuid === combatant.parent?.uuid ) 
    return this._onSortCombatant(event, combatantData);

    // Create the owned combatant
    //return this._onDropCombatantCreate(combatantData);
  }

  /* -------------------------------------------- */

  /**
   * Handle a drop event for an existing embedded Combatant to sort that Combatant relative to its siblings
   * @param {Event} event
   * @param {Object} combatantData
   * @private
   */
  _onSortCombatant(event, combatantData, dropTarget) {
    
    // Get the drag source and drop target
    const combatants = this.combat.combatants;
    const source = combatants.get(combatantData._id);
    if ( !dropTarget ) dropTarget = event.target.closest("[data-combatant-id]");
    if ( !dropTarget ) return;
    const target = combatants.get(dropTarget.dataset.combatantId);
    
    // Don't sort on yourself
    if ( source.id === target.id ) return;

    // Identify sibling combatants based on adjacent HTML elements
    const siblings = [];
    for ( let el of dropTarget.parentElement.children ) {
      const siblingId = el.dataset.combatantId;
      if ( siblingId && (siblingId !== source.id) ) siblings.push(combatants.get(el.dataset.combatantId));
    }
    
    // Perform the sort
    const sortUpdates = this.performIntegerSort(source, {target, siblings});
    
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });
    
    //siblings.splice(idx, 0, source);

    // Perform the update
    return this.combat.updateEmbeddedDocuments("Combatant", updateData);
  }

  /* -------------------------------------------- */

  /**
   * Given a source object to sort, a target to sort relative to, and an Array of siblings in the container:
   * Determine the updated sort keys for the source object, or all siblings if a reindex is required.
   * Return an Array of updates to perform, it is up to the caller to dispatch these updates.
   * Each update is structured as:
   * {
   *   target: object,
   *   update: {sortKey: sortValue}
   * }
   *
   * @param {object} source       The source object being sorted
   * @param {object} [options]    Options which modify the sort behavior
   * @param {object|null} [options.target]  The target object relative which to sort
   * @param {object[]} [options.siblings]   The Array of siblings which the source should be sorted within
   * @param {string} [options.sortKey=sort] The property name within the source object which defines the sort key
   * @param {boolean} [options.sortBefore]  Explicitly sort before (true) or sort after( false).
   *                                        If undefined the sort order will be automatically determined.
   * @returns {object[]}          An Array of updates for the caller of the helper function to perform
   */
  performIntegerSort(source, {target=null, siblings=[], sortKey="initiative", sortBefore}={}) {

    // Automatically determine the sorting direction
    if ( sortBefore === undefined ) {
      sortBefore = (source[sortKey] || 0) > (target?.[sortKey] || 0);
    }

    // Register brackets
    const sourceBracket = source.initiativeBracket,
      targetBracket = target.initiativeBracket
    ;

    // Ensure the siblings are sorted
    siblings = Array.from(siblings);
    siblings.sort((a, b) => a[sortKey] - b[sortKey]);

    // Case 1: Source and Target are on the same brackets
    if (sourceBracket === targetBracket) {
      
      // Filter siblings to the bracket
      siblings = siblings.filter(sib => sib[sortKey + 'Bracket'] === sourceBracket);
      
      // Determine the index target for the sort
      let defaultIdx = sortBefore ? siblings.length : 0;
      let idx = target ? siblings.findIndex(sib => sib === target) : defaultIdx;
      
      // Determine the indices to sort between
      /*let min, max;
      if ( sortBefore ) [min, max] = this._sortBefore(siblings, idx, sortKey);
      else [min, max] = this._sortAfter(siblings, idx, sortKey);*/
      
      // Sort before or after
      if (sortBefore) siblings.splice(idx, 0, source); else siblings.splice(idx+1, 0, source);
      
      return siblings.map((sib, idx) => {

        return {
          target: sib,
          update: { [sortKey]: sourceBracket + (idx + 1) }
        }
      });
      
    }
    
  }

  /* -------------------------------------------- */

  /**
   * Given an ordered Array of siblings and a target position, return the [min,max] indices to sort before the target
   * @private
   */
  _sortBefore(siblings, idx, sortKey) {
    let max = siblings[idx] ? siblings[idx][sortKey] : null;
    let min = siblings[idx-1] ? siblings[idx-1][sortKey] : null;
    //let max = siblings[idx+1] ? siblings[idx+1][sortKey] : null;
    //let min = siblings[idx] ? siblings[idx][sortKey] : null;
    return [min, max];
  }

  /* -------------------------------------------- */

  /**
   * Given an ordered Array of siblings and a target position, return the [min,max] indices to sort after the target
   * @private
   */
  _sortAfter(siblings, idx, sortKey) {
    let min = siblings[idx] ? siblings[idx][sortKey] : null;
    let max = siblings[idx+1] ? siblings[idx+1][sortKey] : null;
    //let min = siblings[idx-1] ? siblings[idx-1][sortKey] : null;
    //let max = siblings[idx] ? siblings[idx][sortKey] : null;
    return [min, max];
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  get combat () {
    return this.combats.filter(c => c.active === true)[0];
  }

}
