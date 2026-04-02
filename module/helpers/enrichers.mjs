import CompendiumIndex from '../apps/compendium-index.mjs';
import { _onInstantEffectRoll, _onMultiChoice } from '../sidebar/chat-listeners.mjs';
import { i18n } from './utils.mjs';

// Add custom enrichers during init phase
export default function addCustomEnrichers() {
  CONFIG.TextEditor.enrichers.push(
    {
      id: 'weirdwizard.inlineAttributeCall',
      replaceParent: true,
      pattern: /@\[(str|agi|int|wil|luck)(?:(\+[1-99]+?|\-[1-99]+?))?\]/gi,
      enricher: inlineAttributeCallEnricher,
      onRender: inlineAttributeCallCallback
    },
    {
      id: 'weirdwizard.inlineRoll',
      replaceParent: true,
      pattern: /@\[([1-99][^|]*?)(?:\|(d|h|hl|hr))?\]/gi,
      enricher: inlineRollEnricher,
      onRender: inlineRollCallback
    },
    {
      id: 'weirdwizard.compendiumIndexLink',
      replaceParent: true,
      pattern: /@index\[(?<config>[^\]]+)?]/gim,
      enricher: compediumIndexLinkEnricher,
      onRender: compendiumIndexLinkCallback
    }
  );
}

/* -------------------------------------------- */
/*  Inline Attribute Call                       */
/* -------------------------------------------- */

async function inlineAttributeCallEnricher (match, options) {
          
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

/* -------------------------------------------- */

/**
  * Handle opening of a context menu from a chat button.
  * @param {HTMLElement} el    The element the menu opens on.
*/
function inlineAttributeCallCallback(enrichedContent, purpose='applyEffect') {
  enrichedContent.querySelector('a').addEventListener('click', (ev) => { _onMultiChoice(ev, 'attributeCall') });
}

/* -------------------------------------------- */
/*  Inline Roll                                 */
/* -------------------------------------------- */

async function inlineRollEnricher (match, options) {
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

/* -------------------------------------------- */

function inlineRollCallback(enrichedContent) {
  enrichedContent.querySelector('a').addEventListener('click', _onInstantEffectRoll);
}

/* -------------------------------------------- */
/*  Compendium Index Link                       */
/* -------------------------------------------- */

async function compediumIndexLinkEnricher (match, options) {
  const config = match.groups.config;
  const pairRegex = /(\w+)(?:=("(?:[^"]*)"|\w+))?/g;
  const settings = {};

  // Process matches and assign to settings object
  for (const [, key, value] of config.matchAll(pairRegex)) {
    
    if (value)  {
      const mappedKeys = {
        'source': 'sourceCompendia',
        'compendia': 'sourceCompendia',
        'types': 'documentTypes',
        'docTypes': 'documentTypes',
      }

      settings[mappedKeys[key] ?? key] = await value.replace(/['"]+/g, '');
    } else if (!value && CONFIG.WW.COMPENDIUM_INDEX_PRESET_LABELS[key]) {
      settings.preset = await key;
    }
  }

  // Prepare label and tooltip
  if (!settings.label) settings.label = i18n(CONFIG.WW.COMPENDIUM_INDEX_PRESET_LABELS[settings.preset ?? 'all']);
  if (!settings.tooltip) settings.tooltip = i18n('WW.Index.Tooltip', {type: settings.label});
  
  // Prepare container
  const container = document.createElement("a");
  container.className = 'enricher-index';
  container.innerHTML = settings.label;

  // Assign settings to the dataset
  for (const setting in settings) {
    container.dataset[setting] = settings[setting];
  }

  return container;
}

/** 
 * Handle Compendium Index opened by an enricher.
 */
function compendiumIndexLinkCallback(enrichedContent) {
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

  enrichedContent.querySelector('a').addEventListener('click', _onClickIndexEnricher);
}

/* -------------------------------------------- */
/*  Helper Functions                            */
/* -------------------------------------------- */

/* Parse descriptions to include inline enrichers */
export function parseDesc(desc) {
  let parsedDesc = desc;

  // Parse descriptions to use inline rolls
  const regex1 = /(?:(?:(?<h>heals)|(?<hl>loses))\s+)?(?<value>\d+d6)\s*(?:damage|Health)/gi;

  const matches1 = [...parsedDesc.matchAll(regex1)];

  matches1.forEach(match => {
    const { h, hl, value } = match.groups;

    // Determine operation
    const operation = h ? "h" : (hl ? "hl" : "d");

    // Format and parse
    const formattedExp = `@[${value}|${operation}]`;
    parsedDesc = parsedDesc.replace(match[0], match[0].replace(value, formattedExp));
  });

  // Inline attribute calls
  const regex2 = /(?<attribute>Strength|Agility|Will|Intellect|luck)\s*roll(?:\s*with\s*(?<boonsValue>\d+)\s*(?<boonsType>boon|bane)s?)?/gi;

  const attrMap = {
    strength: 'str',
    agility: 'agi',
    will: 'wil',
    intellect: 'int',
    luck: 'luck'
  };

  const plusify = (n) => (n > 0 ? `+${n}` : n);

  const matches2 = [...parsedDesc.matchAll(regex2)];

  matches2.forEach(match => {
    const { attribute, boonsValue, boonsType } = match.groups;

    // Boons calculation
    let boons = 0;
    if (boonsValue && boonsType) {
      const val = parseInt(boonsValue, 10);
      boons = boonsType.toLowerCase().startsWith('bane') ? -val : val;
    }

    const attrKey = attrMap[attribute.toLowerCase()];

    // Format and parse
    const formattedCall = `@[${attrKey}${boons !== 0 ? plusify(boons) : ''}]`;
    parsedDesc = parsedDesc.replace(match[0], match[0].replace(attribute, formattedCall));
  });

  return parsedDesc;
}