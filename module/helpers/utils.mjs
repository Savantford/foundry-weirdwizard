/* -------------------------------------------- */
/*  Global Functions
/* -------------------------------------------- */

export const Global = {}

export function getEffectBoons (attribute) {
  return attribute.boons.global ?? 0;
}

// Formatting
export const i18n = (s,d={}) => game.i18n.format(s,d);

export function capitalize(string,noLowerCase) {
  return noLowerCase ? string?.charAt(0).toUpperCase() + string?.slice(1) : string?.charAt(0).toUpperCase() + string?.toLowerCase().slice(1)
}

export function plusify(x) {
  return x >= 0 ? '+' + x : x
}

/* -------------------------------------------- */
/*  Math Functions
/* -------------------------------------------- */

export function sum(array) {
  let sum = array.reduce((partialSum, a) => partialSum + a, 0);
  return sum;
}

