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
  /*static migrateData(source) {
    if ( "weapons" in source ) {
      source.weapons = source.weapons.map(weapon => {
        return weapon === "bmr" ? "boomerang" : weapon;
      });
    }
    return super.migrateData(source);
  }*/

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