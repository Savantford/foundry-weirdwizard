/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Tabs
    "systems/weirdwizard/templates/sidebar/dice-tooltip.hbs",
    "systems/weirdwizard/templates/sidebar/combatant.hbs",

    // Journal Entry partials (remove in V13)
    "systems/weirdwizard/templates/journal/list-entry.hbs"
  ]);
};
