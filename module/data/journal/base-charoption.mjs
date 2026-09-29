import { camelCase } from "../../helpers/utils.mjs";
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
    // Migrate immune to immunities
    if ('benefits' in data) {
      const listKeys = ['senses', 'descriptors', 'languages', 'immunities', 'movementTraits', 'traditions'];

      for (const b in data.benefits) {
        const benefit = data.benefits[b];
        
        for (const listKey in benefit) {
          const list = benefit[listKey];

          // Check for the listKeys and if it's an array
          if (benefit.hasOwnProperty(listKey) && listKeys.includes(listKey)) {
            if (Array.isArray(list)) {
              if (list.length) {
                const map = list.map(value => [value.name ? camelCase(value.name) : camelCase(value), value]);

                benefit[listKey] = Object.fromEntries(map);
              } else {
                benefit[listKey] = [];
              }
            }

            // Migrate object to keys
            if (benefit?.[listKey] && foundry.utils.getType(benefit?.[listKey]) === "Object") {
              benefit[listKey] = Object.keys(benefit?.[listKey]);
            }
          }
        }
      }
    }

    // Migrate description to a single string
    if (typeof data.description === 'object') data.description = data.description.value;

    return super.migrateData(data);
  }

}