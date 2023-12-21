import { i18n } from './utils.mjs';

// Add custom enrichers during init phase
export default function addCustomEnrichers() {
  CONFIG.TextEditor.enrichers.push(
    {
      pattern: /@\[(str|agi|int|wil|luck)(?:(\+[1-99]+?|\-[1-99]+?))?\]/gim,
      enricher: enrichCall
    },
    {
      pattern: /@\[([1-99][^|]*?)(?:\|(d|h|hl|hr))?\]/gim,
      enricher: enrichRoll
    }
  );
}

async function enrichCall (match, options) {
          
  const container = document.createElement("a");
  container.className = 'enricher-call';

  const label = i18n(CONFIG.WW.ATTRIBUTES[match[1]]);
  container.innerHTML = `${label}`;

  // Record values in dataset
  container.dataset.attribute = match[1];
  container.dataset.fixedBoons = match[2] ? match[2] : 0;

  // Determine title according to the amount of boons
  const boons = parseInt(container.dataset.fixedBoons)

  container.title = `Roll ${label}`;

  if (boons > 1) {
    container.title += " " + i18n("WW.Boons.With") + " " + parseInt(boons) + " " + i18n("WW.Boons.Boons");
  } else if (boons > 0) {
    container.title += " " + i18n("WW.Boons.With") + " " + parseInt(boons) + " " + i18n("WW.Boons.Boon");
  } else if (boons < -1) {
    container.title += " " + i18n("WW.Boons.With") + " " + boons * -1 + " " + i18n("WW.Boons.Banes");
  } else if (boons < 0) {
    container.title += " " + i18n("WW.Boons.With") + " " + boons * -1 + " " + i18n("WW.Boons.Bane");
  }

  container.title += '\nClick to select a creature.'

  return container;
}

async function enrichRoll (match, options) {

  const exp = match[1];

  // Prepare container
  const container = document.createElement("a");
  container.className = 'enricher-roll';
  container.innerHTML = `${exp}`;

  // Prepare dataset
  container.dataset.value = exp;
  container.dataset.originUuid = options.relativeTo?.uuid;

  // Determine action
  function loc(string) {
    let str = i18n("WW.InstantEffect.Roll.Label") + ' ' + exp;
    if (string) str += ' ' + i18n("WW.InstantEffect.Roll." + string);
    return str; 
  };

  switch (match[2]) {

    case 'd': {
      container.dataset.action = 'roll-damage';
      container.title = loc('Damage');
      break;
    }
    case 'h': {
      container.dataset.action = 'roll-healing';
      container.title = loc('Healed');
      break;
    }
    case 'hl': {
      container.dataset.action = 'roll-health-loss';
      container.title = loc('Lost');
      break;
    }
    case 'hr': {
      container.dataset.action = 'roll-health-recovery';
      container.title = loc('Recovered');
      break;
    }

  }

  return container;
}