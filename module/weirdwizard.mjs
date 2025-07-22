console.log('SotWW | Initializing weirdwizard.mjs...')

// Import document classes.
import WWActor from './documents/actor.mjs';
import WWItem from './documents/item.mjs';
import WWActiveEffect from './documents/active-effect.mjs';
import WWJournalPage from './documents/journal-page.mjs';
import WWCombat from './documents/combat.mjs';
import WWCombatant from './documents/combatant.mjs';
import WWChatMessage from './documents/chat-message.mjs';

// Import data models
import CharacterData from './data/actors/character.mjs';
import NpcData from './data/actors/npc.mjs';
import EquipmentData from './data/items/equipment.mjs';
import TalentData from './data/items/talent.mjs';
import SpellData from './data/items/spell.mjs';
import AncestryData from './data/journal/ancestry.mjs';
import ProfessionData from './data/journal/profession.mjs';
import PathData from './data/journal/path.mjs';
import TraditionData from './data/journal/tradition.mjs';
import { BaseEffectModel } from './data/effects/base-effect.mjs';
import BenefitEffectModel from './data/effects/benefit-effect.mjs';

// Import sheet classes.
import WWCharacterSheet from './sheets/actors/character-sheet.mjs';
import WWNpcSheet from './sheets/actors/npc-sheet.mjs';
import WWEquipmentSheet from './sheets/items/equipment-sheet.mjs';
import WWTalentSheet from './sheets/items/talent-sheet.mjs';
import WWSpellSheet from './sheets/items/spell-sheet.mjs';
import WWAncestrySheet from './sheets/journal/ancestry-sheet.mjs';
import WWPathSheet from './sheets/journal/path-sheet.mjs';
import WWProfessionSheet from './sheets/journal/profession-sheet.mjs';
import WWTraditionSheet from './sheets/journal/tradition-sheet.mjs';
import WWActiveEffectConfig from './sheets/configs/active-effect-config.mjs';

// Import sidebar related classes.
import WWCombatTracker from './sidebar/combat-tracker.mjs';
import { initChatListeners } from './sidebar/chat-listeners.mjs';

// Import UI apps.
import WWRoll from './dice/roll.mjs';
import SageTools from './ui/sage-tools.mjs';
import QuestCalendar from './ui/quest-calendar.mjs';

// Import canvas-related classes
import WWToken from './canvas/token.mjs';

// Import helper/utility classes and constants.
import { WW } from './config.mjs';
import registerSystemSettings from './helpers/system-settings.mjs'
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { WWAfflictions } from './helpers/afflictions.mjs';
import { expireFromTokens } from './helpers/effect-actions.mjs';
import { initGlobalListeners } from './helpers/global-listeners.mjs';
import addCustomEnrichers from './helpers/enrichers.mjs';
import registerWWTours from './tours/registration.mjs';
import { Utils, handleWelcomeMessage } from './helpers/utils.mjs';

