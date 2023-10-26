import WWActorSheet from './actor-sheet.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {WWActorSheet}
*/

export default class WWCharacterSheet extends WWActorSheet {
  
  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'actor'],
      width: 860,
      height: 450,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'summary' }]
    });
  }
}