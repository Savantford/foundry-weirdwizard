import { makeStrField, makeBooField, makeIntField, makeHtmlField, makeUuidStrField, makeRequiredStrField, makeNumField } from '../field-presets.mjs';

export default class BaseItemModel extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      description: makeHtmlField(),
      active: makeBooField({ initial: true }),
      grantedBy: makeUuidStrField(),
      usedBy: new fields.ArrayField(
        makeUuidStrField()
      ),

      magical: makeBooField(),
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
        onRest: makeBooField({ initial: true }),
        levelRelative: makeRequiredStrField({ initial: 'manual' })
      }),

      healing: makeStrField(),
      instant: new fields.ArrayField(
        new fields.ObjectField({
          label: makeStrField(),
          trigger: makeRequiredStrField({ initial: 'onUse' }),
          target: makeRequiredStrField({ initial: 'tokens' }),
          value: makeStrField()
        })
      ),

      // Targeting & scene region template
      targeting: new fields.SchemaField({
        operation: makeRequiredStrField({ initial: 'none' }),
        range: makeIntField({ initial: 0 }),
        method: makeRequiredStrField({ initial: 'manual' }),
        restriction: makeRequiredStrField({ initial: 'any' })
      }),

      // Area (Scene Region) template
      area: new fields.SchemaField({
        shape: makeRequiredStrField({ initial: 'circle' }),
        size: makeIntField({ initial: 5 }), // Circle Size or Line Length
        radius: makeIntField({ initial: 5 }), // Emanation only
        width: makeIntField({ initial: 1 }), // Line only
        attached: makeBooField({ initial: true }), // Emanation only
        color: new fields.ColorField(),

        restriction: new fields.SchemaField({
          enabled: makeBooField({ initial: true }),
          type: makeRequiredStrField({ initial: 'move' }),
          priority: makeIntField({ initial: 0 })
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

    // Migrate targeting and area settings
    if (typeof source.targeting === 'string') {
      const needTargeting = source.range || source.targeting === 'template' || source.against;
      
      source.targeting = {
        operation: needTargeting ? 'target' : 'none',
        method: source.targeting === 'template' ? 'area' : 'manual'
      }
    }

    if (source.range) foundry.utils.setProperty(source, 'targeting.range', source.range);

    if (source.template?.value) foundry.utils.setProperty(source, 'area.size', source.template.value);

    // Migrate half damage
    const instEffs = source.instant;
    
    if (instEffs?.length) {
      for (const eff of instEffs) {
        if (eff.value.includes('dmg.half')) eff.value = eff.value.replace('dmg.half', 'damageHalf');
      }
    }
    
    return source;
  }
}