// Import migrations
import {
  fullMigration,
  effectOverhaul,
  strToCharOptions,
  pathsOfJournaling, 
  improvedListEntries
} from './helpers/migrations.mjs';

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
  CONFIG.JournalEntryPage.documentClass = WWJournalPage;
  CONFIG.ActiveEffect.documentClass = WWActiveEffect;
  CONFIG.Combat.documentClass = WWCombat;
  CONFIG.Combatant.documentClass = WWCombatant;
  CONFIG.ChatMessage.documentClass = WWChatMessage;

  // Register Actor and Item data models
  CONFIG.Actor.dataModels.Character = CharacterData;
  CONFIG.Actor.dataModels.NPC = NpcData;
  CONFIG.Item.dataModels.Equipment = EquipmentData;
  CONFIG.Item.dataModels['Trait or Talent'] = TalentData;
  CONFIG.Item.dataModels.Spell = SpellData;

  // Active Effect data models
  CONFIG.ActiveEffect.dataModels.base = BaseEffectModel;
  CONFIG.ActiveEffect.dataModels.benefit = BenefitEffectModel;

  // Journal Entry Page data models
  CONFIG.JournalEntryPage.dataModels.ancestry = AncestryData;
  CONFIG.JournalEntryPage.dataModels.path = PathData;
  CONFIG.JournalEntryPage.dataModels.profession = ProfessionData;
  CONFIG.JournalEntryPage.dataModels.tradition = TraditionData;
  
  // Register actor Sheet classes
  const Actors = foundry.documents.collections.Actors;

  Actors.registerSheet('weirdwizard', WWCharacterSheet, {
    types: ['Character'],
    makeDefault: true,
    label: 'WW.System.Sheet.Character'
  });
  Actors.registerSheet('weirdwizard', WWNpcSheet, {
    types: ['NPC'],
    makeDefault: true,
    label: 'WW.System.Sheet.NPC'
  });

  // Register item Sheet classes
  const Items = foundry.documents.collections.Items;

  Items.registerSheet('weirdwizard', WWEquipmentSheet, {
    types: ['Equipment'],
    makeDefault: true,
    label: 'WW.System.Sheet.Equipment'
  });
  Items.registerSheet('weirdwizard', WWTalentSheet, {
    types: ['Trait or Talent'],
    makeDefault: true,
    label: 'WW.System.Sheet.Talent'
  });
  Items.registerSheet('weirdwizard', WWSpellSheet, {
    types: ['Spell'],
    makeDefault: true,
    label: 'WW.System.Sheet.Spell'
  });

  // Register Journal Page Sheet classes
  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;

  DocumentSheetConfig.registerSheet(JournalEntryPage, 'weirdwizard', WWAncestrySheet, {
    types: ['ancestry'],
    makeDefault: true,
    label: 'WW.System.Sheet.Ancestry'
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, 'weirdwizard', WWPathSheet, {
    types: ['path'],
    makeDefault: true,
    label: 'WW.System.Sheet.Path'
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, 'weirdwizard', WWProfessionSheet, {
    types: ['profession'],
    makeDefault: true,
    label: 'WW.System.Sheet.Profession'
  });
  DocumentSheetConfig.registerSheet(JournalEntryPage, 'weirdwizard', WWTraditionSheet, {
    types: ['tradition'],
    makeDefault: true,
    label: 'WW.System.Sheet.Tradition'
  });
  
  // Register custom document config sheets
  DocumentSheetConfig.registerSheet(ActiveEffect, 'weirdwizard', WWActiveEffectConfig, {makeDefault: true});
  //DocumentSheetConfig.registerSheet(Folder, 'weirdwizard', WWFolderConfig, {makeDefault: true}); - does not work, maybe in v13. see renderFolderConfig hook

  // Register custom Combat Tracker
  CONFIG.ui.combat = WWCombatTracker;
  
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
  //game.system.primaryTokenAttribute = 'system.stats.damage'; - no longer needed?

  // Register custom Roll subclass
  CONFIG.Dice.rolls.unshift(WWRoll);

  // Set active effect keys-labels to be used in Active Effects Config app
  WWActiveEffectConfig.initializeChangeKeys();
  WWActiveEffectConfig.initializeChangeLabels();

  // Register system settings
  registerSystemSettings();

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
    improvedListEntries: improvedListEntries,
    pathsOfJournaling: pathsOfJournaling,
    strToCharOptions: strToCharOptions,
    effectOverhaul: effectOverhaul
  }

  // Check and run data migrations if needed
  fullMigration();

  handleWelcomeMessage();

  // Initialize global listeners
  initGlobalListeners();
});

/* -------------------------------------------- */
/*  Setup Hook                                  */
/* -------------------------------------------- */

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
*/

Hooks.once('setup', function () {

  // Get afflictions
  const effects = WWAfflictions.buildAll();

  // Add invisible and dead status to the list of effects so that
  effects.push(CONFIG.statusEffects.find(e => e.id === 'invisible'));
  effects.push(CONFIG.statusEffects.find(e => e.id === 'dead'));

  // Assign Afflictions to token HUD
  CONFIG.statusEffects = effects;

  // Assign blinded as the BLIND special status effect
  CONFIG.specialStatusEffects.BLIND = 'blinded';
  
});

/* -------------------------------------------- */
/*  Chat Hooks                                  */
/* -------------------------------------------- */

Hooks.on('renderChatMessageHTML', (message, html, context) => {
  console.log(message)
  // Add custom enrichers
  //addCustomEnrichers();

  // Remove html elements meant for owners or non-owners only
  if (!game.user.isOwner) {
    html.querySelector('.owner-only')?.remove();
  } else {
    html.querySelector('.non-owner-only')?.remove();
  }

  // Initialize chat message listeners
  initChatListeners(html, message, context);
});

