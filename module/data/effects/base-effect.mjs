import { makeBooField, makeRequiredStrField, makeUuidStrField, makePosIntField, makeStrField } from "../field-presets.mjs";

export default class BaseEffectModel extends foundry.data.ActiveEffectTypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    
    const schema = {
      ... super.defineSchema(),

      target: makeRequiredStrField('none'),
      trigger: makeRequiredStrField('passive'),

      durationPreset: makeStrField(''),
      
      grantedBy: makeUuidStrField(),
    }
    
    // Custom Changes fields
    schema.changes.element.extendFields({
      preset: makeStrField('')
    });

    return schema;
  }

  /** @inheritdoc */
  static migrateData(data) {
    if (data.duration?.selected) data.durationPreset = data.duration.selected === 'none' ? '' : data.duration.selected;

    return super.migrateData(data);
  }

  /**
   * @override
   * Is there some system logic (or, absent that, an expired status) that makes this Active Effect ineligible for
   * application?
   * @type {boolean}
   */
  get isSuppressed() {
    // Suppress if parent is an inactive item
    if (this.parent.parent instanceof Item && !foundry.utils.getProperty(this.parent.parent, 'system.active')) return true;

    // False otherwise
    return false;
  }

}