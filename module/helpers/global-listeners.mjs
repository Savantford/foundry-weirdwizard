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

  // Destructure dataset into needed variables
  const { preset, label, tooltip, view, ...rawFilters } = dataset;

  // Assign filter
  const filters = {};
  for (const [key, value] of Object.entries(rawFilters)) {
    filters[key] = value.split(',');
  }
  
  // Open app with the options
  new CompendiumIndex({ preset, view, filters }).render(true);
}