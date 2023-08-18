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
import { Global } from './helpers/utils.mjs';
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { WWAfflictions } from './active-effects/afflictions.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  
  game.weirdwizard = {
    WeirdWizardActor,
    WeirdWizardItem,
    //WeirdWizardToken
  };

  // Add custom constants for configuration.
  CONFIG.WW = WW;

  // Add global functions to configuration.
  CONFIG.Global = Global;

  /**
   * Set an initiative formula for the system
   * @type {String}
  */
  
  CONFIG.Combat.initiative = {
    formula: '1d20 + @abilities.dex.mod',
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = WeirdWizardActor;
  CONFIG.Item.documentClass = WeirdWizardItem;
  //CONFIG.Token.documentClass = WeirdWizardToken;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('weirdwizard', WeirdWizardActorSheet, { makeDefault: true });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('weirdwizardplate', WeirdWizardItemSheet, { makeDefault: true });

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

  CONFIG.statusEffects = effects;

  // Set active effect keys-labels
  //WWActiveEffectConfig.initializeChangeKeys();
});

console.log('weirdwizard.mjs loaded.')