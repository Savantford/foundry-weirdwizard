import { capitalize, inferDataFromKey } from "../../helpers/utils.mjs";
import { makeAttributeField, makeHtmlField, makeIntField, makeFloField, makeStrField } from "../field-presets.mjs";

export default class BaseActorModel extends foundry.abstract.TypeDataModel {

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      // Description
      description: makeHtmlField(),
      
      // Attributes
      attributes: new fields.SchemaField({
        str: makeAttributeField({ label: 'WW.Attributes.Strength' }),
        agi: makeAttributeField({ label: 'WW.Attributes.Agility' }),
        int: makeAttributeField({ label: 'WW.Attributes.Intellect' }),
        wil: makeAttributeField({ label: 'WW.Attributes.Will' })
      }),

      // Stats
      stats: new fields.SchemaField({
        defense: new fields.SchemaField({
          total: makeIntField(),
          natural: makeIntField({ initial: 10 }),
          details: makeStrField()
        }),

        health: new fields.SchemaField({
          current: makeIntField(),
          normal: makeIntField(),
          lost: makeIntField()
        }),

        damage: new fields.SchemaField({
          raw: makeIntField(),
          value: makeIntField(),
          max: makeIntField()
        }),

        size: makeFloField({ initial: 1 }),

        speed: new fields.SchemaField({
          normal: makeIntField({ initial: 5 }),
          current: makeIntField()
        })
      }),

      // List Entries
      listEntries: new fields.SchemaField({
        descriptors: new fields.SetField( makeStrField() ),
        immunities: new fields.SetField( makeStrField() ),
        languages: new fields.SetField( makeStrField() ),
        movementTraits: new fields.SetField( makeStrField() ),
        senses: new fields.SetField( makeStrField() )
      })
    };

    return schema;
  }

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    
    this.stats.sizeFraction = game.weirdwizard.utils.nearestFraction(this.stats.size);
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The data parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(data) {
    // Migrate Level
    if (isNaN(data.stats?.level)) {

      switch (data.stats?.level) {
        case '⅛': data.stats.level = 0.125; break;
        case '¼': data.stats.level = 0.25; break;
        case '½': data.stats.level = 0.5; break;
      }
    }

    // Migrate Size
    if (isNaN(data.stats?.size)) {

      switch (data.stats?.size) {
        case '⅛': data.stats.size = 0.125; break;
        case '¼': data.stats.size = 0.25; break;
        case '½': data.stats.size = 0.5; break;
      }
    }

    // Migrate damage.raw to damage.value
    if ('stats' in data && !data.stats?.damage?.raw && data.stats?.damage?.value) data.stats.damage.raw = data.stats?.damage?.value;

    // Migrate immune to immunities
    if ('details' in data && data.details?.immune) data.details.immunities = data.details.immune;

    // Migrate legacy Traditions
    if (typeof data.details?.traditions === 'string') {
      const arr = data.details.traditions.split(",");
      data.details.traditions = arr.filter(s => s).map((s) => ({ name: s.trim() }));
    }

    // Migrate details to list entries
    const listKeys = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits'];
    
    if ('details' in data) {
      if (!data.listEntries) data.listEntries = [];

      for (const propKey in data.details) {
        const prop = data.details[propKey];
        
        // Check for the listKeys and if it's an array
        if (Object.hasOwn(data.details, propKey) && listKeys.includes(propKey)) {
          if (Array.isArray(prop) && prop.length) data.listEntries.push(prop);
        }
      }
    }
    
    // Migrate list entries: Object of objects to set of keys
    if ('listEntries' in data) {
      for (const [listKey, list] of Object.entries(data.listEntries)) {
        if (listKeys.includes(listKey) && foundry.utils.getType(list) === "Object") {
          // Migrate object to keys
          const settings = listKey === 'traditions' ? null : game.settings.get('weirdwizard', 'available' + capitalize(listKey, 1));
          const set = new Set();
          
          for (const [entryKey, entry] of Object.entries(list)) {
            const setting = settings?.[entryKey];
            
            if (setting || !entry?.name) set.add(entryKey); else set.add(entry.name);
          }
          
          data.listEntries[listKey] = set;
        }
      }
    }

    return data;
  }
}