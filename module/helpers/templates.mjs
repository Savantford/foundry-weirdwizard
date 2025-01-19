/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([
    // Actor partials
    "systems/weirdwizard/templates/actors/parts/portrait.hbs",

    // Character
    "systems/weirdwizard/templates/actors/parts/Character-summary.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-summary-item.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-summary-weapon.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-details.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-equipment.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-talents.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-spells.hbs",
    "systems/weirdwizard/templates/actors/parts/Character-effects.hbs",

    // NPC
    "systems/weirdwizard/templates/actors/parts/NPC-summary.hbs",
    "systems/weirdwizard/templates/actors/parts/NPC-summary-item.hbs",
    "systems/weirdwizard/templates/actors/parts/NPC-summary-weapon.hbs",

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
