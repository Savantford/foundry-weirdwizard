/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return foundry.applications.handlebars.loadTemplates([

    // Tabs (remove post V13)
    "systems/weirdwizard/templates/sidebar/dice-tooltip.hbs",
    "systems/weirdwizard/templates/sidebar/combatant.hbs",

    // Journal Entry partials (remove post V13)
    "systems/weirdwizard/templates/journal/list-entry.hbs"
  ]);
};
