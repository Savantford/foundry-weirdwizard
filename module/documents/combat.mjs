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
  /*  Methods                                     */
  /* -------------------------------------------- */

  /**
   * @override
   * Begin the combat encounter, advancing to round 1 and turn 1
   * @returns {Promise<this>}
   */
  /*async startCombat() { 
    this._playCombatSound("startEncounter");
    this._expireLeftoverEffects(), // Probably not needed; Expiration handled by core
    const updateData = {round: 1, turn: 0};
    Hooks.callAll("combatStart", this, updateData);
    await this.update(updateData);
    await ActiveEffect.registry.refresh("combatStart", {combat: this});
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
   * Ends the current turn without starting a new one
   * @returns {Promise<Combat>}
   */
  async nextTurn() {
    // Mark current combatant, if any, as acted
    if (this.combatant) await this.combatant.setFlag('weirdwizard', 'acted', true);

    // Update Data and Options
    const updateData = { turn: null }, updateOptions = { direction: 0, worldTime: {delta: 0} };
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    await this.update(updateData, updateOptions);
    return this;
  }

  /* -------------------------------------------- */

  /**
   * A custom method based on nextTurn() to attempt to take the next turn as the combatant.
   * @param {WWCombatant} combatant
   * @private
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
   * Display a dialog querying the GM whether they wish to end the combat encounter and empty the tracker
   * @returns {Promise<this>}
   */
  async endCombat() {
    await foundry.applications.api.DialogV2.confirm({
      window: {icon: "fa-solid fa-xmark", title: "COMBAT.EndTitle"},
      content: `<p>${_loc("COMBAT.EndConfirmation")}</p>`,
      yes: {callback: () => this.delete()},
      modal: true
    });
    return this;
  }

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
        callback: () => {
          this.delete();
        }
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
   * @param {object} [options={}]   Additional options forwarded to the Combat.rollInitiative method
   */
  async setAll() {
    const ids = this.combatants.reduce((ids, c) => {
      if ( c.isOwner ) ids.push(c.id);
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
  /*  Round Events                                */
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
  async _manageTurnEvents() { // Maybe do something about this

    // Capture current and previous states
    const {current, previous} = this;
    console.log(current)
    console.log(previous)
    
    await super._manageTurnEvents();
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
  async _expireEffectsOnEndOfRound() {

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

    try {
      this._expireEffectsOnUpdate(data, options, userId);
    } catch (error) {
      console.error(error);
    }

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

}