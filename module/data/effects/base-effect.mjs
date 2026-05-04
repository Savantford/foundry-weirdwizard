import { makeBooField, makeRequiredStrField, makeUuidStrField, makePosIntField, makeStrField } from "../field-presets.mjs";

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

      durationPreset: makeRequiredStrField('none'),
      
      grantedBy: makeUuidStrField(),
    }
    
    // Custom Changes fields
    schema.changes.element.extendFields({
      preset: makeStrField()
    });

    return schema;
  }

  /** @inheritdoc */
  static migrateData(data) {
    if (data.duration?.selected) data.durationPreset = data.duration.selected;

    // Migrate changes (from DrawSteel)
    let migrateChanges = false;

    /*for (const change of data.system?.changes ?? []) {
      for (const [oldPath, newPath] of Object.entries(this.keyMigrations)) {
        const oldKey = change.key;
        change.key = change.key.replace(oldPath, newPath);
        if (change.key !== oldKey) migrateChanges ||= true;
      }
    }

    if (migrateChanges) foundry.utils.setProperty(data, "flags.draw-steel.migrateChanges", true);

    const oldExpiry = "system.end.type";
    const newExpiry = "duration.expiry";
    // only works for *freshly* created documents, existing ones are server migrated and get skipped
    foundry.abstract.Document._addDataFieldMigration(data, oldExpiry, newExpiry, data => {
      const oldValue = foundry.utils.getProperty(data, oldExpiry);
      return ds.CONFIG.effectEnds[oldValue]?.expiryEvent ?? "";
    });

    // Server migrated
    if (foundry.utils.hasProperty(data, oldExpiry) && (data.duration?.expiry === null)) {
      foundry.utils.setProperty(data, "flags.draw-steel.oldExpiry", data.system.end.type);
    }*/

    return super.migrateData(data);
  }

}