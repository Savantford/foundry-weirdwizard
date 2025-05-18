import { i18n, formatTime } from '../helpers/utils.mjs';

export default class WWActiveEffect extends ActiveEffect {

  /* -------------------------------------------- */
  /*  Document Creation                           */
  /* -------------------------------------------- */

  async _preCreate(data, options, user) {
    this._validateDuration(data, 'preCreate');

    return await super._preCreate(data, options, user);
  }

  /* -------------------------------------------- */
  /*  Document Update                             */
  /* -------------------------------------------- */

  async _preUpdate(changes, options, user) {
    this._validateDuration(changes, 'preUpdate');

    return await super._preUpdate(changes, options, user);
  }

  _validateDuration(changes, stage) {
    const effect = this;
    const selected = changes.system?.duration?.selected ?? this.system.duration.selected;

    const rounds = changes.duration?.rounds ?? this.duration.rounds,
    minutes = changes.system?.duration?.inMinutes ?? this.system.duration.inMinutes,
    hours = changes.system?.duration?.inHours ?? this.system.duration.inHours,
    days = changes.system?.duration?.inDays ?? this.system.duration.inDays;

    const updateData = function(rounds, seconds) {
      if (stage === 'preCreate') effect.updateSource({ 'duration.rounds': rounds, 'duration.seconds': seconds });
      else if (stage = 'preUpdate') changes = foundry.utils.mergeObject(changes, { 'duration.rounds': rounds, 'duration.seconds': seconds });
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
      case 'minutes': updateData(null, minutes * 60); break;
      case 'hours': updateData(null, hours * 60*60); break;
      case 'days': updateData(null, days * 60*60*24); break;
      
    }

    // Format duration
    if (rounds === 777) this.system.duration.formatted = 'Luck ends';
    else if (rounds) this.system.duration.formatted = `${rounds} ${(rounds > 1 ? i18n(rounds + 'Rounds') : i18n(rounds + 'Round'))}`;
    else this.system.duration.formatted = formatTime(this.duration.seconds);
  }

