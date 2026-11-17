import { makeBooField, makeIntField, makeRequiredStrField, makeStrField } from '../field-presets.mjs';

export default class AutomationStepModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    const schema = {
      operation: makeRequiredStrField({
        initial: 'target',
        choices: {... CONFIG.WW.AUTOMATION_STEP_OPERATIONS}
      }),

      // Roll
      roll: new fields.SchemaField({
        attribute: makeStrField(),
        against: makeStrField(),
        boons: new fields.NumberField({
          required: true,
          initial: 0,
          integer: true
        }),
        boonsAlt: makeStrField(),
      }),

      // Instant Effects
      instant: new fields.ArrayField(
        new fields.ObjectField({
          label: makeStrField(),
          trigger: makeRequiredStrField({ initial: 'onUse' }),
          target: makeRequiredStrField({ initial: 'tokens' }),
          value: makeStrField()
        })
      ),

      // Targeting
      targeting: new fields.SchemaField({
        operation: makeRequiredStrField({ initial: 'none' }),
        range: makeIntField({ initial: 0 }),
        method: makeRequiredStrField({ initial: 'manual' }),
        restriction: makeRequiredStrField({ initial: 'any' })
      }),

      // Area (Scene Region)
      area: new fields.SchemaField({
        shape: makeRequiredStrField({ initial: 'circle' }),
        measure: makeIntField({ initial: 5 }),
        width: makeIntField({ initial: 1 }), // Line only
        attached: makeBooField({ initial: true }), // Emanation only
        color: new fields.ColorField(),

        restriction: new fields.SchemaField({
          enabled: makeBooField({ initial: true }),
          type: makeRequiredStrField({ initial: 'move' }),
          priority: makeIntField({ initial: 0 })
        })
      })
    }
    console.log(schema.operation)
    return schema;
  }
}