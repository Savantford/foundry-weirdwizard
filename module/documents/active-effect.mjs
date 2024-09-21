import { i18n, formatTime } from '../helpers/utils.mjs';

export default class WWActiveEffect extends ActiveEffect {

  async _onCreate(data, options, user) {
    
    if (!data.flags?.weirdwizard) data.flags = { weirdwizard: {} };

    const wwflags = data.flags.weirdwizard;
    
    // Create basic flags if they aren't set already
    const obj = {
      selectedDuration: wwflags?.selectedDuration ? wwflags.selectedDuration : '',
      autoDelete: wwflags?.autoDelete ? this.autoDelete : true,
      external: wwflags?.external ? wwflags.external : false,
      uuid: await this.uuid
    };

    // Set external flag if it does not exist. Must have a non-passive trigger flag set and a different parent UUID
    if (!wwflags?.external && wwflags?.trigger != 'passive' && this.origin && !this.origin.includes(this.parent.uuid)) {
      obj.external = true;
    }
    
    await this.updateSource({ 'flags.weirdwizard': obj });

    return await super._onCreate(data, options, user);
  }

  prepareData() {
    super.prepareData();
  }

  async _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);
    
  }

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */
  
  /** @override */
  get isSuppressed() {
    const originatingItem = this.originatingItem;

    if (!originatingItem) {
      return false;
    }

    return !originatingItem.system.active;
  }

  /**
   * The item which this effect originates from if it has been transferred from an item to an actor.
   * @return {import('./item/item').WWItem | undefined}
  */
  get originatingItem() {
    
    if (this.parent instanceof Item) {
      return this.parent;
    }
    
    return undefined;
  }

  /**
   * The combatant from which the effect originated
  */
  get originCombatant() {

    if (this.origin.includes('Item')) {
      const item = fromUuidSync(this.origin);
      const combatant = item.parent.token?.combatant;
      return combatant ?? combatant;
    } else {
      const actor = fromUuidSync(this.origin);
      const combatant = actor.token?.combatant;
      return combatant ?? combatant;
    }

  }

  /**
   * Get the selectedDuration flag.
   * @type {string}
  */
  get selectedDuration() {
    return this.flags.weirdwizard?.selectedDuration;
  }

  /**
   * Get the autoDelete flag.
   * @type {string}
  */
  get autoDelete() {
    return this.flags.weirdwizard?.autoDelete;
  }

  /**
   * Get the durationInMinutes flag.
   * @type {string}
  */
  get durationInMinutes() {
    return this.flags.weirdwizard?.durationInMinutes;
  }

  /**
   * Get the durationInHours flag.
   * @type {string}
  */
  get durationInHours() {
    return this.flags.weirdwizard?.durationInHours;
  }

  /**
   * Get the durationInDays flag.
   * @type {string}
  */
  get durationInDays() {
    return this.flags.weirdwizard?.durationInDays;
  }

  /**
   * Get the formatted duration.
   * @type {string}
  */
  get formattedDuration() {
    if (this.duration.seconds)
      return formatTime(this.duration.seconds);
    else {
      const rounds = this.duration.rounds;
      const key = 'WW.Effect.Duration.';
      
      return rounds + ' ' + (rounds > 1 ? i18n(key + 'Rounds') : i18n(key + 'Round'));
    }
  }

  /**
   * The number of times this effect should be applied.
   * @type {number}
  */
  get factor() {
    return this.originatingItem?.activeEffectFactor ?? 1;
  }

  /**
   * Get the Trigger flag.
   * Returns the default value the flag is not set.
   * @type {string}
  */
  get trigger() {
    let trigger = this.flags.weirdwizard?.trigger ?? 'passive';

    // If the effect has a duration, do not allow it to be passive
    if ((this.parent instanceof Item) && (this.duration.rounds || this.duration.seconds) && trigger === 'passive') trigger = 'onUse';
    
    return typeof trigger === 'string' ? trigger : 'passive';
  }

  /**
   * Get the Target flag.
   * Returns the default value the flag is not set.
   * @type {string}
  */
  get target() {
    const target = this.flags.weirdwizard?.target ?? 'none';
    return typeof target === 'string' ? target : 'none';
  }

  /**
   * Check if the external flag exists.
   * Returns the default value the flag is not set.
   * @type {string}
  */
  get isExternal() {
    if (this.flags.weirdwizard?.external)
      return true;
    else
      return false;
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  determineTransfer(){
    if (this.trigger == 'passive') // Transfer 
      return true;
    else 
      return false;
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