/* -------------------------------------------- */
/*  Global Functions
/* -------------------------------------------- */

export const Global = {}

export function getEffectBoons (attribute) {
  return attribute.boons.global ?? 0;
}

// Formatting

export const i18n = s => game.i18n.localize(s)

/*export function capitalize(string) {
  return string?.charAt(0).toUpperCase() + string?.toLowerCase().slice(1)
}*/

export function plusify(x) {
  if (x == 0) return ''
  return x > 0 ? '+' + x : x
}

/* -------------------------------------------- */
/*  Math Functions
/* -------------------------------------------- */

Global.sum = function (array) {
  let sum = array.reduce((partialSum, a) => partialSum + a, 0);
  return sum;
}

