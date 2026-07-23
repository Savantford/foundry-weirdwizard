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

      // Targeting & scene region template
      targetingOperation: makeRequiredStrField('manual'),

      template: new fields.SchemaField({
        radius: makeIntField(5),
        attached: makeBooField(),
        color: new fields.ColorField(),
        type: makeRequiredStrField('emanation'),

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

    // Migrate measured template params to scene region options
    if (source.targeting) source.targetingOperation = source.targeting;
    if (source.targetingOperation === 'template') source.targetingOperation = 'areaTarget';
    if (source.template?.type === 'spread' || source.template?.type === 'size') source.template.type = 'emanation';
    if (source.template?.type === 'spread') source.template.enabled = true;
    if (source.template?.value) source.template.radius = source.template.value;
    
    return source;
  }

}