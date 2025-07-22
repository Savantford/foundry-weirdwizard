/**
 * The Application responsible for configuring the CombatTracker and its contents.
 * @extends {FormApplication}
 */
export default class WWCombatTrackerConfig extends foundry.applications.apps.CombatTrackerConfig {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "combat-config",
      title: game.i18n.localize("COMBAT.Settings"),
      classes: ["sheet", "combat-sheet"],
      template: "systems/weirdwizard/templates/configs/combat-config.hbs",
      width: 420
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options={}) {
    const attributes = TokenDocument.implementation.getTrackedAttributes();
    attributes.bar.forEach(a => a.push("value"));
    const combatThemeSetting = game.settings.settings.get("core.combatTheme");
    
    return {
      canConfigure: game.user.can("SETTINGS_MODIFY"),
      settings: game.settings.get("core", Combat.CONFIG_SETTING),
      attributeChoices: TokenDocument.implementation.getTrackedAttributeChoices(attributes),
      combatTheme: combatThemeSetting,
      selectedTheme: game.settings.get("core", "combatTheme"),
      user: game.user,
      skipActed: game.settings.get('weirdwizard', 'skipActed')
    };
  }

  /* -------------------------------------------- */

  /** @override */  
  async _updateObject(event, formData) {
    game.settings.set("core", "combatTheme", formData["core.combatTheme"]);

    return game.settings.set("core", Combat.CONFIG_SETTING, {
      resource: formData.resource,
      skipDefeated: formData.skipDefeated
    }), game.settings.set('weirdwizard', 'skipActed', formData.skipActed);
  }
  
}
