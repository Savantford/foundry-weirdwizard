console.log('Initializing weirdwizard.mjs...')

// Import document classes.
import WWActor from './documents/actor.mjs';
import WWItem from './documents/item.mjs';
import WWActiveEffect from './documents/active-effect.mjs';
import WWCombat from './documents/combat.mjs';
import WWCombatant from './documents/combatant.mjs';
import WWChatMessage from './documents/chat-message.mjs';

// Import sheet classes.
import WWCharacterSheet from './sheets/character-sheet.mjs';
import WWNpcSheet from './sheets/npc-sheet.mjs';
import WWItemSheet from './sheets/item-sheet.mjs';
import WWCharOptionSheet from './sheets/charoption-sheet.mjs';

// Import apps
import WWActiveEffectConfig from './apps/active-effect-config.mjs';
import WWCombatTracker from './apps/combat-tracker.mjs';
import WWRoll from './dice/roll.mjs';
import { QuestCalendar } from './ui/quest-calendar.mjs'

// Import canvas-related classes
import WWToken from './canvas/token.mjs';

// Import data models
import CharacterData from './data/actors/character.mjs';
import NpcData from './data/actors/npc.mjs';
import EquipmentData from './data/items/equipment.mjs';
import TalentData from './data/items/talent.mjs';
import SpellData from './data/items/spell.mjs';
import AncestryData from './data/items/ancestry.mjs';
import ProfessionData from './data/items/profession.mjs';
import PathData from './data/items/path.mjs';

// Import helper/utility classes and constants.
import { WW } from './config.mjs';
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { WWAfflictions } from './helpers/afflictions.mjs';
import { expireFromTokens } from './helpers/effects.mjs';
import { initChatListeners } from './chat/chat-listeners.mjs';
import addCustomEnrichers from './helpers/enrichers.mjs';
import registerWWTours from './tours/registration.mjs';
import { fullMigration, charOptions } from './helpers/migrations.mjs';
import { Utils } from './helpers/utils.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  
  game.weirdwizard = {
    WWActor,
    WWItem,
    utils: Utils
  };

  // Add custom constants for configuration.
  CONFIG.WW = WW;

  // Define custom Document classes
  CONFIG.Actor.documentClass = WWActor;
  CONFIG.Item.documentClass = WWItem;
  CONFIG.ActiveEffect.documentClass = WWActiveEffect;
  CONFIG.Combat.documentClass = WWCombat;
  CONFIG.Combatant.documentClass = WWCombatant;
  CONFIG.ChatMessage.documentClass = WWChatMessage;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('weirdwizard', WWCharacterSheet, {
    types: ['Character'],
    makeDefault: true,
    label: 'WW.SheetClass.Character'
  });
  Actors.registerSheet('weirdwizard', WWNpcSheet, {
    types: ['NPC'],
    makeDefault: true,
    label: 'WW.SheetClass.NPC'
  });

  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('weirdwizard', WWItemSheet, { makeDefault: true });
  Items.registerSheet('weirdwizard', WWCharOptionSheet, {
    types: ['Ancestry', 'Profession', 'Path'],
    makeDefault: true
  });

  DocumentSheetConfig.registerSheet(ActiveEffect, 'weirdwizard', WWActiveEffectConfig, {makeDefault: true})

  // Register data models
  CONFIG.Actor.dataModels.Character = CharacterData;
  CONFIG.Actor.dataModels.NPC = NpcData;
  CONFIG.Item.dataModels.Equipment = EquipmentData;
  CONFIG.Item.dataModels['Trait or Talent'] = TalentData;
  CONFIG.Item.dataModels.Spell = SpellData;
  CONFIG.Item.dataModels.Ancestry = AncestryData;
  CONFIG.Item.dataModels.Profession = ProfessionData;
  CONFIG.Item.dataModels.Path = PathData;

  // Register custom Combat Tracker
  CONFIG.ui.combat = WWCombatTracker;

  // Register custom templates
  CONFIG.ChatMessage.template = 'systems/weirdwizard/templates/chat/chat-message.hbs';
  
  // Disable legacy pre-V11 behavior of item effects being stored on actor.effects. Use actor.appliedEffects instead for all effects
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register custom Object classes (placeables)
  CONFIG.Token.objectClass = WWToken;

  // Define token resources/bars
  CONFIG.Actor.trackableAttributes = {
    Character: {
      bar: ['stats.damage'],
      value: ['stats.defense.total']
    },
    NPC: {
      bar: ['stats.damage'],
      value: ['stats.defense.total']
    }
  };

  // Register Primary Token Attribute
  //game.system.primaryTokenAttribute = 'system.stats.damage';

  // Register custom Roll subclass
  CONFIG.Dice.rolls.unshift(WWRoll);

  // Set active effect keys-labels to be used in Active Effects Config app
  WWActiveEffectConfig.initializeChangeKeys();
  WWActiveEffectConfig.initializeChangeLabels();
  //WWActiveEffectConfig.initializeChangePriorities(); // No longer needed

  // Register system settings
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

  game.settings.register('weirdwizard', 'lastMigrationVersion', {
    scope: 'world',
    config: false,
    requiresReload: false,
    type: String,
    default: '0.0.0'
  });

  // Register Quest Calendar integrated module
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
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register('questcalendar', 'skipRef', {
    name: 'QC.Settings.SkipRef',
    hint: 'QC.Settings.SkipRefHint',
    scope: 'world',
    config: true,
    type: String,
    default: 'sunrise'
  });

  game.settings.register('questcalendar', 'sunrise', {
    name: 'QC.Settings.Sunrise',
    hint: 'QC.Settings.SunriseHint',
    scope: 'world',
    config: true,
    type: Number,
    default: '6'
  });

  game.settings.register('questcalendar', 'midday', {
    name: 'QC.Settings.Midday',
    hint: 'QC.Settings.MiddayHint',
    scope: 'world',
    config: true,
    type: Number,
    default: '12'
  });

  game.settings.register('questcalendar', 'sunset', {
    name: 'QC.Settings.Sunset',
    hint: 'QC.Settings.SunsetHint',
    scope: 'world',
    config: true,
    type: Number,
    default: '18'
  });

  game.settings.register('questcalendar', 'midnight', {
    name: 'QC.Settings.Midnight',
    hint: 'QC.Settings.MidnightHint',
    scope: 'world',
    config: true,
    type: Number,
    default: '0'
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Include steps that need to happen after Foundry has fully loaded here.

  // Register Tours
  registerWWTours();

  // Append data migration function to game.system.migrations so it can be used for manual migrations
  game.system.migrations = {
    fullMigration: fullMigration,
    migrateCharOptions: charOptions
    //migratePack // Specific pack as input
    //migratePacks // All packs
  }

  // Check and run data migrations if needed
  fullMigration();

});

