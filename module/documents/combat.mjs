import { i18n } from '../helpers/utils.mjs';

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

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);
    
    // Update Status Icons
    this.combatants.forEach(c => c.token.object.updateStatusIcons());
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /** @override */
  prepareDerivedData() {
    if ( this.combatants.size && !this.turns?.length ) {
      this.setupTurns();
    }
  }

  /* -------------------------------------------- */
  /* -------------------------------------------- */

  /**
   * Begin the combat encounter, advancing to round 1 and turn 1
   * @override
   * @returns {Promise<Combat>}
   */
  async startCombat() {
    await this.setAll();
    this._playCombatSound("startEncounter");
    const updateData = {round: 1, turn: 0};
    this._expireLeftoverEffects();
    Hooks.callAll("combatStart", this, updateData);
    
    return this.update(updateData);
  }

  /* -------------------------------------------- */

  /**
   * Advance the combat to the next round
   * @override
   * @returns {Promise<Combat>}
   */
  async nextRound() {
    let turn = this.turn === null ? null : 0; // Preserve the fact that it's no-one's turn currently.
    if ( this.settings.skipDefeated && (turn !== null) ) {
      turn = this.turns.findIndex(t => !t.isDefeated);
      if (turn === -1) {
        ui.notifications.warn("COMBAT.NoneRemaining", {localize: true});
        turn = 0;
      }
    }
    let advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
    advanceTime += CONFIG.time.roundTime;
    let nextRound = this.round + 1;
    
    // Update the document, passing data through a hook first
    const updateData = {round: nextRound, turn};
    const updateOptions = {advanceTime, direction: 1};
    
    // Reset acted flags
    this.turns.forEach((e) => {
      e.setFlag('weirdwizard', 'acted', false);
    });

    Hooks.callAll("combatRound", this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }

  /* -------------------------------------------- */

  /**
   * Advance the combat to the next turn
   * @override
   * @returns {Promise<Combat>}
   */
  async nextTurn() {
    // Set current combatant to acted
    await this.combatant.setFlag('weirdwizard', 'acted', true);

    // Get variables
    let turn = this.turn ?? -1;
    let next = null;

    // Determine the next turn number
    if (this.settings.skipDefeated) {
      for ( let [i, t] of this.turns.entries() ) {
        if ( i <= turn ) continue;
        if ( t.isDefeated ) continue; // Skip defeated
        
        if (this.skipActed) {
          if (t.flags.weirdwizard?.acted) continue; // Skip acted
          next = i;
        } else {
          next = i;
        }
        
        break;
      }
    } else if (this.skipActed) {
      for ( let [i, t] of this.turns.entries() ) {
        if ( i <= turn ) continue;
        if ( t.flags.weirdwizard?.acted ) continue; // Skip acted
        next = i;
        break;
      }
    } else {
      next = turn + 1;
    }

    // Maybe advance to the next round
    let round = this.round;
    if ( (this.round === 0) || (next === null) || (next >= this.turns.length) ) {
      return this.nextRound();
    }

    // Update the document, passing data through a hook first
    const updateData = {round, turn: next};
    const updateOptions = {advanceTime: CONFIG.time.turnTime, direction: 1};
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }


  /* -------------------------------------------- */

  /**
   * Display a dialog querying the GM whether they wish to end the combat encounter and empty the tracker
   * @returns {Promise<Combat>}
   * @override
   */
  async endCombat() {
    let d = new Dialog({
      title: i18n("WW.Combat.End.Title"),
      content: `<p>${i18n("WW.Combat.End.Msg")}</p><p>${i18n("WW.Combat.End.Msg2")}</p>`,
      buttons: {
        skip: {
          icon: '<i class="fas fa-hourglass-end"></i>',
          label: i18n("WW.Combat.End.Skip"),
          callback: () => {
            this._expireLeftoverEffects(); // Expire leftover effects
            game.time.advance(60); // Advance 1 minute to end 1 minute durations
            this.delete();
            
          }
        },
        endOnly: {
          icon: '<i class="fas fa-pause"></i>',
          label: i18n("WW.Combat.End.Only"),
          callback: () => {
            this.delete();
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: i18n("WW.Combat.End.Cancel"),
          callback: () => {}
        }
      }
    });

    return d.render(true);

  }

  /* -------------------------------------------- */

  /**
   * Assign initiative for a single Combatant within the Combat encounter.
   * Update the Combat turn order to maintain the same combatant as the current turn.
   * @param {string} id         The combatant ID for which to set initiative
   * @param {number} value      A specific initiative value to set
   */
  async setInitiative(id, value) {
    const combatant = this.combatants.get(id, {strict: true});
    await combatant.update({initiative: value});
  }

  /**
   * Assign initiative for all combatants which have not already been assigned.
   * @param {object} [options={}]   Additional options forwarded to the Combat.rollInitiative method
   */
  async setAll() {
    const ids = this.combatants.reduce((ids, c) => {
      if ( c.isOwner /*&& (c.initiative === null)*/ ) ids.push(c.id);
      return ids;
    }, []);

    let initiative = 1001;
    let enemies = 2001;
    let allies = 3001;

    ids.forEach(c => {
      const cdata = this.combatants.get(c);
      let v = null;

      switch (cdata.initiativeBracket) {
        case 1000: {
          v = initiative;
          initiative += 1;
          break;
        }
        case 3000: {
          v = allies;
          allies += 1;
          break;
        }
        case 2000: {
          v = enemies;
          enemies += 1;
          break;
        }
      }
      
      return this.setInitiative(c, v);
    })
    
  }

  /* -------------------------------------------- */

  /**
   * Define how the array of Combatants is sorted in the displayed list of the tracker.
   * The default sorting rules sort in ascending order of initiative using combatant IDs for tiebreakers.
   * @param {Combatant} a     Some combatant
   * @param {Combatant} b     Some other combatant
   * @inheritdoc
   */
  _sortCombatants(a, b) {
    /*const ia = Number.isNumeric(a.initiative) ? a.initiative : -Infinity;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -Infinity;
    console.log('ia = ' + ia)
    console.log('ib = ' + ib)
    return (ib - ia) || (a.id > b.id ? 1 : -1);*/
    return -super._sortCombatants(a, b);
  }

  /* -------------------------------------------- */
  /*  Turn Events                                 */
  /* -------------------------------------------- */

  /**
   * Manage the execution of Combat lifecycle events.
   * This method orchestrates the execution of four events in the following order, as applicable:
   * 1. End Turn
   * 2. End Round
   * 3. Begin Round
   * 4. Begin Turn
   * Each lifecycle event is an async method, and each is awaited before proceeding.
   * @param {number} [adjustedTurn]   Optionally, an adjusted turn to commit to the Combat.
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _manageTurnEvents(adjustedTurn) {
    if ( !game.users.activeGM?.isSelf ) return;
    const prior = this.combatants.get(this.previous?.combatantId);

    // Adjust the turn order before proceeding. Used for embedded document workflows
    if ( Number.isNumeric(adjustedTurn) ) await this.update({turn: adjustedTurn}, {turnEvents: false});
    if ( !this.started ) return;

    // Identify what progressed
    const advanceRound = this.current.round > (this.previous.round ?? -1);
    const advanceTurn = this.current.turn > (this.previous.turn ?? -1);
    if ( !(advanceTurn || advanceRound) ) return;

    // Conclude prior turn
    if ( prior ) await this._onEndTurn(prior);

    // Conclude prior round
    if ( advanceRound && (this.previous.round !== null) ) await this._onEndRound();

    // Begin new round
    if ( advanceRound ) await this._onStartRound();

    // Begin a new turn
    await this._onStartTurn(this.combatant);
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
  async _onEndTurn(combatant) {
    super._onEndTurn(combatant);
    
    this._expireEffectsOnTurn(combatant, 'end');
  }

  /* -------------------------------------------- */

  /**
   * A workflow that occurs at the end of each Combat Round.
   * This workflow occurs after the Combat document update, prior round information exists in this.previous.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @override
   * @returns {Promise<void>}
   * @protected
   */
  async _onEndRound() {
    super._onEndRound();

    this._expireEffectsOnEndOfRound();
     
  }

  /* -------------------------------------------- */

  /**
   * A workflow that occurs at the start of each Combat Round.
   * This workflow occurs after the Combat document update, new round information exists in this.current.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @returns {Promise<void>}
   * @protected
   */
  async _onStartRound() {
    if ( CONFIG.debug.combat ) console.debug(`${vtt} | Combat Start Round: ${this.round}`);
  }

  /* -------------------------------------------- */

  /**
   * A workflow that occurs at the start of each Combat Turn.
   * This workflow occurs after the Combat document update, new turn information exists in this.current.
   * This can be overridden to implement system-specific combat tracking behaviors.
   * This method only executes for one designated GM user. If no GM users are present this method will not be called.
   * @inheritdoc
   * @param {Combatant} combatant     The Combatant whose turn just started
   * @returns {Promise<void>}
   * @protected
   */
  async _onStartTurn(combatant) {
    super._onStartTurn(combatant);

    this._expireEffectsOnTurn(combatant, 'start');
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

    try {
      this._expireEffectsOnUpdate(data, options, userId);
    } catch (error) {
      console.error(error);
    }

    // Update Status Icons
    this.combatants.forEach(c => c.token?.object?.updateStatusIcons());
    
    // Show Take The Initiative dialog at the beginning of a new round
    if (options.direction !== -1 && data.round) {
      if (!game.user.character) {
        if (!game.user.isGM) {
          ui.notifications.warn(i18n('WW.Combat.Initiative.NoCharacter'));
        }
      } else {
        const confirm = await Dialog.confirm({
          title: i18n('WW.Combat.Initiative.Title'),
          content: i18n('WW.Combat.Initiative.Msg')
        })
  
        // Check if the users's character is present as a combatant in the current combat
        game.combat.combatants.forEach(c => {
          if (c.actorId == game.user.character.id) c.takingInit(confirm);
        })
  
      }
    }
    
  }

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
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
          flavor: this.label,
          content: '<div><b>' + ae.name + '</b> ' + i18n("WW.Effect.Duration.ExpiredMsg") + ' ' + duration + '.</div>',
          sound: CONFIG.sounds.notification
        });

        if (ae.autoDelete) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }

      const hasActorUpdates = !foundry.utils.isEmpty(actorUpdate);

      const deleteAEContext = mergeObject(
        { render: !disableBuffs.length && !disableActiveEffects.length && !hasActorUpdates },
        context
      );
      
      if (deleteActiveEffects.length)
        await c.actor.deleteEmbeddedDocuments("ActiveEffect", deleteActiveEffects, deleteAEContext);

      const disableAEContext = mergeObject({ render: !disableBuffs.length && !hasActorUpdates }, context);
      if (disableActiveEffects.length)
        await c.actor.updateEmbeddedDocuments("ActiveEffect", disableActiveEffects, disableAEContext);

      const disableBuffContext = mergeObject({ render: !hasActorUpdates }, context);
      if (disableBuffs.length) await c.actor.updateEmbeddedDocuments("Item", disableBuffs, disableBuffContext);

      if (hasActorUpdates) await c.actor.update(actorUpdate, context);

    }
  }

  /**
   * Expire active effects that lasts until an end of round.
   */
  async _expireEffectsOnEndOfRound() {

    // Loop for each combatant
    for (const c of this.combatants) {

      // Filter effects
      const temporaryEffects = c.actor?.temporaryEffects.filter((ae) => {
        const { seconds, rounds, startTime, startRound } = ae.duration;
        
        // If selectedDuration does not includes 'round', return false
        if (!ae.flags.weirdwizard?.selectedDuration?.includes('round')) return false;

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
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
          flavor: this.label,
          content: '<div><b>' + ae.name + '</b> ' + i18n("WW.Effect.Duration.ExpiredMsg") + ' ' + duration + '.</div>',
          sound: CONFIG.sounds.notification
        });

        if (ae.autoDelete) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }

      const hasActorUpdates = !foundry.utils.isEmpty(actorUpdate);

      const deleteAEContext = mergeObject(
        { render: !disableBuffs.length && !disableActiveEffects.length && !hasActorUpdates },
        context
      );
      
      if (deleteActiveEffects.length)
        await c.actor.deleteEmbeddedDocuments("ActiveEffect", deleteActiveEffects, deleteAEContext);

      const disableAEContext = mergeObject({ render: !disableBuffs.length && !hasActorUpdates }, context);
      if (disableActiveEffects.length)
        await c.actor.updateEmbeddedDocuments("ActiveEffect", disableActiveEffects, disableAEContext);

      const disableBuffContext = mergeObject({ render: !hasActorUpdates }, context);
      if (disableBuffs.length) await c.actor.updateEmbeddedDocuments("Item", disableBuffs, disableBuffContext);

      if (hasActorUpdates) await c.actor.update(actorUpdate, context);

    }
  }

  /**
   * Expire active effects that lasts until an end of a turn.
   */
  async _expireEffectsOnTurn(current, phase) {
    // Loop for each combatant
    for (const c of this.combatants) {

      // Filter effects
      const temporaryEffects = c.actor?.temporaryEffects.filter((ae) => {
        const { seconds, rounds, startTime, startRound } = ae.duration;
        
        const lcSelected = ae.flags.weirdwizard?.selectedDuration?.toLowerCase();

        // If selectedDuration does not includes 'turn' or the provided phase, return false
        if (!lcSelected) return true; // Return true if lcSelected does not exist (old effects)
        if (!lcSelected.includes('turn')) return false;
        if (!lcSelected.includes(phase)) return false;
        
        if (lcSelected === 'turnend') return true; // return true if turn end
        else if (lcSelected.includes('target')) { // If target is taken into account: nexttargetturnend, nexttargetturnstart
          if (current != c) return false; // If current combatant is affected by the effect
          
          const elapsed = this.round - (startRound ?? 0),
            remaining = rounds - elapsed,
            offset = this.round == startRound ? 0 : 1;
          return remaining <= offset;

        } else { // If trigger is taken into account: turnend, nexttriggerturnend, nexttriggerturnstart
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
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
          flavor: this.label,
          content: '<div><b>' + ae.name + '</b> ' + i18n("WW.Effect.Duration.ExpiredMsg") + ' ' + duration + '.</div>',
          sound: CONFIG.sounds.notification
        });

        if (ae.autoDelete) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }

      const hasActorUpdates = !foundry.utils.isEmpty(actorUpdate);

      const deleteAEContext = mergeObject(
        { render: !disableBuffs.length && !disableActiveEffects.length && !hasActorUpdates },
        context
      );

      if (deleteActiveEffects.length)
        await c.actor.deleteEmbeddedDocuments("ActiveEffect", deleteActiveEffects, deleteAEContext);

      const disableAEContext = mergeObject({ render: !disableBuffs.length && !hasActorUpdates }, context);
      if (disableActiveEffects.length)
        await c.actor.updateEmbeddedDocuments("ActiveEffect", disableActiveEffects, disableAEContext);

      const disableBuffContext = mergeObject({ render: !hasActorUpdates }, context);
      if (disableBuffs.length) await c.actor.updateEmbeddedDocuments("Item", disableBuffs, disableBuffContext);

      if (hasActorUpdates) await c.actor.update(actorUpdate, context);

    }

  }

  /**
   * Expire active effects on update.
   *
   * @param {object} data Update data
   * @param {options} options Context options
   * @param {string} userId Triggering user ID
   */
  async _expireEffectsOnUpdate(data, options, userId) {
    
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
  }

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
          speaker: game.weirdwizard.utils.getSpeaker({ actor: this }),
          flavor: this.label,
          content: '<div><b>' + ae.name + '</b> ' + i18n("WW.Effect.Duration.ExpiredMsg") + ' ' + duration + '.</div>',
          sound: CONFIG.sounds.notification
        });

        if (ae.autoDelete) {
          deleteActiveEffects.push(ae.id);
        } else {
          disableActiveEffects.push({ _id: ae.id, disabled: true });
        }
      }

      const hasActorUpdates = !foundry.utils.isEmpty(actorUpdate);

      const deleteAEContext = mergeObject(
        { render: !disableBuffs.length && !disableActiveEffects.length && !hasActorUpdates },
        context
      );
      
      if (deleteActiveEffects.length)
        await c.actor.deleteEmbeddedDocuments("ActiveEffect", deleteActiveEffects, deleteAEContext);

      const disableAEContext = mergeObject({ render: !disableBuffs.length && !hasActorUpdates }, context);
      if (disableActiveEffects.length)
        await c.actor.updateEmbeddedDocuments("ActiveEffect", disableActiveEffects, disableAEContext);

      const disableBuffContext = mergeObject({ render: !hasActorUpdates }, context);
      if (disableBuffs.length) await c.actor.updateEmbeddedDocuments("Item", disableBuffs, disableBuffContext);

      if (hasActorUpdates) await c.actor.update(actorUpdate, context);

    }
  }

}