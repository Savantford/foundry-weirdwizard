import CompendiumIndex from '../apps/compendium-index.mjs';

export function initGlobalListeners() {
  const body = $("body");

  // Create enricher index listener
  body.on('click', '.enricher-index', _onClickIndex);

  /*body.on('click', ev => {
    if ( ui.choiceMenu ) ui.choiceMenu.close();
  });*/
}

/** 
 * Handle roll started from a chat button.
 */
function _onClickIndex(event) {
  
  event.preventDefault()
  const button = event.currentTarget,
    dataset = Object.assign({}, button.dataset)
  ;
  
  new CompendiumIndex({ compendium: dataset.compendium, type: dataset.type === 'ancestries' ? 'generic' : dataset.type }).render(true);
  
}