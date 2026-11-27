import { makeBooField, makeIntField, makeHtmlField, makeUuidStrField, makeRequiredStrField } from '../field-presets.mjs';
import AutomationStepModel from '../activities/automation-step.mjs';

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

      uses: new fields.SchemaField({
        value: makeIntField(),
        max: makeIntField(),
        onRest: makeBooField({ initial: true }),
        levelRelative: makeRequiredStrField({ initial: 'manual' })
      }),
      
      autoSteps: new fields.ArrayField(new fields.EmbeddedDataField(AutomationStepModel))
    };

    return schema;
  }

  get isAttack() {
    return this.subtype === 'weapon' ?? false;
  }

  get isWeapon() {
    return this.subtype === 'weapon' ?? false;
  }

  get isSpell() {
    return this.subtype === 'spell' ?? false;
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

    if (source.template?.value) foundry.utils.setProperty(source, 'area.measure', source.template.value);

    // Migrate Area Size / Radius to Measure
    if ('area' in source) {
      const a = source.area;
      
      if (a.shape === 'emanation' && a.radius) foundry.utils.setProperty(source, 'area.measure', a.radius);
      else if (a.shape === 'circle' && a.size) foundry.utils.setProperty(source, 'area.measure', a.size);
    }

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