import CompendiumIndex from '../apps/compendium-index.mjs';

export function initGlobalListeners() {
  const body = $("body");

  // Create enricher index listener
  body.on('click', '.enricher-index', _onClickIndexEnricher);

  /*body.addEventListener("click", async (ev) => {
  if (ev.target.matches(".content-link")) {
    // do await stuff
  }

  })*/
}

/** 
 * Handle Compendium Index opened by an enricher.
 */
function _onClickIndexEnricher(event) {
  event.preventDefault()

  const button = event.currentTarget;
  const dataset = Object.assign({}, button.dataset);
  
  new CompendiumIndex({ preset: dataset.preset, view: dataset.view }).render(true);
  
}