/* -------------------------------------------------------- */
/*  Utility Functions (available as game.weirdwizard.utils) */
/* -------------------------------------------------------- */

export class Utils {
  static capitalize = capitalize;
  static plusify = plusify;
  static formatTime = formatTime;
  static getEffectBoons = getEffectBoons;
  static getSpeaker = getSpeaker;
  static getAlias = getAlias;
  static sum = sum;
  static sysPath = sysPath;
}

/* Formatting Functions */
export function capitalize(string, noLowerCase) {
  return noLowerCase ? string?.charAt(0).toUpperCase() + string?.slice(1) : string?.charAt(0).toUpperCase() + string?.toLowerCase().slice(1);
}

export function camelCase(str) {
  // converting all characters to lowercase
  let ans = str.toLowerCase();

  // Returning string to camelcase
  return ans.split(" ").reduce((s, c) => s + (c.charAt(0).toUpperCase() + c.slice(1)));

}

export function escape(str) {
  let escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };  
  
  return str.replace(/[&<>"'`=\/]/g, (s) => escapeMap[s]);
}

export function formatTime(seconds, isDate) {
  const hour = 3600,
    day = 86400, // 3600*24
    week = 604800, // 3600*24*7
    month = 2419200, // 3600*24*7*4
    label = (k) => { return i18n('WW.Effect.Duration.' + k) }, // Get localized label
    obj = {
      months: Math.floor(seconds / month),
      weeks: Math.floor(seconds % month / week),
      days: Math.floor(seconds % week / day),
      hours: Math.floor(seconds % day / hour),
      mins: Math.floor(seconds % hour / 60),
      secs: Math.floor(seconds % 60)
    }
  ;

  if (isDate) {
    let str = '';

    if (obj.months) str += (str ? ', ' : '') +  capitalize(label('Month')) + ' ' + obj.months;
    if (obj.weeks) str += (str ? ', ' : '') + capitalize(label('Week')) + ' ' + obj.weeks;
    if (obj.days) str += (str ? ', ' : '') + capitalize(label('Day')) + ' ' + obj.days;
    str += (str ? ', ' : '') + ('00' + obj.hours).slice(-2) + ':' + ('00' + obj.mins).slice(-2);
    
    return str;
    
  } else {
    const arr = [];

    Object.fromEntries(Object.entries(obj).filter(([k, v]) => {
      if (v < 1) return;

      switch (k) {
        case 'months': arr.splice(arr.length, 0, (v + ' ' + (v > 1 ? label('Months') : label('Month')))); break;
        case 'weeks': arr.splice(arr.length, 0, (v + ' ' + (v > 1 ? label('Weeks') : label('Week')))); break;
        case 'days': arr.splice(arr.length, 0, (v + ' ' + (v > 1 ? label('Days') : label('Day')))); break;
        case 'hours': arr.splice(arr.length, 0, (v + ' ' + (v > 1 ? label('Hours') : label('Hour')))); break;
        case 'mins': arr.splice(arr.length, 0, (v + ' ' + (v > 1 ? label('Minutes') : label('Minute')))); break;
        case 'secs': arr.splice(arr.length, 0, (v + ' ' + (v > 1 ? label('Seconds') : label('Second')))); break;
      }
      
    }))
    
    let str = '';

    arr.forEach((v,id) => {
      if (id < arr.length-2) str += v + ', ';
      else if (id < arr.length-1) str += v + ' ' + i18n('WW.Effect.Duration.And') + ' ';
      else str += v;
    })

    return str;
  }
}

export const i18n = (s,d={}) => game.i18n.format(s,d);

export function plusify(x) {
  return x >= 0 ? '+' + x : x
}

export function sysPath(string) {
  return 'systems/weirdwizard/' + string;
}

/**
  * Gets the default new key for a list entry
  * @param {Document|null} document            A document which the entry list should belong
  * @param {string} listKey                    The entry list key to be used
  * @param {string} listPath                   The entry list path to be used
  * @returns {string}
 */
export function defaultListEntryKey(document, listKey, listPath) {
  const list = foundry.utils.getProperty(document, listPath);
  
  // Get a set of taken names
  const takenKeys = new Set();
  for (const entryKey in list) takenKeys.add(entryKey);
  
  // Determine base name listKey and localize it
  const baseKey = CONFIG.WW.NEW_DEFAULT_ENTRY[listKey]?.key ?? 'entry';

  // Determine and return name
  let key = baseKey;

  if (listKey.includes('languages') && !Object.keys(list).length) key = 'common';
  else {
    let index = 1;
    while (takenKeys.has(key)) key = baseKey + (++index);
  }

  return key;
}

/**
  * Gets the default new name for a list entry
  * @param {Document|null} document            A document which the entry list should belong
  * @param {string} listKey                    The entry list key to be used
  * @param {string} listPath                   The entry list path to be used
  * @returns {string}
 */
export function defaultListEntryName(document, listKey, listPath) {
  const list = foundry.utils.getProperty(document, listPath);
  
  // Get a set of taken names
  const takenNames = new Set();
  for (const entryKey in list) {
    if (list[entryKey]?.name) takenNames.add(list[entryKey].name);
  }
  
  // Determine base name listKey and localize it
  const baseNameKey = listKey ? CONFIG.WW.NEW_DEFAULT_ENTRY[listKey]?.loc : null;
  
  const baseName = baseNameKey ? i18n(baseNameKey) : 'Entry';
  
  // Determine and return name
  let name = baseName;

  if (listKey.includes('languages') && !Object.keys(list).length) name = i18n('WW.ListEntry.Language.Common');
  else {
    let index = 1;
    while (takenNames.has(name)) name = `${baseName} (${++index})`;
  }

  return name;
}

/* -------------------------------------------- */
/*  Math Functions                              */
/* -------------------------------------------- */

export function sum(array) {
  let sum = array.reduce((partialSum, a) => partialSum + a, 0);
  return sum;
}

/* -------------------------------------------- */
/*  Getters                                     */
/* -------------------------------------------- */

export function getEffectBoons(attribute) {
  return attribute.boons.global ?? 0;
}

// ChatMessage.getSpeaker() but better!
// Mainly by preferring token names to avoid spoiling actor names.
export function getSpeaker({scene, actor, token, alias}={}) {
  const speaker = ChatMessage.getSpeaker({ scene, actor, token, alias });
  
  if (alias) {
    // We got a specific alias; prefer that over everything else.
    return speaker;
  }

  if (token) {
    // We got a token; prefer token.name > prototypeToken.name > getSpeaker().
    if (token.name) {
      speaker.alias = token.name;
    } else {
      if (token.actor?.prototypeToken?.name) {
        speaker.alias = token.actor.prototypeToken.name;
      }
    }
  } else if (actor) {
    // We got an actor; prefer token.name > prototypeToken.name > getSpeaker().
    if (actor.token?.name) {
      speaker.alias = actor.token.name;
    } else {
      if (actor.prototypeToken?.name) {
        speaker.alias = actor.prototypeToken.name;
      }
    }
  }

  return speaker;
}

export function getAlias({scene, actor, token, alias}={}) {
  return game.weirdwizard.utils.getSpeaker({ scene, actor, token, alias })?.alias;
}

/* Return a list of Compendia with a prefix included */
export function getCompendiumList () {
  const compendiumList = {};

  for (const pack of game.packs) {
    const data = pack.metadata;
    
    if (!(data.type === "Item" || data.type === "Actor")) continue; // Skip non-wanted document types

    // Package Name exists in the system's group list
    const compGroups = CONFIG.WW.COMPENDIUM_GROUPS;
    const group = Object.hasOwn(compGroups, data.packageName) ? compGroups[data.packageName] : compGroups[data.packageType];
    
    compendiumList[data.id] = {
      value: data.id,
      label: data.label,
      group: i18n(group)
    }

  }

  return compendiumList;
};

/* Return a list of Folders */
export function getFolderList(compendium) {
  const folderList = {};
  
  const folders = compendium ? compendium.folders : game.folders;

  for (const folder of folders) {
    
    folderList[folder.id] = {
      value: folder.id,
      label: folder.name,
      group: i18n('Existing folders')
    }

  }

  return folderList;
}

/* -------------------------------------------- */
/*  Misc                                        */
/* -------------------------------------------- */

export function handleWelcomeMessage(force = false) {
  if (!force && game.settings.get('weirdwizard', 'welcomeMessageShown')) {
    return;
  }

  if (!game.user.isGM) {
    return;
  }

  const intro = `<img style="background: none;" src="systems/weirdwizard/assets/ui/sotww-logo.png">`;
  const content = i18n('WW.System.Welcome', { intro: intro }) + i18n('WW.System.WelcomeFooter');
  ChatMessage.create({
    speaker: game.weirdwizard.utils.getSpeaker({ alias: game.system.title }),
    content: content,
    sound: CONFIG.sounds.notification
  })

  game.settings.set('weirdwizard', 'welcomeMessageShown', true);
}