/* ------------------------------------------------------- */
/*  Utility Functions (available as game.weirdwizard.utils.*)
/* ------------------------------------------------------- */

export class Utils {
  static capitalize = capitalize;
  static plusify = plusify;
  static formatTime = formatTime;
  static getEffectBoons = getEffectBoons;
  static getSpeaker = getSpeaker;
  static getAlias = getAlias;
  static sum = sum;
}

/* Formatting Functions */

export const i18n = (s,d={}) => game.i18n.format(s,d);

export function capitalize(string, noLowerCase) {
  return noLowerCase ? string?.charAt(0).toUpperCase() + string?.slice(1) : string?.charAt(0).toUpperCase() + string?.toLowerCase().slice(1)
}

export function plusify(x) {
  return x >= 0 ? '+' + x : x
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

/* Misc Utility Functions */
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

/* -------------------------------------------- */
/*  Math Functions
/* -------------------------------------------- */

export function sum(array) {
  let sum = array.reduce((partialSum, a) => partialSum + a, 0);
  return sum;
}

/* -------------------------------------------- */
/*  Misc
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
