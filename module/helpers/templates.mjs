/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials
    // Character
    "systems/weirdwizard/templates/actors/parts/Character-summary.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-stats.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-details.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-equipment.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-talents.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-spells.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-effects.hbs",

    // NPC
    "systems/weirdwizard/templates/actors/parts/NPC-summary.hbs",
    "systems/weirdwizard/templates/actors/parts/NPC-stats.hbs",

    // Item partials
    "systems/weirdwizard/templates/items/parts/item-settings.hbs",
    "systems/weirdwizard/templates/items/parts/item-effects.hbs"

  ]);
};
