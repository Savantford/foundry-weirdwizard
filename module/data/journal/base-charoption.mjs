import { capitalize } from "../../helpers/utils.mjs";
import { makeHtmlField } from "../field-presets.mjs";

export default class BaseCharOptionModel extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {
      description: makeHtmlField({ initial: `<p>${_loc("WW.System.Sheet.NoDescription")}</p>` })
    };

    return schema;
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * The source parameter is either original data retrieved from disk or provided by an update operation.
   * @inheritDoc
   */
  static migrateData(data) {
    // Migrate description to a single string
    if (typeof data.description === 'object') data.description = data.description.value;
    
    // Migrate Character Options object to array
    if ('benefits' in data) {
      const listKeys = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits', 'traditions'];

      for (const b in data.benefits) {
        const benefit = data.benefits[b];
        
        for (const listKey in benefit) {
          const list = benefit[listKey];

          // Check for the listKeys
          if (benefit.hasOwnProperty(listKey) && listKeys.includes(listKey)) {
            // Migrate object to keys
            if (foundry.utils.getType(benefit?.[listKey]) === "Object") {
              const settings = listKey === 'traditions' ? null : game.settings.get('weirdwizard', 'available' + capitalize(listKey, 1));
              const set = new Set();

              for (const [entryKey, entry] of Object.entries(benefit[listKey])) {
                const setting = settings?.[entryKey];
                
                if (setting || !entry.name) set.add(entryKey); else set.add(entry.name);
              }
              
              benefit[listKey] = set;
            }
          }
        }
      }
    }
    
    return super.migrateData(data);
  }
}