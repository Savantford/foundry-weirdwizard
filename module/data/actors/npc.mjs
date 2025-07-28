import BaseActorModel from './base-actor.mjs';
import { makeIntField, makeUuidStrField } from '../field-presets.mjs';

export default class NpcModel extends BaseActorModel {

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = super.defineSchema();
      
    // Character Options
    schema.charOptions = new fields.SchemaField({
      ancestry: makeUuidStrField()
    });

    // Add NPC stats
    schema.stats.fields.difficulty = makeIntField(1);

    // Change NPC initial stats
    schema.stats.fields.defense.fields.natural = makeIntField(10);
    schema.stats.fields.defense.fields.natural = makeIntField(10);
    schema.stats.fields.health.fields.normal = makeIntField(10);
    schema.stats.fields.health.fields.current = makeIntField(10);

    // Add Character Details
    schema.details = new fields.SchemaField({});

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

}