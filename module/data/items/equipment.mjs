import {
  BaseItemModel,
  fields,
  base,
  physical,
  activity,
  makeStrField,
  makeBooField,
  makeHtmlField,
  makeIntField
} from './base-item.mjs'

export default class EquipmentData extends BaseItemModel {

  static defineSchema() {
    const type = 'Equipment';
    
    return {
      ...base(type),
      ...physical(type),
      ...activity(type),

      subtype: makeStrField('generic',0,1),
      quality: makeStrField('standard'),
      availability: makeStrField('common'),
      attribute: makeStrField(),
      heldBy: makeStrField(),

      // Weapons
      requirements: makeStrField(),
      damage: makeStrField(),
      grip: makeStrField('One'),

      traits: new fields.SchemaField({
        ammunition: makeBooField(false),
        bludgeoning: makeBooField(false),
        brutal: makeBooField(false),
        disarming: makeBooField(false),
        firearm: makeBooField(false),
        large: makeBooField(false),
        light: makeBooField(false),
        long: makeBooField(false),
        misfire: makeBooField(false),
        nimble: makeBooField(false),
        piercing: makeBooField(false),
        range: makeBooField(false),
        reload: makeBooField(false),
        slashing: makeBooField(false),
        slow: makeBooField(false),
        special: makeBooField(false),
        thrown: makeBooField(false),
        versatile: makeBooField(false)
      }),

      attackRider: makeHtmlField(),
      reloaded: makeBooField(true),
      armorType: makeStrField('light'),
      
      capacity: makeIntField(1),
      //consumableType: makeStrField('potion')
    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    
    // Make sure Range is a number
    if ('range' in source && isNaN(source.range)) source.range = 0;

    // Migrate weapon properties to traits/advantages/disadvantages
    if ('properties' in source && !Object.values(source.properties).every(item => item === false)) {
      const properties = source.properties;
      
      let traits = source.traits ? source.traits : {};
      let advantages = source.advantages ? source.advantages : {};
      let disadvantages = source.disadvantages ? source.disadvantages : {};

      const traitsList = ['ammunition', 'brutal', 'firearm', 'long', 'nimble', 'precise', 'range', 'sharp', 'shattering', 'thrown', 'versatile'];
      const advantagesList = ['disarming', 'driving'];
      const disadvantagesList = ['light', 'reload', 'slow'];

      for (const p of Object.keys(properties)) {
        
        // Assign traits
        if (p === 'concussing' && properties[p]) traits['shattering'] = true;
        if (p === 'fast' && properties[p]) traits['precise'] = true;
        if (p === 'great' && properties[p]) traits['forceful'] = true;
        if (p === 'painful' && properties[p]) traits['special'] = true;
        if (p === 'unbalancing' && properties[p]) traits['forceful'] = true;
        if (traitsList.includes(p) && properties[p]) traits[p] = true;
        
        // Assign advantages
        if (advantagesList.includes(p) && properties[p]) advantages[p] = true;
        
        // Assign disadvantages
        if (disadvantagesList.includes(p) && properties[p]) disadvantages[p] = true;
        
      }

      source.traits = traits;
      source.advantages = advantages;
      source.disadvantages = disadvantages;

    }

    // Migrate old traits to new ones
    if (source.traits?.precise) source.traits.piercing = source.traits.precise;
    if (source.traits?.sharp) source.traits.slashing = source.traits.sharp;
    if (source.traits?.shattering) source.traits.bludgeoning = source.traits.shattering;

    // Migrate weapon advantages to traits
    if ('advantages' in source) {
      const adv = source.advantages;
      if (adv.disarming) source.traits.disarming = adv.disarming;
      if (adv.special) source.traits.special = adv.special;
    }

    // Migrate weapon disadvantages to traits
    if ('disadvantages' in source) {
      const disadv = source.advantages;
      if (disadv.light) source.traits.light = disadv.light;
      if (disadv.reload) source.traits.reload = disadv.reload;
      if (disadv.slow) source.traits.slow = disadv.slow;
      if (disadv.special) source.traits.special = disadv.special;
    }

    // Migrate weapon requirements
    if ('requirements' in source) {
      
      switch (source.requirements) {
        case 'str10': source.requirements = 'str11'; break;
        case 'agi14': source.requirements = 'agi13'; break;
        case 'int10agi12': source.requirements = 'agi12'; break;
      }

    }

    // Convert Health recover to Health regain
    if (source.instant) {
      for (const i of source.instant) {
        if (i.label === 'healthRecover') i.label = 'healthRegain';
      }
    }

    return super.migrateData(source);
  }

  /**
   * Determine whether the item is destroyed.
   * @type {boolean}
   */
  get destroyed() {
    const invulnerable = CONFIG.specialStatusEffects.INVULNERABLE;
    if ( this.parent.effects.some(e => e.statuses.has('invulnerable') )) return false;
    return this.health.value <= this.health.min;
  }

  /* The defined destroyed property could then be accessed on any Actor document of the item type as follows:

  // Determine if a item is destroyed.
  game.actors.getName('Character').system.destroyed;
  */

}