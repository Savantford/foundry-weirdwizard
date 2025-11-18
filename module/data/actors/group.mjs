import { makeBooField, makeHtmlField, makeRequiredStrField, makeStrField, makeUuidStrField } from "../field-presets.mjs";
import { i18n } from "../../helpers/utils.mjs";

export default class GroupModel extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      // Details
      details: new fields.SchemaField({
        origin: makeHtmlField(i18n("WW.Group.OriginDefault")),
        achievements: makeHtmlField(),
        notes: makeHtmlField()
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

      resources: new fields.SchemaField({
        fortune: makeBooField()
      }),

      // List Entries
      listEntries: new fields.SchemaField({

        connections: new fields.TypedObjectField(
          new fields.SchemaField({
            name: makeStrField(i18n("WW.ListEntry.DefaultName"), 0),
            desc: makeStrField(),
            type: makeRequiredStrField('financial'),
            grantedBy: makeUuidStrField()
          }, { nullable: true })
        )

      })

    }

    return schema;
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Get the group's max level Character from Active Members list.
   * @type {integer}
   */
  get maxLevel() {
    const membersArr = [... this.membersList.active].filter(x => x.type === 'character');
    const levels = membersArr.map(x => x.system.stats.level);
    
    return levels.length ? Math.max(...levels) : 0;
  }

  /**
   * Infer the group's Tier from the group's max level Character.
   * @type {string}
   */
  get tier() {
    return this.maxLevel >= 7 ? 'master' : (this.maxLevel >= 3 ? 'expert' : 'novice');
  }

}