/* -------------------------------------------- */
/*  Rendering Hooks                             */
/* -------------------------------------------- */

Hooks.on('renderSettingsConfig', (app, html, data) => {
  // Add sections to settings dialog by iterating all *our* settings, stripping the module/system ID,
  // then checking whether they have the format '<section>.setting'.
  // If so, we check whether the section matches the last section we saw;
  // otherwise, this is a new section and we insert a new section header.
  let lastSectionID = '';

  const wwSettings = html.find(`.tab[data-tab=system] .form-group`);

  wwSettings.each((i, value) => {
    const setting = (value.getAttribute('data-setting-id') || '').replace(/^(weirdwizard\.)/, '');
    if (!setting || setting.indexOf('.') < 1) {
      return;
    }

    const section = setting.split('.')[0];

    if (section !== lastSectionID) {
      const key = 'WW.Settings.Section.' + section;
      const hintKey = key + 'Hint';
      let hint = game.i18n.localize(hintKey);

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

// Pretty up the system version display in the settings sidebar.
Hooks.on('renderSettings', (app, html) => {
  const info = html.querySelector('.info');
  const pip = info.querySelector('.info .system .notification-pip');
  info.querySelector('.system').remove();

  // System Info Badge
  const badge = document.createElement('section');
  badge.classList.add('info', 'weirdwizard', 'flexcol');
  badge.innerHTML = `
    <h4 class="divider">${game.i18n.localize('WORLD.FIELDS.system.label')}</h4>

    <img src="systems/weirdwizard/assets/ui/sotww-logo.png" alt="${game.system.title}" data-tooltip="${game.system.title}">

    <p class="subtitle version">Version ${game.system.version}</p>

    <span class="system-links" style="text-align: center;">
      <a href="https://github.com/Savantford/foundry-weirdwizard/releases/${game.system.version}" target="_blank">Patch Notes</a> •
      <a href="https://github.com/Savantford/foundry-weirdwizard/issues" target="_blank">Issues</a> •
      <a href="https://discord.gg/X5XustKpe4" target="_blank">Discord</a>
    </span>
  `;

  if (pip) badge.querySelector('.version').insertAdjacentElement('beforeend', pip);

  info.insertAdjacentElement('afterend', badge);
});

/**
 * A hook event that fires when the ActiveEffectConfig application is rendered
 * @param {ActiveEffectConfig} app      The Application instance being rendered
 * @param {JQuery<HTMLElement>} jquery  The inner HTML of the document that will be displayed and may be modified
 * @param {Record<string, any>} context The object of data used when rendering the application
 */
Hooks.on("renderFolderConfig", (app, [html], context) => {
  const folder = app.document;

  const description = folder.getFlag('weirdwizard', 'description') ?? '';

  // Create HTML string, inject it, then set app's position
  const htmlStr = `<prose-mirror class="editor prosemirror"
    name="flags.weirdwizard.description" data-document-UUID="${folder.uuid}" value="${description}"
    toggled=true compact=true>${description}</prose-mirror>`;
  
  html.querySelector('button[type="submit"]').insertAdjacentHTML('beforeBegin', htmlStr);
  
  // Add weirdwizard class to html and resize app's height
  html.classList.add('weirdwizard');
  app.setPosition({ width: 435, height: 'auto' });

});

/* -------------------------------------------- */
/*  Misc Hooks                                  */
/* -------------------------------------------- */

Hooks.on('getSceneControlButtons', (controls) => {

  // Add Sage Tools button
  controls['tokens'].tools['sage-tools'] = {
    name: 'sage-tools',
    title: 'Toggle Sage Tools',
    icon: 'fa-solid fa-wand-sparkles',
    visible: game.user.isGM,
    toggle: true,
    onClick: () => SageTools.toggleVis('toggle')
  };
  
  // Add Quest Calendar button
  controls['notes'].tools['quest-calendar'] = {
    name: 'quest-calendar',
    title: 'Toggle Quest Calendar',
    icon: 'fa-solid fa-calendar-clock',
    visible: true,
    toggle: true,
    onClick: () => QuestCalendar.toggleVis('toggle')
  };
  
});

// On game world time change
Hooks.on('updateWorldTime', (worldTime, dt, options, userId) => {
  expireFromTokens();

  if (ui.questcalendar?.rendered) ui.questcalendar.render();
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

console.log('SotWW | Done initializating weirdwizard.mjs.')