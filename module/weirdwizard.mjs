console.log('Initializing weirdwizard.mjs...')
// Import document classes.
import { WeirdWizardActor } from "./documents/actor.mjs";
import { WeirdWizardItem } from "./documents/item.mjs";
// Import sheet classes.
import { WeirdWizardActorSheet } from "./sheets/actor-sheet.mjs";
import { WeirdWizardItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
//import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { WEIRDWIZARD } from "./helpers/config.mjs";
import { Global } from './helpers/global.mjs'

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  
  game.weirdwizard = {
    WeirdWizardActor,
    WeirdWizardItem,
  };

  // Add custom constants for configuration.
  CONFIG.WEIRDWIZARD = WEIRDWIZARD;

  // Add global functions to configuration.
  CONFIG.Global = Global;

  /**
   * Set an initiative formula for the system
   * @type {String}
  */
  
  CONFIG.Combat.initiative = {
    formula: "1d20 + @abilities.dex.mod",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = WeirdWizardActor;
  CONFIG.Item.documentClass = WeirdWizardItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("weirdwizard", WeirdWizardActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("weirdwizardplate", WeirdWizardItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  //return preloadHandlebarsTemplates();
});

// Rollable buttons on attribute rolls.
/*Hooks.on('renderChatMessage', (chatMessage, [html], messageData) => {
  html.querySelector('.my-button').addEventListener('click', (event) => console.log("button clicked"))
})*/

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Include steps that need to happen after Foundry has fully loaded here.
});

console.log('weirdwizard.mjs loaded.')