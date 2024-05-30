import { i18n } from '../helpers/utils.mjs'
import WWCombatTrackerConfig from './combat-config.mjs'

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
      template: 'systems/weirdwizard/templates/apps/combat-tracker.hbs',
      title: 'COMBAT.SidebarTitle',
      scrollY: ['.directory-list'],
      dragDrop: [{dragSelector: ".directory-list .directory-item", dropSelector: ".directory-list"}]
    });
  }

  /* -------------------------------------------- */

  /**
   * Return an array of Combat encounters which occur within the current Scene.
   * @type {Combat[]}
   */
  get combats() {
    return game.combats.combats;
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

    for ( const [i, combatant] of combat.turns.entries() ) {
      if ( !combatant.visible ) continue;
      
      // Prepare turn data
      const resource = combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resource : null,
        resourceMax = combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resourceMax : null,
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
        flags: combatant.flags
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
      turns.push(turn);
    }

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
      control: combat.combatant?.players?.includes(game.user)
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

    // Acted button
    html.find('.combatant-acted').click(ev => this._onCombatantActed(ev));

    // Taking button
    html.find('.combatant-taking').click(ev => this._onCombatantTaking(ev));

    // Allow context on right-click for players too
    if (!game.user.isGM) this._contextMenu(html);
  }

  /* -------------------------------------------- */

  /**
   * Handle a Combatant acted toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _onCombatantActed(event) {
    const isHtml = $(event)[0] instanceof HTMLElement;
    
    // Stop default behavior if it's an event
    if (!isHtml) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Fetch variables
    const li = isHtml ? $(event)[0] : event.currentTarget.closest('.combatant');
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);
    const acted = c.flags.weirdwizard?.acted ? c.flags.weirdwizard.acted : false;
    
    // Combatant status logic

    // Combatant is the current turn
    if (combat.current.combatantId == li.dataset.combatantId) {
      combat.nextTurn();
    
    // Combatant already acted
    }

    // Push the acted status to the token
    const token = c.token;
    if ( !token ) return;

    const status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.ACTED);
    if ( !status && !token.object ) return;
    const effect = token.actor && status ? status : CONFIG.controlIcons.acted;
    /*if ( token.object ) await token.object.toggleEffect(effect, {overlay: true, active: acted});
    else await token.toggleActiveEffect(effect, {overlay: true, active: acted});*/

  }

  /**
   * Handle a Combatant taking toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _onCombatantTaking(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest('.combatant');
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);

    const taking = c.flags.weirdwizard?.takingInit ? !c.flags.weirdwizard.takingInit : true;
    
    c.takingInit(taking);
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
        icon: '<i class="fas fa-edit"></i>',
        condition: li => {
          return game.user.isGM;
        },
        callback: this._onConfigureCombatant.bind(this)
      },
      {
        name: "WW.Combat.Turn.End",
        icon: '<i class="fas fa-hourglass"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          const hasPerms = (combatant.permission == 3 || combatant.players.filter(c => game.user).length);
          return hasPerms && !combatant.flags.weirdwizard?.acted && (combatant === this.viewed.combatant);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return this._onCombatantActed(li);
        }
      },
      {
        name: "WW.Combat.Initiative.Label",
        icon: '<i class="fas fa-person-running-fast"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          const hasPerms = (combatant.permission == 3 || combatant.players.filter(c => game.user).length);
          return hasPerms && (combatant.actor.type === 'Character') && !combatant.flags.weirdwizard?.takingInit && (combatant !== this.viewed.combatant);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant.takingInit(true);
        }
      },
      {
        name: "WW.Combat.Turn.Label",
        icon: '<i class="fas fa-hand-holding-magic"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          const hasPerms = (combatant.permission == 3 || combatant.players.filter(c => game.user).length);
          return hasPerms && (combatant.actor.type === 'Character') && combatant.flags.weirdwizard?.takingInit && (combatant !== this.viewed.combatant);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant.takingInit(false);
        }
      },
      {
        name: "WW.Combat.ActNext.Title",
        icon: '<i class="fas fa-bolt"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          const hasPerms = (combatant.permission == 3 || combatant.players.filter(c => game.user).length);
          return hasPerms && !combatant.flags.weirdwizard?.acted && (combatant !== this.viewed.combatant);
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return this._onActNext(li, combatant.toObject());
        }
      },
      {
        name: "WW.Combat.ActAgain.Title",
        icon: '<i class="fas fa-redo"></i>',
        condition: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          const hasPerms = (combatant.permission == 3 || combatant.players.filter(c => game.user).length);
          return hasPerms && combatant.flags.weirdwizard?.acted;
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return this._onActAgain(li, combatant.toObject());
        }
      },
      {
        name: "COMBAT.CombatantRemove",
        icon: '<i class="fas fa-trash"></i>',
        condition: li => {
          return game.user.isGM;
        },
        callback: li => {
          const combatant = this.viewed.combatants.get(li.data("combatant-id"));
          if ( combatant ) return combatant.delete();
        }
      }
    ];
  }

  /* -------------------------------------------- */

  /**
   * Handle a Act Next Turn event.
   * @param {Event} li
   * @param {Object} combatantData
   * @private
   */
  async _onActNext(li, combatantData) {
    
    // Confirmation dialog
    const confirm = await Dialog.confirm({
      title: i18n('WW.Combat.ActNext.Title'),
      content: i18n('WW.Combat.ActNext.Msg') + '<p class="dialog-sure">' + i18n('WW.Combat.ActNext.Confirm') + '</p>'
    });

    if(!confirm) return;
    
    // Get the drag source and drop target
    const combatants = this.combat.combatants;
    const source = combatants.get(combatantData._id);
    const dropTarget = li[0].closest("[data-combatant-id]");
    if ( !dropTarget ) return;
    const target = this.combat.combatant;
    
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

  /**
   * Handle a Act Again event.
   * @param {Event} li
   * @param {Object} combatantData
   * @private
   */
  async _onActAgain(li, combatantData) {
    
    // Confirmation dialog
    const confirm = await Dialog.confirm({
      title: i18n('WW.Combat.ActAgain.Title'),
      content: i18n('WW.Combat.ActAgain.Msg') + '<p class="dialog-sure">' + i18n('WW.Combat.ActAgain.Confirm') + '</p>'
    });

    if (!confirm) return;
    
    // Get the drag source and drop target
    const combatants = this.combat.combatants;
    const source = combatants.get(combatantData._id);
    const bracket = combatants.filter(c => c.initiativeBracket === source.initiativeBracket);
    const target = combatants.find(c => c.initiative === Math.max(...bracket.map(c => c.initiative)));
    const tracker = li[0].closest(`#combat-tracker`);
    const dropTarget = tracker.querySelector(`[data-combatant-id=${target._id}]`);
    if ( !dropTarget ) return;

    // Set source's Acted flag to false
    await source.setFlag('weirdwizard', 'acted', false);
    
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

  /**
   * Handle toggling the defeated status effect on a combatant Token
   * @param {Combatant} combatant     The combatant data being modified
   * @returns {Promise}                A Promise that resolves after all operations are complete
   * @private
   */
  /*async _onToggleDefeatedStatus(combatant) {
    const isDefeated = !combatant.isDefeated;
    await combatant.update({defeated: isDefeated});
    const token = combatant.token;
    if ( !token ) return;

    // Push the defeated status to the token
    const status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
    if ( !status && !token.object ) return;
    const effect = token.actor && status ? status : CONFIG.controlIcons.defeated;
    if ( token.object ) await token.object.toggleEffect(effect, {overlay: true, active: isDefeated});
    else await token.toggleActiveEffect(effect, {overlay: true, active: isDefeated});
  }*/

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

  get combat () {
    return this.combats.filter(c => c.active === true)[0];
  }

}