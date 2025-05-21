import {
  AfflictionsSubmenu,
  DescriptorsSubmenu,
  ImmunitiesSubmenu,
  LanguagesSubmenu, 
  MovementTraitsSubmenu, 
  SensesSubmenu,
  WeaponTraitsSubmenu
} from "../apps/entry-settings-submenu.mjs";

export default function registerSystemSettings() {
  
  /* -------------------------------------------- */
  /* Basic System Settings                        */
  /* -------------------------------------------- */

  game.settings.register('weirdwizard', 'lastMigrationVersion', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: String,
    default: '0.0.0'
  });

  game.settings.register('weirdwizard', 'welcomeMessageShown', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: Boolean,
    default: false
  });

  game.settings.register('weirdwizard', 'damageBarReverse', {
    name: 'WW.Settings.DamageBarReverse',
    hint: 'WW.Settings.DamageBarReverseHint',
    scope: 'world',
    config: true,
    requiresReload: true,
    type: Boolean,
    default: false
  });

  game.settings.register('weirdwizard', 'skipActed', {
    name: 'WW.Settings.Combat.SkipActed',
    hint: 'WW.Settings.Combat.SkipActedHint',
    scope: 'world',
    config: true,
    requiresReload: false,
    type: Boolean,
    default: true
  });

  /* -------------------------------------------- */
  /* List Entry Settings                          */
  /* -------------------------------------------- */

 
  // Languages
  game.settings.register('weirdwizard', 'availableLanguages', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: Object,
    default: CONFIG.WW.DEFAULT_LANGUAGES
  });

  game.settings.registerMenu('weirdwizard', 'languages', {
    name: 'WW.Settings.Languages.Name',
    hint: 'WW.Settings.Languages.Hint',
    label: 'WW.Settings.Languages.Label', // The text label used in the button
    icon: "fa-solid fa-feather-pointed",  // A Font Awesome icon used in the submenu button
    type: LanguagesSubmenu,  // A FormApplication subclass which should be created
    restricted: true                      // Restrict this submenu to gamemaster only?
  });

  // Senses
  game.settings.register('weirdwizard', 'availableSenses', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: Object,
    default: CONFIG.WW.DEFAULT_SENSES
  });

  game.settings.registerMenu('weirdwizard', 'senses', {
    name: 'WW.Settings.Senses.Name',
    hint: 'WW.Settings.Senses.Hint',
    label: 'WW.Settings.Senses.Label', // The text label used in the button
    icon: "fa-solid fa-eye",  // A Font Awesome icon used in the submenu button
    type: SensesSubmenu,  // A FormApplication subclass which should be created
    restricted: true                      // Restrict this submenu to gamemaster only?
  });

  // Immunities
  game.settings.register('weirdwizard', 'availableImmunities', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: Object,
    default: CONFIG.WW.DEFAULT_IMMUNITIES
  });

  game.settings.registerMenu('weirdwizard', 'immunities', {
    name: 'WW.Settings.Immunities.Name',
    hint: 'WW.Settings.Immunities.Hint',
    label: 'WW.Settings.Immunities.Label', // The text label used in the button
    icon: "fa-solid fa-ban",  // A Font Awesome icon used in the submenu button
    type: ImmunitiesSubmenu,  // A FormApplication subclass which should be created
    restricted: true                      // Restrict this submenu to gamemaster only?
  });

  // Movement Traits
  game.settings.register('weirdwizard', 'availableMovementTraits', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: Object,
    default: CONFIG.WW.DEFAULT_MOVEMENT_TRAITS
  });

  game.settings.registerMenu('weirdwizard', 'movementTraits', {
    name: 'WW.Settings.MovementTraits.Name',
    hint: 'WW.Settings.MovementTraits.Hint',
    label: 'WW.Settings.MovementTraits.Label', // The text label used in the button
    icon: "fa-solid fa-arrow-trend-up",  // A Font Awesome icon used in the submenu button
    type: MovementTraitsSubmenu,  // A FormApplication subclass which should be created
    restricted: true                      // Restrict this submenu to gamemaster only?
  });

  // Descriptors
  game.settings.register('weirdwizard', 'availableDescriptors', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: Object,
    default: CONFIG.WW.DEFAULT_DESCRIPTORS
  });

  game.settings.registerMenu('weirdwizard', 'descriptors', {
    name: 'WW.Settings.Descriptors.Name',
    hint: 'WW.Settings.Descriptors.Hint',
    label: 'WW.Settings.Descriptors.Label', // The text label used in the button
    icon: "fa-solid fa-ghost",  // A Font Awesome icon used in the submenu button
    type: DescriptorsSubmenu,  // A FormApplication subclass which should be created
    restricted: true                      // Restrict this submenu to gamemaster only?
  });

  // Weapon Traits
  game.settings.register('weirdwizard', 'availableWeaponTraits', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: Object,
    default: CONFIG.WW.DEFAULT_WEAPON_TRAITS
  });

  game.settings.registerMenu('weirdwizard', 'weaponTraits', {
    name: 'WW.Settings.WeaponTraits.Name',
    hint: 'WW.Settings.WeaponTraits.Hint',
    label: 'WW.Settings.WeaponTraits.Label', // The text label used in the button
    icon: "fa-solid fa-wand-sparkles",  // A Font Awesome icon used in the submenu button
    type: WeaponTraitsSubmenu,  // A FormApplication subclass which should be created
    restricted: true                      // Restrict this submenu to gamemaster only?
  });

  // Afflictions
  game.settings.register('weirdwizard', 'availableAfflictions', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: Object,
    default: CONFIG.WW.DEFAULT_AFFLICTIONS
  });

  game.settings.registerMenu('weirdwizard', 'afflictions', {
    name: 'WW.Settings.Afflictions.Name',
    hint: 'WW.Settings.Afflictions.Hint',
    label: 'WW.Settings.Afflictions.Label', // The text label used in the button
    icon: "fa-solid fa-skull-crossbones",  // A Font Awesome icon used in the submenu button
    type: AfflictionsSubmenu,  // A FormApplication subclass which should be created
    restricted: true                      // Restrict this submenu to gamemaster only?
  });

  /* -------------------------------------------- */
  /* Integrated App Settings                      */
  /* -------------------------------------------- */

  // Register Sage Tools app
  game.settings.register('sagetools', 'visible', {
    name: 'Visible',
    scope: 'client',
    config: false,
    type: Boolean,
    default: true,
  });

  // Register Quest Calendar settings
  game.settings.register('questcalendar', 'visible', {
    name: 'Visible',
    scope: 'client',
    config: false,
    type: Boolean,
    default: true,
  });

  game.settings.register('questcalendar', 'preciseSkip', {
    name: 'QC.Settings.PreciseSkip',
    hint: 'QC.Settings.PreciseSkipHint',
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register('questcalendar', 'skipRef', {
    name: 'QC.Settings.SkipRef',
    hint: 'QC.Settings.SkipRefHint',
    scope: 'world',
    config: false,
    type: String,
    default: 'sunrise'
  });

  game.settings.register('questcalendar', 'sunrise', {
    name: 'QC.Settings.Sunrise',
    hint: 'QC.Settings.SunriseHint',
    scope: 'world',
    config: false,
    type: Number,
    default: '6'
  });

  game.settings.register('questcalendar', 'midday', {
    name: 'QC.Settings.Midday',
    hint: 'QC.Settings.MiddayHint',
    scope: 'world',
    config: false,
    type: Number,
    default: '12'
  });

  game.settings.register('questcalendar', 'sunset', {
    name: 'QC.Settings.Sunset',
    hint: 'QC.Settings.SunsetHint',
    scope: 'world',
    config: false,
    type: Number,
    default: '18'
  });

  game.settings.register('questcalendar', 'midnight', {
    name: 'QC.Settings.Midnight',
    hint: 'QC.Settings.MidnightHint',
    scope: 'world',
    config: false,
    type: Number,
    default: '0'
  });
  
}