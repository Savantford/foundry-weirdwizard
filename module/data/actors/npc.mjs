import { camelCase } from '../../helpers/utils.mjs';
import { BaseActorModel, makeIntField, makeCharOptionField } from './base-actor.mjs';

export default class NpcData extends BaseActorModel {

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = super.defineSchema();
      
    // Character Options
    schema.charOptions = new fields.SchemaField({
      ancestry: makeCharOptionField(null)
    })

    // Add NPC stats
    schema.stats.fields.difficulty = makeIntField(1);

    // Change NPC initial stats
    schema.stats.fields.defense.fields.natural = makeIntField(10);

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(source) {
    // Migrate total Defense to Natural Defense (4.3.0)
    if (source.stats?.defense?.total && !source.stats?.defense?.natural && source.stats?.defense?.total !== 10 && source.stats?.defense?.total !== source.stats?.defense?.natural) {
      source.stats.defense.natural = source.stats.defense.total;
    }

    // Migrate Level to Difficulty
    if (source.stats?.level) source.stats.difficulty = source.stats.level;

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