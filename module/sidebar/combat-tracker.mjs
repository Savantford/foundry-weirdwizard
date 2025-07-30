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
        "systems/weirdwizard/templates/sidebar/combat/combatant.hbs"
      ]
    },
    footer: {
      template: "systems/weirdwizard/templates/sidebar/combat/footer.hbs"
    }
  };

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * Format a tooltip for displaying overflowing effects.
   * @param {{ img: string, name: string }[]} effects  The effect names and icons.
   * @returns {string}
   * @protected
   */
  _formatEffectsTooltip(effects) { // maybe modify
    if ( !effects.length ) return "";
    const ul = document.createElement("ul");
    ul.classList.add("effects-tooltip", "plain");
    for ( const effect of effects ) {
      const img = document.createElement("img");
      img.src = effect.img;
      img.alt = effect.name;
      const span = document.createElement("span");
      span.textContent = effect.name;
      const li = document.createElement("li");
      li.append(img, span);
      ul.append(li);
    }
    return ul.outerHTML;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    if ( !this.isPopout ) game.combats.apps.push(this);

    // Combatant context menu
    /** @fires {hookEvents:getCombatantContextOptions} */
    this._createContextMenu(this._getEntryContextOptions, ".combatant", {fixed: true});

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
    context.init = [];
    context.enemies = [];
    context.allies = [];

    for ( const [i, combatant] of combat.turns.entries() ) {
      if ( !combatant.visible ) continue;
      const turn = await this._prepareTurnContext(combat, combatant, i);
      if ( turn.hasDecimals ) hasDecimals = true;

      // Push to to turns and respective phase
      turns.push(turn);
      
      if (turn.type === 'character') {
        if (turn.takingInit) context.init.push(turn); else context.allies.push(turn);
      } else {
        if (turn.disposition === 1) context.allies.push(turn); else context.enemies.push(turn);
      }
    }

    // Count creatures acted per phase
    context.acted = { init: 0, enemies: 0, allies: 0 };

    context.init.forEach(t => { if (t.acted) context.acted.init += 1 });
    context.enemies.forEach(t => { if (t.acted) context.acted.enemies += 1 });
    context.allies.forEach(t => { if (t.acted) context.acted.allies += 1 });

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
   * Prepare render context for a single entry in the combat tracker.
   * @param {Combat} combat        The active combat.
   * @param {Combatant} combatant  The Combatant whose turn is being prepared.
   * @param {number} index         The index of this entry in the turn order.
   * @returns {Promise<object>}
   * @protected
   */
  async _prepareTurnContext(combat, combatant, index) {
    const { id, name, isOwner, isDefeated, hidden, initiative, permission, acted, injured, takingInit } = combatant;
    const resource = permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resource : null;
    const resourceMax = combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resourceMax : null;
    const hasDecimals = Number.isFinite(initiative) && !Number.isInteger(initiative);
    
    const turn = {
      hasDecimals, hidden, id, isDefeated, initiative, isOwner, name, resource, resourceMax,
      active: index === combat.turn,
      acted: combatant.acted,
      canPing: (combatant.sceneId === canvas.scene?.id) && game.user.hasPermission("PING_CANVAS"),
      img: await this._getCombatantThumbnail(combatant)
    };

    // Turn CSS classes
    turn.css = [
      combatant.actor?.type === 'character' ? 'character' : null,
      turn.active ? "active" : null,
      hidden ? "hide" : null,
      acted ? 'acted' : null,
      takingInit ? 'taking-init' : null,
      isDefeated ? "defeated" : null,
      injured ? 'injured' : null,
      permission >= 2 ? "has-perms" : null
    ].filterJoin(" ");

    // Effects icons
    const effects = [];

    for ( const effect of combatant.actor?.temporaryEffects ?? [] ) {
      if ( effect.statuses.has(CONFIG.specialStatusEffects.DEFEATED) ) turn.isDefeated = true;
      else if ( effect.img ) effects.push({ img: effect.img, name: effect.name });
    }

    turn.effects = {
      icons: effects,
      tooltip: this._formatEffectsTooltip(effects)
    };

    // Prepare Turn Control tooltip
    if (combatant.permission >= 2) { // Check if user has permission

      // Default
      turn.controlTooltip = 'WW.Combat.Standby';

      // Combat NOT in standby; NOT acted; is current turn: End turn
      if (!combat.standby && !acted && combatant === combat.combatant) turn.controlTooltip = 'WW.Combat.EndTurn';

      // Combat in standby; Combatant has not acted; NOT current turn: Start a turn
      else if (combat.standby && !acted && combatant !== combat.combatant) turn.controlTooltip = 'WW.Combat.StartTurn.Title';

      // Already acted; is a Character: Toggle between regular turn and taking the initiative
      else if (acted && combatant.actor.type === 'character') {
        if (await combatant.takingInit) turn.controlTooltip = 'WW.Combat.Initiative.ClickTip'
        else turn.controlTooltip = 'WW.Combat.RegularTurn.ClickTip';
      }

      // Combatant already acted
      else if (acted) turn.controlTooltip = 'WW.Combat.ResetTurn.Title';

      // User has no permission over the combatant
    } else turn.controlTooltip = 'WW.Combat.NoPermission';

    return turn;
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
    return [{
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
    }];
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

  /* -------------------------------------------- */

  /**
   * Cycle to a different combat encounter in the tracker.
   * @this {CombatTracker}
   * @param {...any} args
   */
  static #onCombatCycle(...args) {
    return this._onCombatCycle(...args);
  }

  /* -------------------------------------------- */

  /**
   * Cycle to a different combat encounter in the tracker.
   * @param {PointerEvent} event  The triggering event.
   * @param {HTMLElement} target  The action target element.
   * @protected
   */
  _onCombatCycle(event, target) {
    const { combatId } = target.dataset;
    return game.combats.get(combatId)?.activate({ render: false });
  }

  /* -------------------------------------------- */

  /**
   * Create a new combat.
   * @this {CombatTracker}
   * @param {...any} args
   * @returns {Promise<void>}
   */
  static #onCombatCreate(...args) {
    return this._onCombatCreate(...args);
  }

  /* -------------------------------------------- */

  /**
   * Create a new combat.
   * @param {PointerEvent} event  The triggering event.
   * @param {HTMLElement} target  The action target element.
   * @returns {Promise<void>}
   * @protected
   */
  async _onCombatCreate(event, target) {
    const combat = await Combat.implementation.create();
    combat.activate({ render: false });
  }

  /* -------------------------------------------- */

  /**
   * Spawn the combat tracker settings dialog.
   * @this {CombatTracker}
   * @param {PointerEvent} event  The triggering event.
   * @param {HTMLElement} target  The action target element.
   */
  static #onConfigure(event, target) {
    return new foundry.applications.apps.CombatTrackerConfig().render({ force: true });
  }

  /* -------------------------------------------- */

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
   * Handle hovering over a combatant in the tracker.
   * @param {PointerEvent} event  The triggering event.
   * @protected
   */
  /*_onCombatantHoverIn(event) {
    const { combatantId } = event.target.closest(".combatant[data-combatant-id]")?.dataset ?? {};
    if ( !canvas.ready || !combatantId ) return;
    const combatant = this.viewed.combatants.get(combatantId);
    const token = combatant.token?.object;
    if ( token && token._canHover(game.user, event) && this._isTokenVisible(token) ) {
      token._onHoverIn(event, { hoverOutOthers: true });
      this.#highlighted = token;
    }
  }*/

  /* -------------------------------------------- */

  /**
   * Handle hovering out a combatant in the tracker.
   * @param {PointerEvent} event  The triggering event.
   * @protected
   */
  /*_onCombatantHoverOut(event) {
    this.#highlighted?._onHoverOut(event);
    this.#highlighted = null;
  }*/

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

  /**
   * Handle panning to a combatant's token.
   * @param {Combatant} combatant  The combatant.
   * @protected
   */
  _onPanToCombatant(combatant) {
    if ( !canvas.ready || (combatant.sceneId !== canvas.scene.id) ) return;
    const token = combatant.token?.object;
    if ( !token || !this._isTokenVisible(token) ) {
      ui.notifications.warn("COMBAT.WarnNonVisibleToken", { localize: true });
      return;
    }
    const { x, y } = token.center;
    return canvas.animatePan({ x, y, scale: Math.max(canvas.stage.scale.x, canvas.dimensions.scale.default) });
  }

  /* -------------------------------------------- */

  /**
   * Handle pinging a combatant's token.
   * @param {Combatant} combatant  The combatant.
   * @protected
   */
  _onPingCombatant(combatant) {
    if ( !canvas.ready || (combatant.sceneId !== canvas.scene.id) ) return;
    const token = combatant.token?.object;
    if ( !token || !this._isTokenVisible(token) ) {
      ui.notifications.warn("COMBAT.WarnNonVisibleToken", { localize: true });
      return;
    }
    return canvas.ping(token.center);
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling initiative for a single combatant.
   * @param {Combatant} combatant  The combatant.
   * @protected
   */
  _onRollInitiative(combatant) {
    return this.viewed.rollInitiative([combatant.id]);
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling the defeated status effect on a combatant token.
   * @param {Combatant} combatant  The combatant.
   * @returns {Promise<void>}
   * @protected
   */
  async _onToggleDefeatedStatus(combatant) {
    const isDefeated = !combatant.isDefeated;
    await combatant.update({ defeated: isDefeated });
    const defeatedId = CONFIG.specialStatusEffects.DEFEATED;
    await combatant.actor?.toggleStatusEffect(defeatedId, { overlay: true, active: isDefeated });
  }

  /* -------------------------------------------- */

  /**
   * Toggle a combatant's hidden state in the tracker.
   * @param {Combatant} combatant  The combatant.
   * @protected
   */
  _onToggleHidden(combatant) {
    return combatant.update({ hidden: !combatant.hidden });
  }

  /* -------------------------------------------- */

  /**
   * The CombatTracker application is not a <form> element by default, but it does handle specific input events.
   * @param {Event} event  The triggering change event.
   * @protected
   */
  _onChangeInput(event) {
    const input = event.target;
    if ( input.classList.contains("initiative-input") ) {
      return this._onUpdateInitiative(event);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle updating a combatant's initiative in-sheet.
   * @param {Event} event  The triggering change event.
   * @protected
   */
  _onUpdateInitiative(event) {
    const { combatantId } = event.target.closest("[data-combatant-id]")?.dataset ?? {};
    const combatant = this.viewed.combatants.get(combatantId);
    if ( !combatant ) return;
    const raw = event.target.value;
    const isDelta = /^[+-]/.test(raw);
    if ( !isDelta || (raw[0] === "=") ) {
      return combatant.update({ initiative: raw ? Number(raw.replace(/^=/, "")) : null });
    }
    const delta = parseInt(raw);
    if ( !isNaN(delta) ) return combatant.update({ initiative: combatant.initiative + delta });
  }

  /* -------------------------------------------- */
  /*  Public API                                  */
  /* -------------------------------------------- */

  /**
   * Highlight a hovered combatant in the tracker.
   * @param {Combatant} combatant  The Combatant.
   * @param {boolean} hover        Whether they are being hovered in or out.
   */
  hoverCombatant(combatant, hover) {
    const trackers = [this.element];
    if ( this.popout?.rendered ) trackers.push(this.popout.element);
    for ( const tracker of trackers ) {
      const li = tracker.querySelector(`.combatant[data-combatant-id="${combatant.id}"]`);
      if ( !li ) break;
      if ( hover ) li.classList.add("hover");
      else li.classList.remove("hover");
    }
  }

  /* -------------------------------------------- */

  /**
   * Is the token of the combatant visible?
   * @param {Token} token    The token of the combatant
   * @returns {boolean}      Is the token visible?
   * @protected
   */
  _isTokenVisible(token) {
    return token.visible;
  }

  /* -------------------------------------------- */

  /**
   * Infer which Combat document should be viewed on the tracker, if any.
   * If the active combat is available for the current scene, prioritize it.
   * Otherwise, choose the most recently modified Combat encounter as the one we should view.
   * @returns {Combat|null}
   */
  #inferCombat() {
    const sceneCombats = [];
    for ( const c of game.combats ) {
      if ( c.isActive ) return c;
      else if ( !c.scene || (c.scene === game.scenes.current) ) sceneCombats.push(c);
    }
    sceneCombats.sort((a, b) => b._stats.modifiedTime - a._stats.modifiedTime); // Most recent
    return sceneCombats[0] || null;
  }
}