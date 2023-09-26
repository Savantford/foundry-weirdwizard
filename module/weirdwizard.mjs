console.log('Initializing weirdwizard.mjs...')

// Import document classes.
import WWActor from './documents/actor.mjs';
import WWItem from './documents/item.mjs';
import WWActiveEffect from './active-effects/active-effect.mjs';
import WWCombat from './documents/combat.mjs';
//import WWTokenDocument from './documents/token-document.mjs';
import WWCombatTracker from './apps/combat-tracker.mjs';

// Import sheet classes.
import WWActorSheet from './sheets/actor-sheet.mjs';
import WWItemSheet from './sheets/item-sheet.mjs';

// Import helper/utility classes and constants.
import { WW } from './config.mjs';
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import WWActiveEffectConfig from './active-effects/active-effect-config.mjs';
import { WWAfflictions } from './active-effects/afflictions.mjs';
import { initChatListeners } from './chat/chat-listeners.mjs';
import registerWWTours from './tours/registration.mjs';

// Import canvas-related classes
import WWToken from './canvas/token.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  
  game.weirdwizard = {
    WWActor,
    WWItem
  };

  // Add custom constants for configuration.
  CONFIG.WW = WW;

  // Define custom Document classes
  CONFIG.Actor.documentClass = WWActor;
  CONFIG.Item.documentClass = WWItem;
  CONFIG.ActiveEffect.documentClass = WWActiveEffect;
  DocumentSheetConfig.registerSheet(ActiveEffect, "weirdwizard", WWActiveEffectConfig, {makeDefault: true})
  CONFIG.Combat.documentClass = WWCombat;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('weirdwizard', WWActorSheet, { makeDefault: true });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('weirdwizard', WWItemSheet, { makeDefault: true });

  // Define custom Object classes
  CONFIG.Token.objectClass = WWToken;

  // Define custom Combat Tracker
  CONFIG.ui.combat = WWCombatTracker;
  
  // Disable legacy pre-V11 behavior of item effects being stored on actor.effects. Use actor.appliedEffects instead for all effects
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register system settings
  game.settings.register('weirdwizard', 'skipActed', {
    name: "WW.Combat.Skip",
    hint: "WW.Combat.SkipHint",
    scope: "world",
    config: true,
    requiresReload: false,
    type: Boolean,
    default: true
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

  // Set active effect keys-labels to be used in Active Effects Config app
  WWActiveEffectConfig.initializeChangeKeys();
  WWActiveEffectConfig.initializeChangePriorities();
  
});

Hooks.on('renderChatLog', (app, html, _data) => initChatListeners(html))

Hooks.on("renderChatMessage", (app, html) => {

  // Remove html elements meant for owners or non-owners only
  if (!game.user.isOwner) {
    html.find(".owner-only").remove();
  } else {
    html.find(".non-owner-only").remove();
  }

})

console.log('weirdwizard.mjs loaded.')