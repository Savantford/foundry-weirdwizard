import WWDialog from '../apps/dialog.mjs';
import { i18n } from '../helpers/utils.mjs';
import WWCombatant from './combatant.mjs';

/**
 * @typedef {Object} CombatHistoryData
 * @property {number|null} round
 * @property {number|null} turn
 * @property {string|null} tokenId
 * @property {string|null} combatantId
 */

/**
 * The client-side Combat document which extends the common BaseCombat model.
 *
 * @extends documents.BaseCombat
 * @mixes ClientDocumentMixin
 *
 * @see {@link documents.Combats}             The world-level collection of Combat documents
 * @see {@link Combatant}                     The Combatant embedded document which exists within a Combat document
 * @see {@link CombatConfig}                  The Combat configuration application
 */
export default class WWCombat extends Combat {

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * Return the object of settings which modify the Combat Tracker behavior
   * @type {object}
   */
  get skipActed() {
    return game.settings.get('weirdwizard', 'skipActed');
  }

  /* -------------------------------------------- */

  /**
   * Return the Combat Tracker's standby state
   * @type {boolean}
  */
  get onStandby () {
    return this.turn === null ? true : false;
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */
  
  async _preCreate(...[data, options, user]) {
    // Start the combat without a current turn
    return this.updateSource({ turn: null }), super._preCreate(data, options, user);
  }

  /* -------------------------------------------- */

  /**
   * @override
   * @param {object} data Update data
   * @param {options} options Context options
   * @param {string} userId Triggering user ID
   */
  async _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);

    /*try {
      this._expireEffectsOnUpdate(data, options, userId);
    } catch (error) {
      console.error(error);
    }*/

    // Update Status Icons
    this.combatants.forEach(c => c.token?.object?.updateStatusIcons());
    
    // If not a GM, show a Take The Initiative prompt at the beginning of a new round
    if (options.direction !== -1 && data.round && !game.user.isGM) {
      
      if (!game.user.character) {
        ui.notifications.warn(i18n('WW.Combat.Initiative.NoCharacter'));
      } else {
        // Check if the users's character is present as a combatant in the current combat
        for (const c of game.combat.combatants) {
          if (c.actorId == game.user.character.id) {
            const confirm = await WWDialog.confirm({
              window: {
                title: 'WW.Combat.Initiative.Title',
                icon: 'fa-solid fa-bolt'
              },
              content: i18n('WW.Combat.Initiative.Msg')
            })
            
            c.takeInit(confirm);
          }
        }
  
      }
    }
    
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    
    // Update Status Icons after deleting the combat
    this.combatants.forEach(c => c.token?.object?.updateStatusIcons());
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /**
   * @override
   * Begin the combat encounter, advancing to round 1 and turn 1
   * @returns {Promise<this>}
   */
  /*async startCombat() { 
    await super.startCombat();
    console.log('starting combat!')
    return this;
  }*/

  /* -------------------------------------------- */

