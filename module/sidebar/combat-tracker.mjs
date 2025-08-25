import WWCombatant from "../documents/combatant.mjs";
import WWCombatantGroup from "../documents/combatant-group.mjs";

/**
 * An Application that manages switching between Combats and tracking the Combatants in those Combats.
 * @extends {AbstractSidebarTab}
 * @mixes HandlebarsApplication
 */
export default class WWCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    window: {
      title: "COMBAT.SidebarTitle"
    },
    actions: {
      toggleGroupExpand: this.#toggleGroupExpand,
      //activateCombatant: this.#onCombatantMouseDown,
      //trackerSettings: this.#onConfigure
    }
  };
  
  /** @override */
  static tabName = "combat";

  /** @override */
  static PARTS = {
    header: {
      template: "systems/weirdwizard/templates/sidebar/combat/header.hbs"
    },
    tracker: {
      template: "systems/weirdwizard/templates/sidebar/combat/tracker.hbs",
      templates: [
        "systems/weirdwizard/templates/sidebar/combat/combatant.hbs",
        "systems/weirdwizard/templates/sidebar/combat/combatant-group.hbs"
      ]
    },
    footer: {
      template: "systems/weirdwizard/templates/sidebar/combat/footer.hbs"
    }
  };

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    
    switch ( partId ) {
      case "footer": case "header": await this._prepareCombatContext(context, options); break;
      case "tracker": await this._prepareTrackerContext(context, options); break;
    }
    return context;
  }

  /* -------------------------------------------- */

  /**
   * Prepare render context for the footer part.
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<void>}
   * @protected
   */
  async _prepareCombatContext(context, options) {
    const combat = this.viewed;
    const hasCombat = combat !== null;
    const combats = this.combats;
    const currentIdx = combats.indexOf(combat);
    const previousId = combats[currentIdx - 1]?.id;
    const nextId = combats[currentIdx + 1]?.id;
    const isPlayerTurn = combat?.combatant?.players?.includes(game.user);
    const canControl = combat?.turn && combat.turn.between(1, combat.turns.length - 2)
      ? combat.canUserModify(game.user, "update", { turn: 0 })
      : combat?.canUserModify(game.user, "update", { round: 0 });

    
    //const settings = game.settings.get('core', Combat.CONFIG_SETTING); - no longer needed?

    /*context = foundry.utils.mergeObject(context, {
      turns: [],
      started: this.started,
      settings,
    });*/

    Object.assign(context, {
      combat, hasCombat, nextId, previousId,
      combats: combats.map(({ id }, i) => ({ id, label: i + 1, active: i === currentIdx })),
      control: isPlayerTurn && canControl,
      css: combats.length > 8 ? "cycle" : combats.length ? "tabbed" : "",
      currentIndex: currentIdx + 1,
      displayCycle: combats.length > 8,
      initiativeIcon: CONFIG.Combat.initiativeIcon,
      linked: combat?.scene !== null,
      labels: {
        scope: game.i18n.localize(`COMBAT.${combat?.scene ? "Linked" : "Unlinked"}`)
      }
    });
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Prepare render context for the tracker part.
   * @param {ApplicationRenderContext} context
   * @param {HandlebarsRenderOptions} options
   * @returns {Promise<void>}
   * @protected
   */
  async _prepareTrackerContext(context, options) {
    const combat = this.viewed;
    if ( !combat ) return;
    let hasDecimals = false;
    const turns = context.turns = [];

    // Prepare phases object
    const phases = {
      init: {
        label: "WW.Combat.Phase.Initiative",
        icon: "systems/weirdwizard/assets/icons/reactions.svg",
        actedCount: 0,
        turns: []
      },
      enemies: {
        label: "WW.Combat.Phase.Enemies",
        icon: "systems/weirdwizard/assets/icons/skull-shield.svg",
        actedCount: 0,
        turns: []
      },
      allies: {
        label: "WW.Combat.Phase.Allies",
        icon: "systems/weirdwizard/assets/icons/heart-shield.svg",
        actedCount: 0,
        turns: []
      }
    }
    
    // Push Combatants and Groups to Turns
    for ( const [i, turn] of combat.turns.entries() ) {
      if ( !turn.visible ) continue;
      if ( turn.group ) continue;
      const preparedTurn = await this._prepareTurnContext(combat, turn, i);
      if ( preparedTurn.hasDecimals ) hasDecimals = true;

      // Push to to turns and respective phase
      turns.push(preparedTurn);
      phases[turn.phase].turns.push(preparedTurn);
    }

    // Count creatures acted per phase
    phases.init.turns.forEach(t => { if (t.acted) phases.init.actedCount += 1 });
    phases.enemies.turns.forEach(t => { if (t.acted) phases.enemies.actedCount += 1 });
    phases.allies.turns.forEach(t => { if (t.acted) phases.allies.actedCount += 1 });

    context.phases = phases;
    
    // Format initiative numeric precision.
    const precision = CONFIG.Combat.initiative.decimals;
    turns.forEach(t => {
      if ( Number.isFinite(t.initiative) ) t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
    });
    context.hasDecimals = hasDecimals;

    // Merge update data for rendering
    /*return foundry.utils.mergeObject(context, {
      round: combat.round,
      turn: combat.turn,
      turns: turns,
      standby: combat.standby
    });*/
  }

  /* -------------------------------------------- */

  /**
   * Prepare render context for a single turn entry in the combat tracker.
   * @param {Combat} combat        The active combat.
   * @param {Combatant || CombatantGroup} entry  The Combatant whose turn is being prepared.
   * @param {number} index         The index of this entry in the turn order.
   * @returns {Promise<object>}
   * @protected
   */
  async _prepareTurnContext(combat, entry, index) {
    const { id, name, isOwner, isDefeated, hidden, initiative, permission, acted, injured, takingInit, phase, _expanded } = entry;
    const hasDecimals = Number.isFinite(initiative) && !Number.isInteger(initiative);
    const isGroup = entry.documentName === 'CombatantGroup' ? true : false;
    
    const turn = {
      hasDecimals, hidden, id, isDefeated, initiative, isOwner, name, phase,
      isGroup: isGroup,
      active: index === combat.turn,
      canPing: (entry.sceneId === canvas.scene?.id) && game.user.hasPermission("PING_CANVAS"),
      img: await this._getCombatantThumbnail(entry)
    };

    // Turn CSS classes
    turn.css = [
      entry.actor?.type === 'character' ? 'character' : null,
      turn.active ? "active" : null,
      hidden ? "hide" : null,
      acted ? 'acted' : null,
      takingInit ? 'taking-init' : null,
      isDefeated ? "defeated" : null,
      injured ? 'injured' : null,
      permission >= 2 ? "has-perms" : null,
      _expanded ? "expanded" : null
    ].filterJoin(" ");

    if (isGroup) {
      // Assign Combatant Group specific context
      Object.assign(turn, {
        isGroup: isGroup,
        groupTurns: [],
        numMembers: entry.members.size,
        numActed: entry.numActed,
        numDefeated: entry.numDefeated
      })

      // Prepare member Combatant turns
      for ( const [i, member] of entry.members.entries() ) {
        if ( !member.visible ) continue;
        const groupTurn = await this._prepareTurnContext(combat, member, i);
        if ( groupTurn.hasDecimals ) hasDecimals = true;
        
        // Push to to turns and respective phase
        turn.groupTurns.push(groupTurn);
      }
    
    } else {
      // Assign Combatant specific context
      const resource = permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? entry.resource : null;
      const resourceMax = entry.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? entry.resourceMax : null;

      Object.assign(turn, {
        resource, resourceMax,
        acted: entry.acted,
        canPing: (entry.sceneId === canvas.scene?.id) && game.user.hasPermission("PING_CANVAS")
      })

      // Effects icons
      const effects = [];

      for ( const effect of entry.actor?.temporaryEffects ?? [] ) {
        if ( effect.statuses.has(CONFIG.specialStatusEffects.DEFEATED) ) turn.isDefeated = true;
        else if ( effect.img ) effects.push({ img: effect.img, name: effect.name });
      }

      turn.effects = {
        icons: effects,
        tooltip: this._formatEffectsTooltip(effects)
      };

      // Prepare Turn Control tooltip
      if (entry.permission >= 2) { // Check if user has permission
        // Default
        turn.controlTooltip = 'WW.Combat.Standby';

        // Combat NOT in standby; NOT acted; is current turn: End turn
        if (!combat.standby && !acted && entry === combat.combatant) turn.controlTooltip = 'WW.Combat.EndTurn';

        // Combat in standby; Combatant has not acted; NOT current turn: Start a turn
        else if (combat.standby && !acted && entry !== combat.combatant) turn.controlTooltip = 'WW.Combat.StartTurn.Title';

        // Already acted; is a Character: Toggle between regular turn and taking the initiative
        else if (acted && entry.actor.type === 'character') {
          if (await entry.takingInit) turn.controlTooltip = 'WW.Combat.Initiative.ClickTip'
          else turn.controlTooltip = 'WW.Combat.RegularTurn.ClickTip';
        }

        // Combatant already acted
        else if (acted) turn.controlTooltip = 'WW.Combat.ResetTurn.Title';

        // User has no permission over the combatant
      } else turn.controlTooltip = 'WW.Combat.NoPermission';
    }
    

    return turn;
  }

  /* -------------------------------------------- */
  
  /** @inheritdoc */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Initiate dragDrop
    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: ".combatant",
      dropSelector: ".combatant-group, .combat-tracker",
      permissions: {
        dragstart: () => game.user.isGM,
        drop: () => game.user.isGM,
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      },
    }).bind(this.element);

    // Initiate dragDrop
    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: ".combatant-group",
      dropSelector: ".combatant-group, .combatant",
      permissions: {
        dragstart: () => game.user.isGM,
        drop: () => game.user.isGM,
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      },
    }).bind(this.element);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    if ( !this.isPopout ) game.combats.apps.push(this);

    // Combatant context menu
    /** @fires {hookEvents:getCombatantContextOptions} */
    this._createContextMenu(this._getEntryContextOptions, ".combatant", {fixed: true});

    // Combatant Group context menu
    /** @fires {hookEvents:getCombatantContextOptions} */
    this._createContextMenu(this._getGroupContextOptions, ".combatant-group", {fixed: true});

    // Combat controls menu
    if ( game.user.isGM ) {
      /** @fires {hookEvents:getCombatContextOptions} */
      this._createContextMenu(this._getCombatContextOptions, ".encounter-context-menu", {
        eventName: "click",
        fixed: true,
        hookName: "getCombatContextOptions",
        parentClassHooks: false
      });
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners & Handlers                  */
  /* -------------------------------------------- */

  /** @inheritDoc */
  _attachFrameListeners() {
    super._attachFrameListeners();
    this.element.addEventListener("pointerover", this._onCombatantHoverIn.bind(this), { passive: true });
    this.element.addEventListener("pointerout", this._onCombatantHoverOut.bind(this), { passive: true });
    this.element.addEventListener("dblclick", event => {
      this._onCombatantMouseDown(event, event.target.closest("[data-combatant-id]"));
    }, { passive: true });
    this.element.addEventListener("change", this._onChangeInput.bind(this), { passive: true });
    this.element.addEventListener("focusin", event => {
      if ( event.target instanceof HTMLInputElement ) event.target.select();
    }, { passive: true });
  }

  /* -------------------------------------------- */

  /**
   * Get context menu entries for Combatants in the tracker.
   * @returns {ContextMenuEntry[]}
   * @protected
   */
  _getEntryContextOptions() {
    const getCombatant = li => this.viewed.combatants.get(li.dataset.combatantId);
    const hasPerms = li => getCombatant(li)?.permission >= 2;
    
    return [{
      name: "COMBAT.CombatantUpdate",
      icon: '<i class="fa-solid fa-pen-to-square"></i>',
      condition: () => game.user.isGM,
      callback: li => getCombatant(li)?.sheet.render({
        force: true,
        position: {
          top: Math.min(li.offsetTop, window.innerHeight - 350),
          left: window.innerWidth - 720
        }
      })
    }, {
      name: "WW.Combat.EndTurn",
      icon: '<i><img src="systems/weirdwizard/assets/icons/check-mark.svg"></i>',
      condition: li => {
        const combatant = getCombatant(li);
        return (hasPerms) && !combatant?.acted && (combatant === this.viewed.combatant);
      },
      callback: li => {
        const combatant = getCombatant(li);
        if (combatant) return this.viewed.nextTurn();
      }
    }, {
      name: "WW.Combat.StartTurn.Title",
      icon: '<i><img src="systems/weirdwizard/assets/icons/pointy-sword.svg"></i>',
      condition: li => {
        const combatant = getCombatant(li);
        return (hasPerms(li)) && !combatant?.acted && (combatant !== this.viewed.combatant);
      },
      callback: li => {
        const combatant = getCombatant(li);
        if (combatant) return this.viewed.startTurn(li, combatant);
      }
    }, {
      name: "WW.Combat.Initiative.Label",
      icon: '<i><img src="systems/weirdwizard/assets/icons/reactions.svg"></i>',
      condition: li => {
        const combatant = getCombatant(li);
        return (hasPerms(li)) && (combatant?.actor.type === 'character') && !combatant?.takingInit && (combatant !== this.viewed.combatant);
      },
      callback: li => {
        const combatant = getCombatant(li);
        if (combatant) return combatant?.takeInit(true);
      }
    }, {
      name: "WW.Combat.RegularTurn.Label",
      icon: '<i><img src="systems/weirdwizard/assets/icons/actions.svg"></i>',
      condition: li => {
        const combatant = getCombatant(li);
        return (hasPerms(li)) && (combatant?.actor.type === 'character') && combatant?.takingInit && (combatant !== this.viewed.combatant);
      },
      callback: li => {
        const combatant = getCombatant(li);
        if (combatant) return combatant?.takeInit(false);
      }
    }, {
      name: "WW.Combat.ResetActed.Title",
      icon: '<i><img src="systems/weirdwizard/assets/icons/anticlockwise-rotation.svg"></i>',
      condition: li => {
        const combatant = getCombatant(li);
        return (hasPerms(li)) && combatant?.acted;
      },
      callback: li => {
        const combatant = getCombatant(li);
        if (combatant) return combatant?.resetActed();
      }
    }, /*{
      name: "COMBAT.CombatantClear",
      icon: '<i class="fa-solid fa-arrow-rotate-left"></i>',
      condition: li => game.user.isGM && Number.isFinite(getCombatant(li)?.initiative),
      callback: li => getCombatant(li)?.update({ initiative: null })
    }, {
      name: "COMBAT.CombatantReroll",
      icon: '<i class="fa-solid fa-dice-d20"></i>',
      condition: () => game.user.isGM,
      callback: li => {
        const combatant = getCombatant(li);
        if ( combatant ) return this.viewed.rollInitiative([combatant.id]);
      }
    },*/ {
      name: "COMBAT.CombatantClearMovementHistory",
      icon: '<i class="fa-solid fa-shoe-prints"></i>',
      condition: li => game.user.isGM && (getCombatant(li)?.token?.movementHistory.length > 0),
      callback: async li => {
        const combatant = getCombatant(li);
        if ( !combatant ) return;
        await combatant.clearMovementHistory();
        ui.notifications.info("COMBAT.CombatantMovementHistoryCleared", {format: {name: combatant.token.name}});
      }
    }, {
      name: "COMBAT.CombatantRemove",
      icon: '<i class="fa-solid fa-trash"></i>',
      condition: () => game.user.isGM,
      callback: li => getCombatant(li)?.delete()
    }];

  }

  /* -------------------------------------------- */

  /**
   * Get context menu entries for Combat in the tracker.
   * @returns {ContextMenuEntry[]}
   * @protected
   */
  _getCombatContextOptions() {
    return [
      {
        name: game.i18n.format("DOCUMENT.Create", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: '<i class="fa-solid fa-users-rectangle"></i>',
        callback: () => WWCombatantGroup.createDialog({}, { parent: this.viewed }),
      }, {
        name: "WW.Combat.AddGroup",
        icon: '<i class="fa-solid fa-user-plus"></i>',
        condition: () => game.user.isGM && !!this.viewed,
        callback: () => this.viewed.addGroup()
      }, {
        name: "COMBAT.ClearMovementHistories",
        icon: '<i class="fa-solid fa-shoe-prints"></i>',
        condition: () => game.user.isGM && (this.viewed?.combatants.size > 0),
        callback: () => this.viewed.clearMovementHistories()
      }, {
        name: "COMBAT.Delete",
        icon: '<i class="fa-solid fa-trash"></i>',
        condition: () => game.user.isGM && !!this.viewed,
        callback: () => this.viewed.endCombat()
      }
    ];
  }

  /* -------------------------------------------------- */

  /**
   * Get the context menu entries for Combatant Groups in the tracker.
   * Only available to game masters.
   * @returns {ContextMenuEntry[]}
   */
  _getGroupContextOptions() {
    /** @type {(li: HTMLElement) => WWCombatantGroup} */
    const getCombatantGroup = li => this.viewed.groups.get(li.dataset.groupId);
    return [
      {
        name: game.i18n.format("DOCUMENT.Update", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "<i class=\"fa-solid fa-edit\"></i>",
        condition: li => getCombatantGroup(li).isOwner,
        callback: li => getCombatantGroup(li)?.sheet.render({
          force: true,
          position: {
            top: Math.min(li.offsetTop, window.innerHeight - 350),
            left: window.innerWidth - 720,
          },
        }),
      },
      {
        name: "DRAW_STEEL.CombatantGroup.ResetSquadHP",
        icon: "<i class=\"fa-solid fa-rotate\"></i>",
        condition: li => {
          const group = getCombatantGroup(li);
          return ((group.type === "squad") && group.isOwner);
        },
        callback: li => {
          const group = getCombatantGroup(li);
          group.update({ "system.staminaValue": group.system.staminaMax });
        },
      },
      {
        name: "COMBAT.ClearMovementHistories",
        icon: "<i class=\"fa-solid fa-shoe-prints\"></i>",
        condition: li => game.user.isGM,
        callback: li => getCombatantGroup(li).clearMovementHistories(),
      },
      {
        name: game.i18n.format("DOCUMENT.Delete", { type: game.i18n.localize("DOCUMENT.CombatantGroup") }),
        icon: "<i class=\"fa-solid fa-trash\"></i>",
        condition: li => game.user.isGM,
        callback: li => getCombatantGroup(li).delete(),
      },
      {
        name: "OWNERSHIP.Configure",
        icon: "<i class=\"fa-solid fa-lock\"></i>",
        condition: game.user.isGM,
        callback: li => new foundry.applications.apps.DocumentOwnershipConfig({
          document: getCombatantGroup(li),
          position: {
            top: Math.min(li.offsetTop, window.innerHeight - 350),
            left: window.innerWidth - 720,
          },
        }).render({ force: true }),
      },
    ];
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Toggle a Combatant Group
   * @this DrawSteelCombatTracker
   * @param {PointerEvent} event The triggering event.
   * @param {HTMLElement} target The action target element.
   */
  static async #toggleGroupExpand(event, target) {
    // Don't proceed if the click event was actually on one of the combatants
    const entry = event.target.closest("[data-combatant-id]");
    if (entry) return;

    const combat = this.viewed;
    const group = combat.groups.get(target.dataset.groupId);

    group._expanded = !group._expanded;
    
    // Main sidebar renders are automatically propagated to popouts
    await ui.combat.render();
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onClickAction(event, target) {
    if ( !event.target.closest(".combat-control") ) return;
    const combat = this.viewed;
    target.disabled = true;
    try { await combat[target.dataset.action]?.(); }
    finally { target.disabled = false; }
  }

  /**
   * Handle performing some action for an individual combatant.
   * @this {CombatTracker}
   * @param {...any} args
   */
  static #onCombatantControl(...args) {
    return this._onCombatantControl(...args);
  }

  /* -------------------------------------------- */

  /**
   * Handle performing some action for an individual combatant.
   * @param {PointerEvent} event  The triggering event.
   * @param {HTMLElement} target  The action target element.
   * @protected
   */
  _onCombatantControl(event, target) {
    const { combatantId } = target.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed?.combatants.get(combatantId);
    if ( !combatant ) return;

    switch ( target.dataset.action ) {
      case "pingCombatant": return this._onPingCombatant(combatant);
      case "panToCombatant": return this._onPanToCombatant(combatant);
      case "rollInitiative": return this._onRollInitiative(combatant);
      case "toggleDefeated": return this._onToggleDefeatedStatus(combatant);
      case "toggleHidden": return this._onToggleHidden(combatant);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle activating a combatant in the tracker.
   * @this {CombatTracker}
   * @param {...any} args
   */
  static #onCombatantMouseDown(...args) {
    return this._onCombatantMouseDown(...args);
  }

  /* -------------------------------------------- */

  /**
   * Handle activating a combatant in the tracker.
   * @param {PointerEvent} event  The triggering event.
   * @param {HTMLElement} target  The action target element.
   * @protected
   */
  _onCombatantMouseDown(event, target) {
    if ( (event.target instanceof HTMLInputElement) || (event.target instanceof HTMLButtonElement) ) return;
    const { combatantId } = target?.dataset ?? {};
    const combatant = this.viewed.combatants.get(combatantId);
    if ( !combatant ) return;
    if ( event.type === "dblclick" ) {
      if ( combatant.actor?.testUserPermission(game.user, "OBSERVER") ) combatant.actor?.sheet.render(true);
      return;
    }
    const token = combatant.token?.object;
    if ( !token ) return;
    const controlled = token.control({ releaseOthers: true });
    if ( controlled ) canvas.animatePan(token.center);
  }

  /* -------------------------------------------- */
  /*  Drag & Drop                                 */
  /* -------------------------------------------- */

  /**
   * An event that occurs when a drag workflow begins for a draggable combatant on the combat tracker.
   * @param {DragEvent} event       The initiating drag start event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDragStart(event) {
    const li = event.currentTarget;
    const combatant = this.viewed.combatants.get(li.dataset.combatantId);
    if (!combatant) return;
    const dragData = combatant.toDragData();
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /* -------------------------------------------------- */

  /**
   * An event that occurs when a drag workflow moves over a drop target.
   * @param {DragEvent} event
   * @protected
   */
  _onDragOver(event) {
    // TODO: Highlight the drop target?
    // console.debug(this, event);
  }

  /* -------------------------------------------------- */

  /**
   * An event that occurs when data is dropped into a drop target.
   * @param {DragEvent} event
   * @returns {Promise<void>}
   * @protected
   */
  async _onDrop(event) {
    // Combat Tracker contains combatant groups, which means this would fire twice
    event.stopPropagation();
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    /** @type {WWCombatant} */
    const combatant = await WWCombatant.fromDropData(data);
    /** @type {HTMLLIElement | null} */
    const groupLI = event.target.closest(".combatant-group");
    if (groupLI) {
      /** @type {WWCombatantGroup} */
      const group = this.viewed.groups.get(groupLI.dataset.groupId);
      if (group.system.captain && !combatant.actor?.isMinion) {
        ui.notifications.error("DRAW_STEEL.CombatantGroup.Error.SquadOneCaptain", { localize: true });
      }
      else if ((combatant.actor?.isMinion && (group.type !== "squad"))) {
        ui.notifications.error("DRAW_STEEL.CombatantGroup.Error.MinionMustSquad", { localize: true });
      }
      else {
        combatant.update({ group });
      }
    }
    else {
      combatant.update({ group: null });
    }
  }

}