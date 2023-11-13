import { i18n, formatTime } from '../helpers/utils.mjs';

export default class WWActiveEffect extends ActiveEffect {

  prepareData() {
    super.prepareData();

    const wwflags = this.flags.weirdwizard;

    // Set external flag if it does not exist. Must have a non-passive trigger flag set and a different parent UUID
    if (!wwflags?.external && wwflags?.trigger != 'passive' && this.origin && !this.origin.includes(this.parent.uuid)) {
      this.setFlag('weirdwizard', 'external', true)
    }

    // Set selectedDuration flag to '' if undefined
    if (!wwflags?.selectedDuration === undefined) {
      this.setFlag('weirdwizard', 'selectedDuration', '')
    }

    // Set autoDelete flag to true if undefined
    if (!wwflags?.autoDelete === undefined) {
      this.setFlag('weirdwizard', 'autoDelete', true)
    }
    
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
    const trigger = this.flags.weirdwizard?.trigger ?? 'passive';
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

  /**
   * Apply this ActiveEffect to a provided Actor.
   * TODO: This method is poorly conceived. Its functionality is static, applying a provided change to an Actor
   * TODO: When we revisit this in Active Effects V2 this should become an Actor method, or a static method
   * @override
   * @param {Actor} actor                   The Actor to whom this effect should be applied
   * @param {EffectChangeData} change       The change data being applied
   * @returns {*}                           The resulting applied value
   */

  apply(actor, change) {

    // Save label key and get real change key
    const labelKey = change.key;
    change.key = CONFIG.WW.effectChangeKeys[change.key];

    // Determine the data type of the target field
    const current = foundry.utils.getProperty(actor, change.key) ?? null;
    
    let target = current;
    if ( current === null ) {
      const model = game.model.Actor[actor.type] || {};
      target = foundry.utils.getProperty(model, change.key) ?? null;
    }
    let targetType = foundry.utils.getType(target);

    // Alter Change Values to negative values if they are meant to be
    if (labelKey.includes('banes') || (labelKey.includes('Reduce') && !labelKey.includes('health'))) change.value = -change.value;

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
    const changes = {};
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
    return changes;
  }

}