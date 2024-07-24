import CompendiumIndex from '../apps/compendium-index.mjs';

export function initGlobalListeners() {
  const body = $("body");
  body.on('click', '.enricher-index', _onClickIndex);
}

/** 
 * Handle roll started from a chat button.
 */
function _onClickIndex(event) {
  
  event.preventDefault()
  const button = event.currentTarget,
    dataset = Object.assign({}, button.dataset)
  ;
  
  if (CONFIG.WW.IS_V12) {
    new CompendiumIndex({ compendium: dataset.compendium, type: dataset.type === 'ancestries' ? 'generic' : dataset.type }).render(true);
  } else {
    ui.notifications.warn('Foundry V12 or above is needed for the Compendium Index app to run. Please consider updating it!');
  };
  
}