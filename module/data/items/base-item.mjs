import { makeStrField, makeBooField, makeIntField, makeHtmlField, makeUuidStrField, makeRequiredStrField, makeNumField } from '../field-presets.mjs';

export default class BaseItemModel extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      description: makeHtmlField(),
      active: makeBooField(true),
      grantedBy: makeUuidStrField(),
      usedBy: new fields.ArrayField(
        makeUuidStrField()
      ),

      magical: makeBooField(false),
      attribute: makeStrField(), // Make it required maybe
      against: makeStrField(), // Make it required maybe

      boons: new fields.NumberField({
        required: true,
        initial: 0,
        integer: true
      }),
      boonsAlt: makeStrField(),

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

      // Targeting & scene region template
      targeting: new fields.SchemaField({
        operation: makeRequiredStrField('none'),
        range: makeIntField(0),
        method: makeRequiredStrField('manual'),
        restriction: makeRequiredStrField('any')
      }),

      // Area (Scene Region) template
      area: new fields.SchemaField({
        radius: makeIntField(5),
        size: makeIntField(5),
        attached: makeBooField(),
        color: new fields.ColorField(),
        shape: makeRequiredStrField('emanation'),

        restriction: new fields.SchemaField({
          enabled: makeBooField(true),
          type: makeRequiredStrField('move'),
          priority: makeIntField(0)
        })
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
    if ('grantedBy' in source) {
      if (source.grantedBy === 'jYwMjI0baL87WX3c') source.grantedBy = 'JournalEntry.LMmphPzAYiO8vOgI.JournalEntryPage.jYwMjI0baL87WX3c';
      else if (!source.grantedBy?.includes('.')) source.grantedBy = null;
    }

    // Migrate targeting & scene region template
    /*if (typeof source.targeting === 'string') {
      source.targeting = {
        operation: source.targeting,
        range: source.range
      };

      if (source.targeting.operation === 'template') source.targeting.operation = 'spawnRegion';
    }*/
    
    //if (source.template?.value) source.area.size = source.template.value;
    
    return source;
  }

}