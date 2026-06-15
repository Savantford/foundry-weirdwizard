//import { formatTime } from '../helpers/utils.mjs';
import { escape } from '../helpers/utils.mjs';
import WWDocumentMixin from './ww-document.mjs';

export default class WWActiveEffect extends WWDocumentMixin(ActiveEffect) {

  /* -------------------------------------------- */
  /*  Document Lifecycle                          */
  /* -------------------------------------------- */

  /*async _preCreate(data, options, user) {
    this._validateDuration(data, '_preCreate');

    return await super._preCreate(data, options, user);
  }*/

  /* -------------------------------------------- */

  async _preUpdate(changes, options, user) {
    //this._validateDuration(changes, '_preUpdate');
    
    return await super._preUpdate(changes, options, user);
  }

  /* -------------------------------------------- */
  
  /** @inheritDoc */
  _onDelete(options, userId) {
    if (this.isTemporary && this.duration.remaining <= 0) ChatMessage.create({
      type: 'status',
      content: `<p>${this.actor.link}:
        <a class="content-link" data-tooltip="${escape(this.tooltip)}"><img src="${this.img}"> ${this.name}</a>
        ${_loc("WW.Effect.Duration.ExpiredMsg")} ${this.formattedDuration}.
      </p>`,
      sound: CONFIG.sounds.notification
    });

    super._onDelete(options, userId);
  }

  /* -------------------------------------------- */

  /*_validateDuration(data, stage) {
    console.log('validating duration')
    const selected = data.system?.duration?.selected ?? this.system.duration.selected;
    const rounds = data.duration?.rounds ?? this.duration.rounds;
    const minutes = data.system?.duration?.inMinutes ?? this.system.duration.inMinutes;
    const hours = data.system?.duration?.inHours ?? this.system.duration.inHours;
    const days = data.system?.duration?.inDays ?? this.system.duration.inDays;
    
    const updateData = function(rounds, seconds) {
      // Stage is probably not needed for this and thus was removed from the check. More testing needed!
      //if (stage === '_preCreate') this.updateSource({ 'duration.rounds': rounds, 'duration.seconds': seconds });
      /*else if (stage === '_preUpdate')*/ /*data = foundry.utils.mergeObject(data, { 'duration.rounds': rounds, 'duration.seconds': seconds });
    };
    
    // Check the selected value and set duration values
    switch (selected) {
      // No duration
      case 'none': updateData(null, null); break;

      // Rounds duration
      case 'luckEnds': updateData(777, null); break;

      case '1round': updateData(1, null); break;
      case '2rounds': updateData(2, null); break;
      case 'Xrounds': updateData(rounds, null); break;

      case 'turnEnd': updateData(1, null); break;
      case 'nextTriggerTurnStart': updateData(1, null); break;
      case 'nextTargetTurnStart': updateData(1, null); break;
      case 'nextTriggerTurnEnd': updateData(1, null); break;
      case 'nextTargetTurnEnd': updateData(1, null); break;

      // Real World duration
      case '1minute': updateData(null, 60); break;
      case 'minutes': if (minutes) updateData(null, minutes * 60); break;
      case 'hours': if (hours) updateData(null, hours * 60*60); break;
      case 'days': if (days) updateData(null, days * 60*60*24); break;
    }

    // Format duration
    if (rounds === 777) this.system.duration.formatted = 'Luck ends';
    else if (rounds) this.system.duration.formatted = `${rounds} ${(rounds > 1 ? _loc(rounds + 'Rounds') : _loc(rounds + 'Round'))}`;
    else this.system.duration.formatted = formatTime(this.duration.seconds);
  }*/

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * @override
   * Augment the basic active effect data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of actife effect config sheets (such as if an active effect
   * is queried and has a roll executed directly from it).
  */
  prepareDerivedData() {
    super.prepareDerivedData();

    const system = this.system;
    
    // The item which this effect originates from if it has been transferred from an item to an actor
    this.originalItem = (this.parent instanceof Item) ? this.parent : null;

    // Get derived duration variables
    /*const key = 'WW.Effect.Duration.';
    const rounds = this.duration.rounds;
    const selected = this.system.duration.selected;
    
    if (selected !== 'none' && rounds) { // (selected !== 'none') should not be needed post pathsOfJournaling migration
      // Prepare formatted selected label
      let str = '';
      if (selected) {
        str += _loc(CONFIG.WW.EFFECT_DURATION_PRESETS.combat.options[selected]);
        if (selected !== 'luckEnds') str += ` (${rounds} ${(rounds > 1 ? _loc(key + 'Rounds') : _loc(key + 'Round'))})`;
        if (selected === 'Xrounds') str = `${rounds} ${(rounds > 1 ? _loc(key + 'Rounds') : _loc(key + 'Round'))}`; // Override if X rounds
      }
      
      this.system.duration.formatted = str;

    } else this.system.duration.formatted = formatTime(this.duration.seconds);*/
    
  }

