//import { formatTime } from '../helpers/utils.mjs';
import { escape } from '../helpers/utils.mjs';
import WWDocumentMixin from './ww-document.mjs';

export default class WWActiveEffect extends WWDocumentMixin(foundry.documents.ActiveEffect) {

  /* -------------------------------------------- */
  /*  Document Lifecycle                          */
  /* -------------------------------------------- */

  /*async _preCreate(data, options, user) {
    return await super._preCreate(data, options, user);
  }*/

  /* -------------------------------------------- */

  /*async _preUpdate(changes, options, user) {
    return await super._preUpdate(changes, options, user);
  }*/

  /* -------------------------------------------- */
  
  /** @inheritDoc */
  _onDelete(options, userId) {
    if (this.isTemporary/* && this.duration.expired*/) ChatMessage.create({
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
    if (!document) return null;

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
    const lcPreset = this.system.durationPreset.toLowerCase();

    switch ( event ) {
      case "combatStart":
      case "combatEnd":
      case "roundStart":
      case "roundEnd":
        return !!effectCombatant;
      case "turnStart":
        // Return false if combat hasn't started a or if combat/effect has no combatant
        if ( !combat?.started || !effectCombatant) return false;
        
        // If no preset is selected, return true
        if (!lcPreset) return true;
        
        // If TARGET is taken into account (nextTargetTurnStart)
        if (lcPreset.includes('target')) {
          if (combat.combatant) return effectCombatant.id === combat.combatant.id; // Prefer matching on combatant
          else return effectCombatant.turnNumber === combat.turn;                  // Otherwise match turn number
        
        // If TRIGGER is taken into account (nextTriggerTurnStart)
        } else if (!this.originalCombatant || this.originalCombatant?.id === combat.combatant.id) true;
        else false;
      case "turnEnd": {
        // Return false if combat hasn't started a or if combat/effect has no combatant
        if ( !combat?.started || !effectCombatant) return false;

        // Return false if previous combatant does not exist
        const previousCombatantId = combat.previous.combatantId;
        if ( !previousCombatantId ) return false;
        
        // If no preset is selected or turnEnd is selected, return true
        if (!lcPreset || lcPreset === 'turnend') return true;

        // If TARGET is taken into account (nextTargetTurnEnd)
        else if (lcPreset.includes('target')) {
          if (previousCombatantId) return effectCombatant.id === previousCombatantId; // Prefer matching on combatant
          else return effectCombatant.turnNumber === combat.previous.turn;            // Otherwise match turn number
        
        // If TRIGGER is taken into account (nextTriggerTurnEnd)
        } else if (!this.originalCombatant || this.originalCombatant?.id === previousCombatantId) true;
        else false;
      }
      default:
        return false;
    }
  }

  /* -------------------------------------------- */

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