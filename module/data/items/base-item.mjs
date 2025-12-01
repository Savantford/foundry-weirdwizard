import { makeStrField, makeBooField, makeIntField, makeHtmlField, makeUuidStrField, makeRequiredStrField } from '../field-presets.mjs';

export default class BaseItemModel extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      description: makeHtmlField(),
      active: makeBooField(true),
      grantedBy: makeUuidStrField(),

      magical: makeBooField(false),
      attribute: makeStrField(), // Make it required maybe
      against: makeStrField(), // Make it required maybe

      boons: new fields.NumberField({
        required: true,
        initial: 0,
        integer: true
      }),

      range: makeIntField(),
      affliction: makeStrField(), // Make it required maybe

      uses: new fields.SchemaField({
        value: makeIntField(),
        max: makeIntField(),
        onRest: makeBooField(true),
        levelRelative: makeRequiredStrField('manual')
      }),

      healing: makeStrField(),
      instant: new fields.ArrayField(
        new fields.ObjectField({
          label: makeStrField(),
          trigger: makeRequiredStrField('onUse'),
          target: makeRequiredStrField('tokens'),
          value: makeStrField()
        })
      ),

      targeting: makeRequiredStrField('manual'),
      template: new fields.SchemaField({
        type: makeRequiredStrField('size'),
        value: makeIntField(5)
      })

    };

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
  */
  static migrateData(source) {
    // Migrate description to a single string
    if (typeof source.description === 'object') source.description = source.description.value;
    
    // Migrate invalid UUIDs
    if (source.grantedBy === 'jYwMjI0baL87WX3c') source.grantedBy = 'JournalEntry.LMmphPzAYiO8vOgI.JournalEntryPage.jYwMjI0baL87WX3c';
    
    return source;
  }

}