  /* -------------------------------------------- */

  /**
    * A method that can be overridden by subclasses to customize inline embedded HTML generation.
    * @param {HTMLElement|HTMLCollection} content  The embedded content.
    * @param {DocumentHTMLEmbedConfig} config      Configuration for embedding behavior.
    * @param {EnrichmentOptions} [options]         The original enrichment options for cases where the Document embed
    *                                              content also contains text that must be enriched.
    * @returns {Promise<HTMLElement|null>}
    * @protected
    * @override
  */
  async _createInlineEmbed(content, config, options) {
    const anchor = this.toAnchor();
    
    anchor.setAttribute("data-tooltip", content.outerHTML);

    return anchor;
  }

  /* -------------------------------------------- */
  /*  Properties/Getters                          */
  /* -------------------------------------------- */

  /**
   * The number of times this effect should be applied.
   * @type {number}
  */
  get factor() {
    return this.system.originalItem?.activeEffectFactor ?? 1;
  }

  /* -------------------------------------------- */

  get isBenefit() {
    return this.type === 'benefit';
  }

  /* -------------------------------------------- */

  get hasValidCharOption() {
    const actor = this.parent.documentName === 'Actor' ? this.parent : null;
    const cOptUuid = this.system.grantedBy;

    if (!actor || !cOptUuid) return false;

    const uuidFound = Object.values(actor.system.charOptions).includes(cOptUuid);
    
    return uuidFound;
  }

  /* -------------------------------------------- */

  get showRemoveButton() {
    if (this.parent.documentName === 'Item') return false;
    if (this.isBenefit && this.hasValidCharOption) return false;
    return true;
  }

  /* -------------------------------------------- */

