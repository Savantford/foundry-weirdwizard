import WWDialog from '../apps/dialog.mjs';
import { i18n } from '../helpers/utils.mjs';
import WWCombatTrackerConfig from '../sheets/configs/combat-config.mjs';

/**
 * The sidebar directory which organizes and displays world-level Combat documents.
*/

export default class WWCombatTracker extends CombatTracker {
  constructor(options) {
    super(options);
    if ( !this.popOut ) game.combats.apps.push(this);

    /**
     * Record a reference to the currently highlighted Token
     * @type {Token|null}
     * @private
     */
    this._highlighted = null;

    /**
     * Record the currently tracked Combat encounter
     * @type {Combat|null}
     */
    this.viewed = null;

    // Initialize the starting encounter
    this.initialize({render: false});
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  /** @override */

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'combat',
      template: 'systems/weirdwizard/templates/sidebar/combat-tracker.hbs',
      title: 'COMBAT.SidebarTitle',
      scrollY: ['.directory-list'],
      dragDrop: [{dragSelector: ".directory-list .directory-item", dropSelector: ".directory-list"}]
    });
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /** @inheritdoc */
  createPopout() {
    const pop = super.createPopout();
    pop.initialize({combat: this.viewed, render: true});
    return pop;
  }

  /* -------------------------------------------- */

  /**
   * Initialize the combat tracker to display a specific combat encounter.
   * If no encounter is provided, the tracker will be initialized with the first encounter in the viewed scene.
   * @param {object} [options]                   Additional options to configure behavior.
   * @param {Combat|null} [options.combat=null]  The combat encounter to initialize
   * @param {boolean} [options.render=true]      Whether to re-render the sidebar after initialization
   */
  initialize({combat=null, render=true}={}) {

    // Retrieve a default encounter if none was provided
    if ( combat === null ) {
      const combats = this.combats;
      combat = combats.length ? combats.find(c => c.active) || combats[0] : null;
      combat?.updateCombatantActors();
    }

    // Prepare turn order
    if ( combat && !combat.turns ) combat.turns = combat.setupTurns();

    // Set flags
    this.viewed = combat;
    this._highlighted = null;

    // Also initialize the popout
    if ( this._popout ) {
      this._popout.viewed = combat;
      this._popout._highlighted = null;
    }

    // Render the tracker
    if ( render ) this.render();
  }

  /* -------------------------------------------- */

  /**
   * Scroll the combat log container to ensure the current Combatant turn is centered vertically
   */
  scrollToTurn() {
    const combat = this.viewed;
    if ( !combat || (combat.turn === null) ) return;
    let active = this.element.find('.active')[0];
    if ( !active ) return;
    let container = active.parentElement;
    const nViewable = Math.floor(container.offsetHeight / active.offsetHeight);
    container.scrollTop = (combat.turn * active.offsetHeight) - ((nViewable/2) * active.offsetHeight);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options={}) {
    let context = await super.getData(options);

    // Get the combat encounters possible for the viewed Scene
    const combat = this.viewed;
    const hasCombat = combat !== null;
    const combats = this.combats;
    const currentIdx = combats.findIndex(c => c === combat);
    const previousId = currentIdx > 0 ? combats[currentIdx-1].id : null;
    const nextId = currentIdx < combats.length - 1 ? combats[currentIdx+1].id : null;
    const settings = game.settings.get('core', Combat.CONFIG_SETTING);

    // Prepare rendering data
    context = foundry.utils.mergeObject(context, {
      combats: combats,
      currentIndex: currentIdx + 1,
      combatCount: combats.length,
      hasCombat: hasCombat,
      combat,
      turns: [],
      previousId,
      nextId,
      started: this.started,
      control: false,
      settings,
      linked: combat?.scene !== null,
      labels: {}
    });
    context.labels.scope = game.i18n.localize(`COMBAT.${context.linked ? 'Linked' : 'Unlinked'}`);
    if ( !hasCombat ) return context;

    // Format information about each combatant in the encounter
    let hasDecimals = false;
    const turns = [];
    context.init = [];
    context.enemies = [];
    context.allies = [];

    for ( const [i, combatant] of combat.turns.entries() ) {
      if ( !combatant.visible ) continue;
      
      // Prepare turn data
      const resource = combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resource : null,
        resourceMax = combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resourceMax : null,
        acted = combatant.acted,
        injured = combatant.resource >= Math.floor(combatant.resourceMax/2);
      
      const turn = {
        id: combatant.id,
        name: combatant.name,
        img: await this._getCombatantThumbnail(combatant),
        active: i === combat.turn,
        owner: combatant.isOwner,
        defeated: combatant.isDefeated,
        hidden: combatant.hidden,
        initiative: combatant.initiative,
        phaseInit: combatant.initiative - combatant.initiativeBracket,
        hasRolled: combatant.initiative !== null,
        hasResource: resource !== null,
        resource: resource,
        resourceMax: resourceMax,
        injured: injured,
        canPing: (combatant.sceneId === canvas.scene?.id) && game.user.hasPermission('PING_CANVAS'),
        type: combatant.actor?.type,
        flags: combatant.flags,
        disposition: combatant.token.disposition,
        acted: acted,
        takingInit: combatant.takingInit,
        hasPerms: combatant.permission >= 2 ?? false
      };
      if ( (turn.initiative !== null) && !Number.isInteger(turn.initiative) ) hasDecimals = true;
      turn.css = [
        turn.active ? 'active' : '',
        turn.hidden ? 'hidden' : '',
        turn.defeated ? 'defeated' : ''
      ].join(' ').trim();

      // Actor and Token status effects
      turn.effects = new Set();
      for ( const effect of (combatant.actor?.temporaryEffects || []) ) {
        if ( effect.statuses.has(CONFIG.specialStatusEffects.DEFEATED) ) turn.defeated = true;
        else if ( effect.img ) turn.effects.add(effect.img);
      }

      // Prepare Turn Control tooltip
      if (combatant.permission >= 2) { // Check if user has permission

        // Default
        turn.controlTooltip = 'WW.Combat.Standby';
        
        // Combat NOT in standby; NOT acted; is current turn: End turn
        if (!combat.standby && !acted && combatant === combat.combatant) turn.controlTooltip = 'WW.Combat.EndTurn';

        // Combat in standby; Combatant has not acted; NOT current turn: Start a turn
        else if (combat.standby && !acted && combatant !== combat.combatant) turn.controlTooltip = 'WW.Combat.StartTurn.Title';
        
        // Already acted; is a Character: Toggle between regular turn and taking the initiative
        else if (acted && combatant.actor.type === 'Character') {
          if (await combatant.takingInit) turn.controlTooltip = 'WW.Combat.Initiative.ClickTip'
          else turn.controlTooltip = 'WW.Combat.RegularTurn.ClickTip';
        }

        // Combatant already acted
        else if (acted) turn.controlTooltip = 'WW.Combat.ResetTurn.Title';

        // User has no permission over the combatant
      } else turn.controlTooltip = 'WW.Combat.NoPermission';
      

      // Push to to turns and respective phase
      turns.push(turn);
      
      if (turn.type === 'Character') {
        if (turn.takingInit) context.init.push(turn); else context.allies.push(turn);
      } else {
        if (turn.disposition === 1) context.allies.push(turn); else context.enemies.push(turn);
      }

    }

    // Count creatures acted per phase
    context.acted = {init: 0, enemies: 0, allies: 0, };
    
    context.init.forEach(t => { if (t.acted) context.acted.init += 1 });
    context.enemies.forEach(t => { if (t.acted) context.acted.enemies += 1 });
    context.allies.forEach(t => { if (t.acted) context.acted.allies += 1 });

    // Format initiative numeric precision
    const precision = CONFIG.Combat.initiative.decimals;
    turns.forEach(t => {
      if ( t.initiative !== null ) t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
    });

    // Merge update data for rendering
    return foundry.utils.mergeObject(context, {
      round: combat.round,
      turn: combat.turn,
      turns: turns,
      control: combat.combatant?.players?.includes(game.user),
      standby: combat.standby
    });
  }


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

  /**
   * Handle toggling the defeated status effect on a combatant Token
   * @param {Combatant} combatant     The combatant data being modified
   * @returns {Promise}                A Promise that resolves after all operations are complete
   * @private
   */
  async _onToggleDefeatedStatus(combatant) {
    
    const isDefeated = !combatant.isDefeated;
    await combatant.update({defeated: isDefeated});
    const defeatedId = CONFIG.specialStatusEffects.DEFEATED;
    
    await combatant.actor?.toggleStatusEffect(defeatedId, {overlay: true, active: isDefeated});
  }

  /* -------------------------------------------- */

  /* -------------------------------------------- */

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
      else if (acted && combatant.actor.type === 'Character') {
        if (await combatant.takingInit) await combatant.takeInit(false); else await combatant.takeInit(true);
      }

      // Combatant already acted
      else if (acted) {
        this._resetTurn(li, combatant.toObject());
      }

    }

  }

  /**
   * Handle a Combatant acted toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _endTurn(event) {
    const isHtml = $(event)[0] instanceof HTMLElement;
    
    // Stop default behavior if it's an event
    if (!isHtml) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Fetch variables
    const li = isHtml ? $(event)[0] : event.currentTarget.closest('.combatant');
    const combat = this.viewed;
    const combatant = combat.combatants.get(li.dataset.combatantId);
    
    // Combatant is the current turn
    if (combat.current.combatantId == li.dataset.combatantId) {

      // Mark as acted and begin next turn
      combatant.setFlag('weirdwizard', 'acted', true);
      combat.nextTurn();
    }

  }

  /** @inheritdoc */
  _contextMenu(html) {
    ContextMenu.create(this, html, ".directory-item", this._getEntryContextOptions());
  }

  /* -------------------------------------------- */

  /**
   * Get the Combatant entry context options
   * @returns {object[]}   The Combatant entry context options
   * @override
   * @private
   */
  _getEntryContextOptions() {    
    return [
      {
        name: "COMBAT.CombatantUpdate",
        icon: '<i class="fa-solid fa-edit"></i>',
        condition: li => {
          return game.user.isGM;
        },
        callback: this._onConfigureCombatant.bind(this)
      },
      {
        name: "WW.Combat.EndTurn",
        icon: '<i><img src="systems/weirdwizard/assets/icons/check-mark.svg"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          return (combatant?.permission >= 2) && !combatant?.acted && (combatant === this.viewed.combatant);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return this._endTurn(li);
        }
      },
      {
        name: "WW.Combat.StartTurn.Title",
        icon: '<i><img src="systems/weirdwizard/assets/icons/pointy-sword.svg"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          return (combatant?.permission >= 2) && !combatant?.acted && (combatant !== this.viewed.combatant);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return this.viewed.startTurn(li, combatant);
        }
      },
      {
        name: "WW.Combat.Initiative.Label",
        icon: '<i><img src="systems/weirdwizard/assets/icons/reactions.svg"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          return (combatant?.permission >= 2) && (combatant?.actor.type === 'Character') && !combatant?.takingInit && (combatant !== this.viewed.combatant);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant?.takeInit(true);
        }
      },
      {
        name: "WW.Combat.RegularTurn.Label",
        icon: '<i><img src="systems/weirdwizard/assets/icons/actions.svg"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          return (combatant?.permission >= 2) && (combatant?.actor.type === 'Character') && combatant?.takingInit && (combatant !== this.viewed.combatant);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant?.takeInit(false);
        }
      },
      {
        name: "WW.Combat.ResetTurn.Title",
        icon: '<i><img src="systems/weirdwizard/assets/icons/anticlockwise-rotation.svg"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          return (combatant?.permission >= 2) && combatant?.acted;
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return this._resetTurn(li, combatant?.toObject());
        }
      },
      {
        name: "COMBAT.CombatantRemove",
        icon: '<i class="fa-solid fa-trash"></i>',
        condition: li => {
          return game.user.isGM;
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant?.delete();
        }
      }
    ];
  }

  /* -------------------------------------------- */

  /**
   * Handle a Reset Turn event.
   * @param {Event} li
   * @param {Object} combatantData
   * @private
   */
  async _resetTurn(li, combatantData) {
    
    // Get combatant
    const combatants = this.combat.combatants;
    const source = await combatants.get(combatantData._id);

    // Confirmation dialog
    const confirm = !source.permission ? false : await WWDialog.confirm({
      window: {
        title: 'WW.Combat.ResetTurn.Title',
        icon: 'fa-solid fa-rotate-left'
      },
      content: `${i18n('WW.Combat.ResetTurn.Msg')}
        <p class="dialog-sure">${i18n('WW.Combat.ResetTurn.Confirm')}</p>`
    });

    if (!confirm) return;

    // Get the drag source and drop target
    const bracket = combatants.filter(c => c.initiativeBracket === source.initiativeBracket);
    const target = combatants.find(c => c.initiative === Math.max(...bracket.map(c => c.initiative)));
    const tracker = li[0] ? await li[0].closest(`#combat-tracker`) : await li.closest(`#combat-tracker`);
    
    // Set source's Acted flag to false
    await source.setFlag('weirdwizard', 'acted', false);

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
    
    //siblings.splice(idx, 0, source);

    

    // Perform the update
    return this.combat.updateEmbeddedDocuments("Combatant", updateData);
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
    
    const data = TextEditor.getDragEventData(event);
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
