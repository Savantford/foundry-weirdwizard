import WWActorSheet from './actor-sheet.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {WWActorSheet}
*/

export default class WWNpcSheet extends WWActorSheet {
  
  /** @override */
  static get defaultOptions() {

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'actor', 'npc'],
      width: 600,
      height: 500,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'summary' }]
    });
  }
  
}