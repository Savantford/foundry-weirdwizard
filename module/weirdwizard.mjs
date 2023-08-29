console.log('Initializing weirdwizard.mjs...')
// Import document classes.
import { WeirdWizardActor } from './documents/actor.mjs';
import { WeirdWizardItem } from './documents/item.mjs';
//import { WeirdWizardToken } from './documents/token.mjs';
// Import sheet classes.
import { WeirdWizardActorSheet } from './sheets/actor-sheet.mjs';
import { WeirdWizardItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { WW } from './config.mjs';
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { WWAfflictions } from './active-effects/afflictions.mjs';
import { WWActiveEffectConfig } from './active-effects/effects-config.mjs';
import { initChatListeners } from './chat/chat-listeners.mjs';
// Import canvas-related classes
import { WWToken } from './canvas/token.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  
  game.weirdwizard = {
    WeirdWizardActor,
    WeirdWizardItem
  };

  // Add custom constants for configuration.
  CONFIG.WW = WW;

  // Define custom Document classes
  CONFIG.Actor.documentClass = WeirdWizardActor;
  CONFIG.Item.documentClass = WeirdWizardItem;
  DocumentSheetConfig.registerSheet(ActiveEffect, "weirdwizard", WWActiveEffectConfig, {makeDefault: true})

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('weirdwizard', WeirdWizardActorSheet, { makeDefault: true });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('weirdwizardplate', WeirdWizardItemSheet, { makeDefault: true });

  // Define custom Object classes
  CONFIG.Token.objectClass = WWToken;

  // Disable legacy pre-V11 behavior of item effects being stored on actor.effects. Use actor.appliedEffects instead for all effects
  CONFIG.ActiveEffect.legacyTransfer = false;

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

// Rollable buttons on attribute rolls.
/*Hooks.on('renderChatMessage', (chatMessage, [html], messageData) => {
  html.querySelector('.my-button').addEventListener('click', (event) => console.log('button clicked'))
})*/

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Include steps that need to happen after Foundry has fully loaded here.
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
  WWActiveEffectConfig.initializeChangeKeys()
  
});

Hooks.on('renderChatLog', (app, html, _data) => initChatListeners(html))

console.log('weirdwizard.mjs loaded.')