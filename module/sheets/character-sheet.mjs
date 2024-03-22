import WWActorSheet from './actor-sheet.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {WWActorSheet}
*/

export default class WWCharacterSheet extends WWActorSheet {
  
  /** @override */
  static get defaultOptions() {

    return mergeObject(super.defaultOptions, {
      classes: ['weirdwizard', 'sheet', 'actor', 'character'],
      width: 885, // 880 breaks on Firefox
      height: 480, // 480
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'summary' }]
    });
  }

  /** @override */
  setPosition(pos={}) {
    super.setPosition(pos);

    // Fetch elements and new height
    const sheet = this.element[0];
    const charHeader = $(this.element[0]).find('.header-fields');
    const newHeight = charHeader[0].clientHeight;
    
    // Set minimum height to the header's size
    sheet.style.minHeight = parseInt(newHeight + 45) + 'px';
    
    return;
  }

}