  /**
   * The combatant from which the effect originated
  */
  get originalCombatant() {
    const document = fromUuidSync(this.origin);

    if (document?.documentName === 'Item') {
      return document.parent.token?.combatant ?? null;
    } else {
      return document.token?.combatant ?? null;
    }

  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  // Transfer to actor only if the item is passive
  determineTransfer() {
    if (this.system.trigger === 'passive') return true;
    else return false;
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /**
   * @override
   * Apply this ActiveEffect to a provided Actor.
   * @param {Actor|Item|TokenDocument} targetDoc The Document to which this effect should be applied
   * @param {ActiveEffectChangeData} change      The change data being applied
   * @param {object} [options]                   Options affecting the change application
   * @param {object} [options.replacementData]   Data used to resolve "@" expressions in a string value
   * @param {boolean} [options.modifyTarget]     Modify the target Document with the updated value.
   * @returns {Record<string, unknown>} An object of property keys and their updated values
   */

  static applyChange(targetDoc, change, {replacementData={}, modifyTarget=true}={}) {
    // Weird Wizard: Replace preset with real change key
    change.key = CONFIG.WW.EFFECT_CHANGE_PRESET_KEYS[change.key]; // Better solution pending

    let field;
    const changes = {};
    if ( (typeof change.key === "string") && change.key.startsWith("system.") ) {
      if ( targetDoc.system instanceof foundry.abstract.DataModel ) {
        field = targetDoc.system.getFieldForProperty(change.key.slice(7));
      }
    }
    else field = targetDoc.getFieldForProperty(String(change.key ?? ""));
    const configuredHandler = ActiveEffect.CHANGE_TYPES[change.type]?.handler;
    if ( typeof configuredHandler === "function" ) {
      configuredHandler(targetDoc, change, {field, replacementData, modifyTarget});
    }
    else if ( field ) {
      if ( foundry.utils.getDefiningClass(this, "applyField") !== ActiveEffect ) {
        foundry.utils.logCompatibilityWarning("The ActiveEffect implementation overrides applyField, which is"
          + " deprecated. Please override applyChangeField instead.", {since: 14, until: 16, once: true});
        changes[change.key] = this.applyField(targetDoc, change, field);
      }
      else changes[change.key] = this.applyChangeField(targetDoc, change, {field, replacementData, modifyTarget});
    }
    else {
      if ( change.effect && (foundry.utils.getDefiningClass(change.effect, "_applyLegacy") !== ActiveEffect) ) {
        foundry.utils.logCompatibilityWarning("The ActiveEffect implementation overrides _applyLegacy, which is"
          + " deprecated. Please override static _applyChangeUnguided instead.", {since: 14, until: 16, once: true});
        change.effect._applyLegacy(targetDoc, change, changes);
      }
      else this._applyChangeUnguided(targetDoc, change, changes, {replacementData, modifyTarget});
    }
    return changes;
  }

  /**
   * A determination of whether the ActiveEffect's expiry event was reached. This check is independent of whether the
   * duration was also reached.
   * @param {string} event     The event that triggered this check
   * @param {object} [context] Contextual information for use in the determination
   * @returns {boolean}
   */
  isExpiryEvent(event, context) {
    const CORE_EXPIRY_EVENTS = CONST.ACTIVE_EFFECT_EXPIRY_EVENTS
    const expiry = this.duration.expiry;
    if ( event === "updateWorldTime" ) {
      // Expiry is determined by duration alone
      if ( !expiry ) return true;
      // Outside of combat, treat any time advancement as satisfying in-combat expiry events
      return !this.actor?.inCombat && CORE_EXPIRY_EVENTS.includes(expiry) && expiry !== "combatStart";
    }
    if ( event !== expiry ) return false;
    
    if ( !CORE_EXPIRY_EVENTS.includes(expiry) ) return true;

    /** @type {Combat|null} */
    const combat = context.combat ?? game.combat;
    /** @type {Combatant|null|undefined} */
    const effectCombatant = combat?.started
      ? combat === this.start.combat && combat.combatants.get(this.start.combatant)
        ? combat.combatants.get(this.start.combatant)
        : combat.getCombatantsByActor(this.actor ?? "")[0]
      : null;
    
    switch ( event ) {
      case "combatStart":
      case "combatEnd":
      case "roundStart":
      case "roundEnd":
        return !!effectCombatant;
      case "turnStart":
        return !!combat?.started && (combat.combatant === effectCombatant);
      case "turnEnd": {
        if ( !combat?.started || !effectCombatant ) return false;
        const previousCombatantId = combat.previous.combatantId;
        const lcPreset = this.system.durationPreset.toLowerCase();
        console.log(lcPreset)
        console.log(this)
        console.log(context)
        
        // If no preset is selected or turnEnd is selected
        if (!lcPreset || lcPreset === 'turnend') return true;

        // If TARGET is taken into account (nextTargetTurnEnd, nextTargetTurnStart)
        else if (lcPreset.includes('target')) {
          console.log('target')
          if (combat.comnbatant !== effectCombatant) return false; // If current combatant is affected by the effect
          else {
            if ( previousCombatantId ) return effectCombatant.id === previousCombatantId; // Prefer matching on combatant
            else return effectCombatant.turnNumber === combat.previous.turn;              // Otherwise match turn number
          };
        
        // If TRIGGER is taken into account: nextTriggerTurnEnd, nextTriggerTurnStart
        } else {
          console.log('trigger')
          if (combat.combatant !== this.originalCombatant) return false; // If current combatant is the origin of the effect
          else {
            if ( previousCombatantId ) return effectCombatant.id === previousCombatantId; // Prefer matching on combatant
            else return effectCombatant.turnNumber === combat.previous.turn;              // Otherwise match turn number
          };
        }
      }
      default:
        return false;
    }
  }

  get formattedDuration() {
    const { value, units, expiry, ... duration } = this.duration;
    
    const path = "WW.Effect.Duration.";

    // Permanent
    if (value === Infinity) return _loc(path + 'Permanent');

    // World time duration (Out of combat)
    else if (CONST.ACTIVE_EFFECT_TIME_DURATION_UNITS.includes(units)) {
      // Convert time to seconds - Adapted from _prepareTimeBasedDuration
      const calendar = game.time.calendar;
      const durationInMonths = units === "months";
      const unitsSingular = durationInMonths ? "day": units.slice(0, -1);
      const avgDaysPerMonth = durationInMonths && calendar.months.values.length
        ? calendar.days.daysPerYear / calendar.months.values.length
        : 0;
      const durationValue = durationInMonths ? Math.ceil(value * avgDaysPerMonth) : value;
      const seconds = calendar.componentsToTime({[unitsSingular]: durationValue});
      
      return game.time.calendar.format(seconds, 'formatDuration');
    }

    // Combat duration (Turns and rounds)
    else {
      const adjusted = value + 1;
      const unitLabel = adjusted > 1
        ? (units === 'turns' ? _loc(path + 'Turns') : _loc(path + 'Rounds'))
        : (units === 'turns' ? _loc(path + 'Turn') : _loc(path + 'Round'));
      return `${adjusted} ${unitLabel}`;
    }
  }

}