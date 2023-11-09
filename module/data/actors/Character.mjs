import {
  fields,
  description,
  attributes,
  stats,
  details,
  makeIntField
} from './common.mjs'

export default class CharacterData extends foundry.abstract.DataModel {

  static defineSchema() {
    const type = 'Character';
    
    return {
      ...description(type),
      ...attributes(),
      ...stats(type),
      ...details(type),

      currency: new fields.SchemaField({
        gp: makeIntField(),
        sp: makeIntField(),
        cp: makeIntField(),
      }) 
    }
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {

    // Migrate Speed
    if ('stats.speed.value' in source) source.stats.speed.current = source.stats.speed.value;
    if ('stats.speed.raw' in source) source.stats.speed.normal = source.stats.speed.raw;
    
    // Migrate Level
    if (isNaN(source.stats.level)) {
      console.log('level is not a number: ' + source.stats.level)
      switch (source.stats.level) {
        case '⅛': source.stats.level = 0.125;
        case '¼': source.stats.level = 0.25;
        case '½': source.stats.level = 0.5;
      }
    }

    // Migrate Size
    if (isNaN(source.stats.size)) {
      console.log('size is not a number: ' + source.stats.size)
      switch (source.stats.size) {
        case '⅛': source.stats.size = 0.125;
        case '¼': source.stats.size = 0.25;
        case '½': source.stats.size = 0.5;
      }
    }

    return super.migrateData(source);
  }

  /**
   * Determine whether the character is dead.
   * @type {boolean}
   */
  get dead() {
    const invulnerable = CONFIG.specialStatusEffects.INVULNERABLE;
    if ( this.parent.effects.some(e => e.statuses.has("invulnerable") )) return false;
    return this.health.value <= this.health.min;
  }

  /* The defined dead property could then be accessed on any Actor document of the character type as follows:

  // Determine if a character is dead.
  game.actors.getName("Character").system.dead;
  */

}