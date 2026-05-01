import { makeBooField, makeRequiredStrField, makeUuidStrField, makePosIntField } from "../field-presets.mjs";

export default class BaseEffectModel extends foundry.data.ActiveEffectTypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    
    const schema = {
      ... super.defineSchema(),

      target: makeRequiredStrField('none'),
      trigger: makeRequiredStrField('passive'),

      duration: new fields.SchemaField({
        selected: makeRequiredStrField('none'),
        inMinutes: makePosIntField(null),
        inHours: makePosIntField(null),
        inDays: makePosIntField(null),
        autoExpire: makeBooField(true)
      }),
      
      grantedBy: makeUuidStrField(),
    }
    
    // Custom Changes - Unused for now
    /*schema.changes.element.extendFields({
      test: makeBooField()
    });*/

    return schema;
  }

}