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

}