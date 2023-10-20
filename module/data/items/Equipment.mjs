import {
  fields,
  base,
  physical,
  activity,
  makeStrField,
  makeBooField,
  makeHtmlField
} from './common.mjs'

export default class EquipmentData extends foundry.abstract.DataModel {

  static defineSchema() {
    const type = 'Equipment';
    
    return {
      ...base(type),
      ...physical(type),
      ...activity(type),

      subtype: makeStrField('generic',0,1),
      quality: makeStrField('standard'),
      attribute: makeStrField(),
      damage: makeStrField(),
      grip: makeStrField('One-Handed'),

      properties: new fields.SchemaField({
        ammunition: makeBooField(false),
        brutal: makeBooField(false),
        concussing: makeBooField(false),
        disarming: makeBooField(false),
        driving: makeBooField(false),
        fast: makeBooField(false),
        firearm: makeBooField(false),
        great: makeBooField(false),
        light: makeBooField(false),
        long: makeBooField(false),
        nimble: makeBooField(false),
        painful: makeBooField(false),
        precise: makeBooField(false),
        range: makeBooField(false),
        reload: makeBooField(false),
        sharp: makeBooField(false),
        shattering: makeBooField(false),
        slow: makeBooField(false),
        special: makeBooField(false),
        thrown: makeBooField(false),
        unbalancing: makeBooField(false),
        versatile: makeBooField(false)
      }),

      attackRider: makeHtmlField(),
      reloaded: makeBooField(true),
      armorType: makeStrField('light'),
      
      //capacity: makeIntField(),
      //consumableType: makeStrField('potion')
    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    
    if ('range' in source && isNaN(source.range)) source.range = 0;

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