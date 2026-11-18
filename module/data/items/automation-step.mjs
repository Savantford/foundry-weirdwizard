import { makeBooField, makeIntField, makeRequiredStrField, makeStrField } from '../field-presets.mjs';

export default class AutomationStepModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    const schema = {
      operation: makeRequiredStrField({
        initial: 'target',
        choices: CONFIG.WW.AUTOMATION_STEP_OPERATIONS
      }),

      condition: makeRequiredStrField({
        initial: 'none',
        choices: CONFIG.WW.AUTOMATION_STEP_CONDITIONS
      }),

      // Targeting
      targeting: new fields.SchemaField({
        range: makeIntField({ initial: 0 }),
        
        method: makeRequiredStrField({
          initial: 'manual',
          choices: CONFIG.WW.TARGETING_METHODS
        }),
        restriction: makeRequiredStrField({
          initial: 'any',
          choices: CONFIG.WW.TARGETING_RESTRICTIONS
        })
      }),

      // Area (Scene Region)
      area: new fields.SchemaField({
        shape: makeRequiredStrField({
          initial: 'circle',
          choices: CONFIG.WW.ITEM_AREA_SHAPES
        }),
        measure: makeIntField({ initial: 5 }),
        width: makeIntField({ initial: 1 }), // Line only
        attached: makeBooField({ initial: true }), // Emanation only
        color: new fields.ColorField(),

        restriction: new fields.SchemaField({
          enabled: makeBooField({ initial: true }),
          type: makeRequiredStrField({
            initial: 'move',
            choices: Object.fromEntries(
              Object.entries(CONST.EDGE_RESTRICTION_TYPES).map(([key, value]) => [value, `REGION.RESTRICTION_TYPES.${value}.label`])
            )
          }),
          priority: makeIntField({ initial: 0 })
        })
      }),

      // Roll
      roll: new fields.SchemaField({
        attribute: makeRequiredStrField({
          initial: 'str',
          choices: CONFIG.WW.ROLL_ATTRIBUTES
        }),
        against: makeRequiredStrField({
          initial: 'default',
          choices: CONFIG.WW.ROLL_AGAINST
        }),
        boons: new fields.NumberField({
          required: true,
          initial: 0,
          placeholder: 0,
          integer: true
        }),
        boonsAlt: makeStrField({
          placeholder: _loc("WW.Item.Alt")
        })
      }),

      // Instant Effect
      instant: new fields.SchemaField({
        value: makeStrField({ placeholder: '1d6' }),

        restriction: makeRequiredStrField({
          initial: 'any',
          choices: CONFIG.WW.TARGETING_RESTRICTIONS
        }),
      }),

      // Affliction
      affliction: new fields.SchemaField({
        key: makeRequiredStrField({
          initial: 'blinded',
          choices: CONFIG.WW.AFFLICTIONS
        }),

        trigger: makeRequiredStrField({
          initial: 'onUse',
          choices: CONFIG.WW.INSTANT_TRIGGERS
        }),
        restriction: makeRequiredStrField({
          initial: 'any',
          choices: CONFIG.WW.TARGETING_RESTRICTIONS
        })
      })
    }
    
    return schema;
  }
}