  async _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId); 
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
    const system = this.system;
    
    // The item which this effect originates from if it has been transferred from an item to an actor
    this.originalItem = (this.parent instanceof Item) ? this.parent : null;

    // Get derived duration variables
    const key = 'WW.Effect.Duration.';
    const rounds = this.duration.rounds;
    const selected = this.system.duration.selected;

    if (rounds) {
      // Prepare formatted selected label
      let str = '';
      if (selected) {
        str += i18n(CONFIG.WW.EFFECT_DURATIONS.combat.options[selected]);
        if (selected !== 'luckEnds') str += ` (${rounds} ${(rounds > 1 ? i18n(key + 'Rounds') : i18n(key + 'Round'))})`;
        if (selected === 'Xrounds') str = `${rounds} ${(rounds > 1 ? i18n(key + 'Rounds') : i18n(key + 'Round'))}`; // Override if X rounds
      }
      
      this.system.duration.formatted = str;

    } else this.system.duration.formatted = formatTime(this.duration.seconds);
    
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

  /**
   * A method that can be overridden by subclasses to customize the generation of the embed figure.
   * @param {HTMLElement|HTMLCollection} content  The embedded content.
   * @param {DocumentHTMLEmbedConfig} config      Configuration for embedding behavior.
   * @param {EnrichmentOptions} [options]         The original enrichment options for cases where the Document embed
   *                                              content also contains text that must be enriched.
   * @returns {Promise<HTMLElement|null>}
   * @protected
   * @override
   */
  async _createFigureEmbed(content, config, options) {
    const section = document.createElement("section");

    if ( content instanceof HTMLCollection ) section.append(...content);
    else section.append(content);
    
    return section;
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
  
  /** @override */
  get isSuppressed() {
    // Suppress if parent is an inactive item
    if (this.parent instanceof Item && !foundry.utils.getProperty(this.parent, 'system.active')) return true;

    // False otherwise
    return false;
  }

  get isBenefit() {
    return this.type === 'benefit';
  }

  get hasValidCharOption() {
    const actor = this.parent.documentName === 'Actor' ? this.parent : null;
    const cOptUuid = this.system.grantedBy;

    if (!actor || !cOptUuid) return false;

    const uuidFound = Object.values(actor.system.charOptions).includes(cOptUuid);
    
    return uuidFound;
  }

  get showDeleteButton() {
    if (this.parent.documentName === 'Item') return false;
    if (this.isBenefit && this.hasValidCharOption) return false;
    return true;
  }

  /**
   * The combatant from which the effect originated
  */
  get originalCombatant() {
    const document = fromUuidSync(this.origin);

    if (document.documetName === 'Item') {
      return document.parent.token?.combatant ?? null;
    } else {
      return document.token?.combatant ?? null;
    }

  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  // Transfer to actor only if the item is passive
  determineTransfer(){
    if (this.system.trigger === 'passive') return true;
    else return false;
  }

  /* -------------------------------------------- */

  /**
   * Apply this ActiveEffect to a provided Actor.
   * TODO: This method is poorly conceived. Its functionality is static, applying a provided change to an Actor
   * TODO: When we revisit this in Active Effects V2 this should become an Actor method, or a static method
   * @param {Actor} actor                   The Actor to whom this effect should be applied
   * @param {EffectChangeData} change       The change data being applied
   * @returns {Record<string, *>}           An object of property paths and their updated values.
   */

  apply(actor, change) {
    let field;
    const changes = {};
    if ( change.key.startsWith("system.") ) field = actor.system.schema?.getField(change.key.slice(7));
    else field = actor.schema.getField(change.key);
    if ( field ) changes[change.key] = this.constructor.applyField(actor, change, field);
    else this._applyLegacy(actor, change, changes);
    return changes;
  }

  /* -------------------------------------------- */

  /**
   * Apply this ActiveEffect to a provided Actor using a heuristic to infer the value types based on the current value
   * and/or the default value in the template.json.
   * @param {Actor} actor                The Actor to whom this effect should be applied.
   * @param {EffectChangeData} change    The change data being applied.
   * @param {Record<string, *>} changes  The aggregate update paths and their updated values.
   * @protected
   */
  _applyLegacy(actor, change, changes) {
    // Save label key and get real change key - Weird Wizard only
    const labelKey = '' + change.key;
    change.key = CONFIG.WW.EFFECT_CHANGE_KEYS[change.key];
    
    // Determine the data type of the target field
    const current = foundry.utils.getProperty(actor, change.key) ?? null;
    let target = current;
    if ( current === null ) {
      const model = game.model.Actor[actor.type] || {};
      target = foundry.utils.getProperty(model, change.key) ?? null;
    }
    let targetType = foundry.utils.getType(target);

    // Alter Change Values to negative values if they are meant to be - Weird Wizard only
    if (labelKey.includes('banes') || (labelKey.toLowerCase().includes('reduce') && !labelKey.includes('health'))) change.value = -change.value;

    // Cast the effect change value to the correct type
    let delta;
    try {
      if ( targetType === "Array" ) {
        const innerType = target.length ? foundry.utils.getType(target[0]) : "string";
        delta = this._castArray(change.value, innerType);
      }
      else delta = this._castDelta(change.value, targetType);
    } catch(err) {
      console.warn(`Actor [${actor.id}] | Unable to parse active effect change for ${change.key}: "${change.value}"`);
      return;
    }

    // Apply the change depending on the application mode
    const modes = CONST.ACTIVE_EFFECT_MODES;
    switch ( change.mode ) {
      case modes.ADD:
        this._applyAdd(actor, change, current, delta, changes);
        break;
      case modes.MULTIPLY:
        this._applyMultiply(actor, change, current, delta, changes);
        break;
      case modes.OVERRIDE:
        this._applyOverride(actor, change, current, delta, changes);
        break;
      case modes.UPGRADE:
      case modes.DOWNGRADE:
        this._applyUpgrade(actor, change, current, delta, changes);
        break;
      default:
        this._applyCustom(actor, change, current, delta, changes);
        break;
    }

    // Apply all changes to the Actor data
    foundry.utils.mergeObject(actor, changes);
  }

}