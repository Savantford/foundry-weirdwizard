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

    // Migrate Input Lists (Senses, Languages, Immune, Professions, Traditions)
    
    if (typeof source.details.senses === 'string') {
      const arr = source.details.senses.split(",");

      source.details.senses = arr.map(s => s.trim());
    }
    
    if (typeof source.details.languages === 'string') {
      const arr = source.details.languages.split(",");

      source.details.languages = arr.map(s => s.trim());
    }

    if (typeof source.details.immune === 'string') {
      const arr = source.details.immune.split(",");

      source.details.immune = arr.map(s => s.trim());
    }

    if (typeof source.details.professions === 'string') {
      const arr = source.details.professions.split(",");

      source.details.professions = arr.map(s => s.trim());
    }

    if (typeof source.details.traditions === 'string') {
      const arr = source.details.traditions.split(",");

      source.details.traditions = arr.map(s => s.trim());
    }
    
    // Migrate Level
    if (isNaN(source.stats?.level)) {

      switch (source.stats?.level) {
        case '⅛': source.stats.level = 0.125; break;
        case '¼': source.stats.level = 0.25; break;
        case '½': source.stats.level = 0.5; break;
        //default: source.stats.level = 1; break; // This is causing issues
      }
    }

    // Migrate Size
    if (isNaN(source.stats?.size)) {

      switch (source.stats?.size) {
        case '⅛': source.stats.size = 0.125; break;
        case '¼': source.stats.size = 0.25; break;
        case '½': source.stats.size = 0.5; break;
        //default: source.stats.size = 1; break; // This is causing issues
      }
    }

    // Migrate other stuff
    if ('stats' in source && isNaN(source.stats?.bonusdamage)) source.stats.bonusdamage = 0;
    if ('details' in source && isNaN(source.details?.reputation)) source.details.reputation = 0;

    return super.migrateData(source);
  }

  /* -------------------------------------------- */
  /*  Properties (Getters)                        */
  /* -------------------------------------------- */

  /**
   * Determine whether the character is injured.
   * @type {boolean}
   */
  /*get dead() {
    const invulnerable = CONFIG.specialStatusEffects.INVULNERABLE;
    if ( this.parent.effects.some(e => e.statuses.has("invulnerable") )) return false;
    return this.health.value <= this.health.min;
  }*/

  /* The defined dead property could then be accessed on any Actor document of the character type as follows:

  // Determine if a character is dead.
  game.actors.getName("Character").system.dead;
  */

}