  /**
   * @override
   * Advance the combat to the next round
   * @returns {Promise<this>}
   */
  async nextRound() {
    this.turns.forEach((t) => t.setFlag('weirdwizard', 'acted', false)); // Reset acted flag
    console.log('next round')
    await super.nextRound();
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Rewind the combat to the previous round
   * @returns {Promise<this>}
   */
  async previousRound() {
    this.turns.forEach((t) => t.setFlag('weirdwizard', 'acted', false)); // Reset acted flag
    
    await super.previousRound();
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Ends the current turn when called.
   * @returns {Promise<Combat>}
   */
  async nextTurn() {
    this.endTurn();
  }

  /* -------------------------------------------- */

  /**
   * Ends the current turn without starting a new one.
   * Based on Combat#nextTurn.
   * @param {WWCombatant} combatant
   * @returns {Promise<Combat>}
   */
  async endTurn(combatant) {
    // Mark current combatant, if any, as acted
    if (combatant ?? this.combatant) await this.combatant.setFlag('weirdwizard', 'acted', true);

    // Update Data and Options
    const updateData = { turn: null }, updateOptions = { direction: 0, worldTime: {delta: 0} };
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    await this.update(updateData, updateOptions);
    return this;
  }

  /* -------------------------------------------- */

  /**
   * A custom method based on nextTurn() to attempt to take the next turn as the combatant.
   * Based on Combat#nextTurn.
   * @param {WWCombatant} combatant
   * @returns {Promise<Combat>}
   */
  async startTurn(combatant) {
    // Return earlier if the combatant is null or has acted
    if (!(combatant != null && !combatant.acted)) return this;

    // Confirmation dialog
    const confirm = game.user.isGM ? true : await WWDialog.confirm({
      window: {
        title: 'WW.Combat.StartTurn.Title',
        icon: 'fa-solid fa-bolt'
      },
      content: `
        <div>${i18n('WW.Combat.StartTurn.Msg')}</div>
        <div class="dialog-sure">${i18n('WW.Combat.StartTurn.Confirm')}</div>
      `
    });

    if (!confirm) return;

    // Prepare turn data
    const nextTurn = this.turns.findIndex((turn) => turn.id === combatant.id); // Custom next turn
    const advanceTime = this.getTimeDelta(this.round, this.turn, this.round, nextTurn);

    // Update the document, passing data through a hook first
    const updateData = {round: this.round, turn: nextTurn};
    const updateOptions = {direction: 1, worldTime: {delta: advanceTime}};
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    await this.update(updateData, updateOptions);

    return this;
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Display a dialog querying the GM whether they wish to end the combat encounter and empty the tracker
   * @returns {Promise<Combat>}
   */
  async endCombat() {
    await WWDialog.input({
      window: { icon: 'fa-solid fa-hourglass', title: 'WW.Combat.End.Title' },
      content: `<p>${i18n("WW.Combat.End.Msg")}</p><p>${i18n("WW.Combat.End.Msg2")}</p>`,
      ok: {
        action: 'skip',
        label: 'WW.Combat.End.Skip',
        icon: 'fa-solid fa-hourglass-end',
        callback: () => {
          this._expireLeftoverEffects(); // Expire leftover effects - no longer needed?
          game.time.advance(60); // Advance 1 minute to end 1 minute durations
          this.delete();
        }
      },
      buttons: [{
        action: 'endOnly',
        label: 'WW.Combat.End.Only',
        icon: 'fa-solid fa-pause',
        callback: () => this.delete()
      },
      {
        action: 'cancel',
        label: 'WW.Combat.End.Cancel',
        icon: 'fa-solid fa-times',
        callback: () => { }
      }]
    });

    return this;
  }

  /* -------------------------------------------- */

  /**
   * Assign initiative for all combatants which have not already been assigned.
   * This method is meant to be called every time a Combatant is taking regular turns or the initiative.
   */
  async setAll() {
    let initiative = 1001, enemies = 2001, allies = 3001;

    const updates = this.combatants.reduce((updates, combatant) => {
      if (!combatant.isOwner) return updates;
      let newInit = null;
      switch (combatant.initiativeBracket) {
        case 1000: {
          newInit = initiative++;
          break;
        }
        case 3000: {
          newInit = allies++;
          break;
        }
        case 2000: {
          newInit = enemies++;
          break;
        }
      }
      updates.push({ _id: combatant.id, initiative: newInit });

      return updates;
    }, []);

    return this.updateEmbeddedDocuments("Combatant", updates);
  }

  /* -------------------------------------------- */

  /**
   * @override
   * Return the Array of combatants and groups sorted into initiative order, breaking ties alphabetically by name.
   * @returns {Combatant[] && CombatantGroup[]}
   */
  setupTurns() {
    this.turns ||= [];
    const entries = this.combatants.contents.concat(this.groups.contents);

    // Determine the turn order and the current turn
    const turns = entries.sort(this._sortCombatants);
    if ( this.turn !== null ) {
      if ( this.turn < 0 ) this.turn = 0;
      else if ( this.turn >= turns.length ) {
        this.turn = 0;
        this.round++;
      }
    }
    
    // Update state tracking
    const c = turns[this.turn];
    this.current = this._getCurrentState(c);

    // One-time initialization of the previous state
    if ( !this.previous ) this.previous = this.current;

    // Return the array of prepared turns
    return this.turns = turns;
  }

  /* -------------------------------------------- */

  /**
   * @inheritdoc
   * Define how the array of Combatants is sorted in the displayed list of the tracker.
   * This method can be overridden by a system or module which needs to display combatants in an alternative order.
   * The default sorting rules sort in descending order of initiative using combatant IDs for tiebreakers.
   * @param {Combatant} a     Some combatant
   * @param {Combatant} b     Some other combatant
   */
  _sortCombatants(a, b) {
    return -super._sortCombatants(a, b);
  }

  /* -------------------------------------------- */
  /*  Turn Events                                 */
  /* -------------------------------------------- */
  
  /**
   * @override
   * Manage the execution of Combat lifecycle events.
   * This method orchestrates the execution of four events in the following order, as applicable:
   * 1. End Turn
   * 2. End Round
   * 3. Begin Round
   * 4. Begin Turn
   * Each lifecycle event is an async method, and each is awaited before proceeding.
   * @returns {Promise<void>}
   * @protected
   */
  async _manageTurnEvents() {
    if (!this.started) return;

    // Capture current and previous states
    const { current, previous } = this;

    // Sage handling only. Use custom #triggerWWTurnEvents
    if (game.user.isActiveGM) await this.#triggerWWTurnEvents();

    // Hooks handled by all clients
    Hooks.callAll("combatTurnChange", this, previous, current);
  }

  /* -------------------------------------------- */

  /**
   * A custom logic to trigger Weird Wizard round/turn events.
   * Based on Combat.#triggerTurnEvents.
   * @returns {Promise<void>}
   */

  async #triggerWWTurnEvents() {
    // Prepare Prior and Next datasets
    const { current, previous } = this;

    const prior = {
      combatant: this.combatants.get(previous.combatantId) ?? null,
      round: previous.round,
      turn: previous.turn,
      skipped: false
    };
    
    const next = {
      combatant: this.combatants.get(current.combatantId) ?? null,
      round: current.round,
      turn: current.turn,
      skipped: (previous.round !== current.round) || (previous.turn !== current.turn)
    };

    // A prior Combatant exists: End Turn
    if (prior.combatant) {
      const combatant = prior.combatant;
      const context = { round: prior.round, turn: prior.turn, skipped: prior.skipped };

      if (CONFIG.debug.combat) console.debug(` | Combat End Turn: ${combatant.name}`);
      await this._onEndTurn(combatant, context);
      await foundry.documents.ActiveEffect.registry.refresh("turnEnd", { ...context, combat: this });
      this.#triggerWWRegionEvents(CONST.REGION_EVENTS.TOKEN_TURN_END, context, [combatant]);
    }

    // Prior and next Rounds are different: End round and start a new one
    if (prior.round !== next.round) {
      // End Round
      // await this.#onEndRound({round: prior.round, skipped: prior.round !== previous.round});

      // Start Round
      // await this.#onStartRound({round: next.round, skipped: next.round !== current.round});
    }

    // A next Combatant exists: Start Turn
    if (next.combatant) {
      const combatant = next.combatant;
      const context = { round: next.round, turn: next.turn, skipped: next.skipped }; // Current combatant might need a change

      if (CONFIG.debug.combat) console.debug(` | Combat Start Turn: ${combatant.name}`);
      await this._onStartTurn(combatant, context);
      await this._clearMovementHistoryOnStartTurn(combatant, context);
      await foundry.documents.ActiveEffect.registry.refresh("turnStart", { ...context, combat: this });
      this.#triggerWWRegionEvents(CONST.REGION_EVENTS.TOKEN_TURN_START, context, [combatant]); // Trigger WW version
    } else {
      if (CONFIG.debug.combat) console.debug(` | Combat is on Standby`);
    }
    
  }

  /* -------------------------------------------- */

  /**
   * Trigger Weird Wizard Region events for Combat events.
   * Needed by WWCombat#triggerWWTurnEvents.
   * Unchanged from Combat.#triggerWWRegionEvents.
   * @param {string} eventName                  The event name
   * @param {object & {token: never, combatant: never, combat: never}} eventData
   *                                            The event data (without `token`, `combatant`, and `combat`)
   * @param {Iterable<Combatant>} combatants    The combatants to trigger the event for
   * @returns {Promise<void>}
   */
  async #triggerWWRegionEvents(eventName, eventData, combatants) {
    const promises = [];
    for ( const combatant of combatants ) {
      const token = combatant.token;
      if ( !token ) continue;
      for ( const region of token.regions ) {
        promises.push(region._triggerEvent(eventName, {token, combatant, combat: this, ...eventData}));
      }
    }
    await Promise.allSettled(promises);
  }

  /* -------------------------------------------- */
  
  /**
   * A workflow that occurs at the end of each Combat Turn.
   * This workflow occurs after the Combat document update, prior round information exists in this.previous.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @inheritdoc
   * @param {Combatant} combatant     The Combatant whose turn just ended
   * @returns {Promise<void>}
   * @protected
   */
  /*async _onEndTurn(combatant) {
    super._onEndTurn(combatant);
    //this._expireEffectsOnTurn(combatant, 'end');
  }*/

  /* -------------------------------------------- */

  /**
   * @override
   * A workflow that occurs at the end of each Combat Round.
   * This workflow occurs after the Combat document update.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * The default implementation of this function does nothing.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @param {CombatRoundEventContext} context    The context of the round that just ended
   * @returns {Promise<void>}
   * @protected
   */
  /*async _onEndRound(context) {
    super._onEndRound();

    this._expireEffectsOnEndOfRound();
  }*/

  /* -------------------------------------------- */

  /**
   * A workflow that occurs at the start of each Combat Round.
   * This workflow occurs after the Combat document update, new round information exists in this.current.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @returns {Promise<void>}
   * @protected
   */
  /*async _onStartRound(context) {

  }*/

  /* -------------------------------------------- */

  /**
   * A workflow that occurs at the start of each Combat Turn.
   * This workflow occurs after the Combat document update.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * The default implementation of this function does nothing.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @param {Combatant} combatant               The Combatant whose turn just started
   * @param {CombatTurnEventContext} context    The context of the turn that just started
   * @returns {Promise<void>}
   * @protected
   */
  /*async _onStartTurn(combatant, context) {
    super._onStartTurn(combatant);

    //this._expireEffectsOnTurn(combatant, 'start');
  }*/

  /* -------------------------------------------- */
  /*  Expire Effect Methods                       */
  /* -------------------------------------------- */

  /**
   * Expire active effects with round durations that carried over from other combats.
   */
  async _expireLeftoverEffects() {

    // Loop for each combatant
    for (const c of this.combatants) {

      // Filter effects
      const temporaryEffects = c.actor?.temporaryEffects.filter((ae) => {
        const { seconds, rounds, startTime, startRound } = ae.duration;
      
        return rounds > 0;
      })

      if (!temporaryEffects) return; // Stop if no effects were found

      const disableActiveEffects = [],
      deleteActiveEffects = [],
      disableBuffs = [],
      actorUpdate = {};

      for (const ae of temporaryEffects) {
        const duration = ae.duration.rounds + ' ' + (ae.duration.rounds > 1 ? i18n('WW.Effect.Duration.Rounds') : i18n('WW.Effect.Duration.Round'));
      
        await ChatMessage.create({
          type: 'status',
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
          flavor: this.label,
          content: `<p>@UUID[${c.actor.uuid}]: @UUID[${ae.uuid}] ${i18n("WW.Effect.Duration.ExpiredMsg")} ${duration}.</div>`,
          sound: CONFIG.sounds.notification
        });

        if (ae.system.duration.autoExpire) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }

      const hasActorUpdates = !foundry.utils.isEmpty(actorUpdate);

      const deleteAEContext = foundry.utils.mergeObject(
        { render: !disableBuffs.length && !disableActiveEffects.length && !hasActorUpdates },
        context
      );
      
      if (deleteActiveEffects.length) await c.actor.deleteEmbeddedDocuments("ActiveEffect", deleteActiveEffects, deleteAEContext);

      const disableAEContext = foundry.utils.mergeObject({ render: !disableBuffs.length && !hasActorUpdates }, context);

      if (disableActiveEffects.length) await c.actor.updateEmbeddedDocuments("ActiveEffect", disableActiveEffects, disableAEContext);

      const disableBuffContext = foundry.utils.mergeObject({ render: !hasActorUpdates }, context);

      if (disableBuffs.length) await c.actor.updateEmbeddedDocuments("Item", disableBuffs, disableBuffContext);

      if (hasActorUpdates) await c.actor.update(actorUpdate, context);

    }
  }

  /**
   * Expire active effects that lasts until an end of round.
   */
  /*async _expireEffectsOnEndOfRound() {

    // Loop for each combatant
    for (const c of this.combatants) {
      
      // Filter effects
      const temporaryEffects = c.actor?.temporaryEffects.filter((ae) => {
        const { seconds, rounds, startTime, startRound } = ae.duration;
        
        // If selectedDuration does not includes 'round', return false
        if (!ae.system.duration.selected?.includes('round')) return false;
        
        const elapsed = this.round - (startRound ?? 0),
          remaining = rounds - elapsed;
        return remaining <= 0;
      })

      if (!temporaryEffects) return; // Stop if no effects were found

      const disableActiveEffects = [],
      deleteActiveEffects = [],
      disableBuffs = [],
      actorUpdate = {};
      
      for (const ae of temporaryEffects) {

        const duration = ae.duration.rounds + ' ' + (ae.duration.rounds > 1 ? i18n('WW.Effect.Duration.Rounds') : i18n('WW.Effect.Duration.Round'));
        
        await ChatMessage.create({
          type: 'status',
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
          flavor: this.label,
          content: `<p>@UUID[${c.actor.uuid}]: @UUID[${ae.uuid}] ${i18n("WW.Effect.Duration.ExpiredMsg")} ${duration}.</div>`,
          sound: CONFIG.sounds.notification
        });
        
        if (ae.system.duration.autoExpire) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }

      const hasActorUpdates = !foundry.utils.isEmpty(actorUpdate);

      const deleteAEContext = foundry.utils.mergeObject(
        { render: !disableBuffs.length && !disableActiveEffects.length && !hasActorUpdates },
        context
      );
      
      if (deleteActiveEffects.length) await c.actor.deleteEmbeddedDocuments("ActiveEffect", deleteActiveEffects, deleteAEContext);

      const disableAEContext = foundry.utils.mergeObject({ render: !disableBuffs.length && !hasActorUpdates }, context);
      if (disableActiveEffects.length) await c.actor.updateEmbeddedDocuments("ActiveEffect", disableActiveEffects, disableAEContext);

      const disableBuffContext = foundry.utils.mergeObject({ render: !hasActorUpdates }, context);
      if (disableBuffs.length) await c.actor.updateEmbeddedDocuments("Item", disableBuffs, disableBuffContext);

      if (hasActorUpdates) await c.actor.update(actorUpdate, context);

    }
  }*/

  /**
   * Expire active effects that lasts until an end of a turn.
   */
  /*async _expireEffectsOnTurn(current, phase) {
    // Loop for each combatant
    for (const c of this.combatants) {

      // Filter effects
      const temporaryEffects = c.actor?.temporaryEffects.filter((ae) => {
        const { seconds, rounds, startTime, startRound } = ae.duration;
        
        const lcSelected = ae.system.duration.selected?.toLowerCase();
        
        // If selectedDuration does not includes 'turn' or the provided phase, return false
        if (!lcSelected) return false; // Return false if lcSelected does not exist
        if (!lcSelected.includes('turn')) return false;
        if (!lcSelected.includes(phase)) return false;
        
        if (lcSelected === 'turnend') return true; // return true if turn end
        else if (lcSelected.includes('target')) { // If target is taken into account: nexttargetturnend, nexttargetturnstart
          if (current != c) return false; // If current combatant is affected by the effect
          
          const elapsed = this.round - (startRound ?? 0),
            remaining = rounds - elapsed,
            offset = this.round == startRound ? 0 : 1;
          return remaining <= offset;

        } else { // If trigger is taken into account: turnEnd, nextTriggerTurnEnd, nextTriggerTurnStart
          if (current != ae.originCombatant) return false; // If current combatant is the origin of the effect

          const elapsed = this.round - (startRound ?? 0),
            remaining = rounds - elapsed,
            offset = this.round == startRound ? 0 : 1;
          return remaining <= offset;
        }

      })

      if (!temporaryEffects) return; // Stop if no effects were found

      const disableActiveEffects = [],
        deleteActiveEffects = [],
        disableBuffs = [],
        actorUpdate = {};

      for (const ae of temporaryEffects) {

        const duration = ae.duration.rounds + ' ' + (ae.duration.rounds > 1 ? i18n('WW.Effect.Duration.Rounds') : i18n('WW.Effect.Duration.Round'));
        
        await ChatMessage.create({
          type: 'status',
          speaker: game.weirdwizard.utils.getSpeaker({ actor: c.actor }),
          flavor: this.label,
          content: `<p>@UUID[${c.actor.uuid}]: @UUID[${ae.uuid}] ${i18n("WW.Effect.Duration.ExpiredMsg")} ${duration}.</div>`,
          sound: CONFIG.sounds.notification
        });

        if (ae.system.duration.autoExpire) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }

      const hasActorUpdates = !foundry.utils.isEmpty(actorUpdate);

      const deleteAEContext = foundry.utils.mergeObject(
        { render: !disableBuffs.length && !disableActiveEffects.length && !hasActorUpdates },
        context
      );

      if (deleteActiveEffects.length)
        await c.actor.deleteEmbeddedDocuments("ActiveEffect", deleteActiveEffects, deleteAEContext);

      const disableAEContext = foundry.utils.mergeObject({ render: !disableBuffs.length && !hasActorUpdates }, context);
      if (disableActiveEffects.length)
        await c.actor.updateEmbeddedDocuments("ActiveEffect", disableActiveEffects, disableAEContext);

      const disableBuffContext = foundry.utils.mergeObject({ render: !hasActorUpdates }, context);
      if (disableBuffs.length) await c.actor.updateEmbeddedDocuments("Item", disableBuffs, disableBuffContext);

      if (hasActorUpdates) await c.actor.update(actorUpdate, context);

    }

  }*/

  /**
   * Expire active effects on update.
   *
   * @param {object} data Update data
   * @param {options} options Context options
   * @param {string} userId Triggering user ID
   */
  /*async _expireEffectsOnUpdate(data, options, userId) {
    
    if (data.turn === undefined && data.round === undefined) return;

    const actor = this.combatant?.actor;
    
    if (!actor) return;

    const timeOffset = options.advanceTime ?? 0;
    
    // Attempt to perform expiration on owning active user
    const firstOwner = Object.entries(actor.ownership)
      .filter(([_, level]) => level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
      .map(([userId, _]) => game.users.get(userId))
      .filter((u) => u?.active)
      .sort((a, b) => a.id.localeCompare(b.id))[0];
    if (firstOwner) {
      if (firstOwner.id !== game.user.id) return;
    } else if (!game.user.isGM) return;
    
    actor.expireActiveEffects({ timeOffset, combat: this });
  }*/

}