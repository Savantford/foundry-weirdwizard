import WWActorSheet from './actor-sheet.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {WWActorSheet}
*/

export default class WWCharacterSheet extends WWActorSheet {
  
  /** @override */
  static get defaultOptions() {

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'actor', 'character'],
      width: 850,
      height: 550,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'summary' }]
    });
  }

}