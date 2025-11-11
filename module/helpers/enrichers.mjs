import { i18n } from './utils.mjs';

// Add custom enrichers during init phase
export default function addCustomEnrichers() {
  CONFIG.TextEditor.enrichers.push(
    {
      pattern: /@\[(str|agi|int|wil|luck)(?:(\+[1-99]+?|\-[1-99]+?))?\]/gi,
      enricher: enrichCall
    },
    {
      pattern: /@\[([1-99][^|]*?)(?:\|(d|h|hl|hr))?\]/gi,
      enricher: enrichRoll
    },
    {
      pattern: /(?:index:(armor|weapons|hirelings|charopts|traits|talents|spells){1})/gi,
      enricher: enrichIndex
    },
  );
}

async function enrichCall (match, options) {
          
  const container = document.createElement("a");
  container.className = 'enricher-call';

  const label = i18n(CONFIG.WW.ROLL_ATTRIBUTES[match[1]]);
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
      container.dataset.action = 'rollDamage';
      container.title = loc('Damage');
      break;
    }
    case 'h': {
      container.dataset.action = 'rollHealing';
      container.title = loc('Healed');
      break;
    }
    case 'hl': {
      container.dataset.action = 'rollHealthLoss';
      container.title = loc('Lost');
      break;
    }
    case 'hr': {
      container.dataset.action = 'rollHealthRegain';
      container.title = loc('Regained');
      break;
    }
    default: {
      container.title = loc();
      break;
    }

  }

  return container;
}

async function enrichIndex (match, options) {
  const type = match[1] === 'charopts' ? 'character-options' : match[1];
  const label = i18n(CONFIG.WW.COMPENDIUM_INDEX_ENRICHER_LABELS[type]);

  // Prepare container
  const container = document.createElement("a");
  container.className = 'enricher-index';
  container.innerHTML = label;

  // Prepare dataset
  container.dataset.compendium = 'weirdwizard.' + type;
  container.dataset.type = type;
  container.dataset.tooltip = i18n('WW.System.Index.Tooltip', {type: label});

  return container;
}
