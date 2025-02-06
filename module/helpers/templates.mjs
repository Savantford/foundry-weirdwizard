/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Item partials
    "systems/weirdwizard/templates/items/parts/Equipment-details.hbs",
    "systems/weirdwizard/templates/items/parts/weapon-details.hbs",
    "systems/weirdwizard/templates/items/parts/Talent-details.hbs",
    "systems/weirdwizard/templates/items/parts/Spell-details.hbs",
    "systems/weirdwizard/templates/items/parts/item-settings.hbs",
    "systems/weirdwizard/templates/items/parts/item-effects.hbs",

    // Tabs
    "systems/weirdwizard/templates/sidebar/dice-tooltip.hbs",
    "systems/weirdwizard/templates/sidebar/combatant.hbs"
  ]);
};