/* -------------------------------------------- */
/*  Setup Hook                                  */
/* -------------------------------------------- */

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
*/

Hooks.once('setup', function () {
  // Localize CONFIG objects once up-front
  /*const toLocalize = ['attributes'];
  for (const o of toLocalize) {
    CONFIG.WW[o] = Object.entries(CONFIG.WW[o]).reduce((obj, e) => {
      obj[e[0]] = game.i18n.localize(e[1]);
      return obj
    }, {});
  }*/

  const effects = WWAfflictions.buildAll();

  // Add the default status icons if the setting is not on
  /*if (!game.settings.get('weirdwizard', 'statusIcons')) {
    for (const effect of CONFIG.statusEffects) {
      effects.push({
        id: effect.id,
        name: effect.name,
        icon: effect.icon,
      });
    }
  }
  // Regardless of the setting, add the 'invisible' status so that actors can turn invisible
  else {
    effects.push(CONFIG.statusEffects.find(e => e.id === 'invisible'));
  }*/

  // Assign Afflictions to token HUD
  CONFIG.statusEffects = effects;
  
});

/* -------------------------------------------- */
/*  Chat Hooks                                  */
/* -------------------------------------------- */

Hooks.on('renderChatMessage', (app, html) => {

  // Add custom enrichers
  addCustomEnrichers();

  // Remove html elements meant for owners or non-owners only
  if (!game.user.isOwner) {
    html.find('.owner-only').remove();
  } else {
    html.find('.non-owner-only').remove();
  }

  // Initialize chat message listeners
  initChatListeners(html, app);
});

/* -------------------------------------------- */
/*  Misc Hooks                                  */
/* -------------------------------------------- */

Hooks.on('getSceneControlButtons', (array, html) => {
  const notes = array.find(a => a.name === 'notes');
  
  // Render the class page.
  notes.tools.push({
    name: 'quest-calendar',
    title: 'Toggle Quest Calendar',
    icon: 'fa-solid fa-calendar-clock',
    button: true,
    visible: true,
    toggle: true,
    onClick: () => QuestCalendar.toggleVis('toggle')
  });
});

// On game world time change
Hooks.on('updateWorldTime', (worldTime, dt, options, userId) => {
  expireFromTokens();

  if (ui.questcalendar?.rendered) ui.questcalendar.render();
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
  // Add sections to settings dialog by iterating all *our* settings, stripping the module/system ID,
  // then checking whether they have the format '<section>.setting'.
  // If so, we check whether the section matches the last section we saw;
  // otherwise, this is a new section and we insert a new section header.
  let lastSectionID = '';
  const wwSettings = html.find(`.tab[data-tab=system] .form-group`)
  wwSettings.each((i, value) => {
    const setting = (value.getAttribute('data-setting-id') || '').replace(/^(weirdwizard\.)/, '');
    if (!setting || setting.indexOf('.') < 1) {
      return;
    }
    const section = setting.split('.')[0];
    if (section !== lastSectionID) {
      const key = 'WW.Settings.Section.' + section;
      const hintKey = key + 'Hint';
      let hint = game.i18n.localize(hintKey)
      if (hint !== hintKey) {
        hint = `<p class="notes">${hint}</p>`;
      } else {
        hint = '';
      }
      wwSettings.eq(i).before(`<h3>${game.i18n.localize(key)}</h3>${hint}`);
      lastSectionID = section;
    }
  });
});

/* -------------------------------------------- */
/*  External Module Hooks                       */
/* -------------------------------------------- */

Hooks.on('diceSoNiceReady', (dice3d) => {
  
  // DSN: Disable simultaneous rolls
  if (game.settings.get('dice-so-nice','enabledSimultaneousRollForMessage')) game.settings.set('dice-so-nice','enabledSimultaneousRollForMessage',false);

  // Disable DsN's automatic parsing of inline rolls - let users enable it
  /*if (isNewerVersion(game.modules.get('dice-so-nice')?.version, "4.1.1")
    && !game.settings.get("archmage", "DsNInlineOverride")) {
    game.settings.set("dice-so-nice", "animateInlineRoll", false);
    game.settings.set("archmage", "DsNInlineOverride", true);
  }*/

});

console.log('weirdwizard.mjs loaded.')