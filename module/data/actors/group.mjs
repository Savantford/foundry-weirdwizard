import { makeHtmlField, makeIntField, makeRequiredStrField, makeStrField, makeUuidStrField } from "../field-presets.mjs";

export default class GroupModel extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      // Basic information
      level: makeIntField(1),
      tier: makeRequiredStrField('novice'),

      // Details
      details: new fields.SchemaField({
        origin: makeHtmlField('No group origin story.'),
        achievements: makeHtmlField(),
        notes: makeHtmlField(),
      }),

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
      }),

      // List Entries
      listEntries: new fields.SchemaField({

        connections: new fields.TypedObjectField(
          new fields.SchemaField({
            name: makeStrField("Unnamed", 0),
            desc: makeStrField(),
            type: makeRequiredStrField('financial'),
            grantedBy: makeUuidStrField()
          }, { nullable: true })
        )

      })

    }

    return schema;
  }

}