import { makeHtmlField, makeUuidStrField } from "../field-presets.mjs";

export default class GroupModel extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      // Description
      description: makeHtmlField('No group description.'),

      // Group Members
      members: new fields.SchemaField({
        active: new fields.ArrayField(
          makeUuidStrField()
        ),
        inactive: new fields.ArrayField(
          makeUuidStrField()
        ),
        retired: new fields.ArrayField(
          makeUuidStrField()
        ),
        dead: new fields.ArrayField(
          makeUuidStrField()
        ),
      })

    }

    return schema;
  }

}