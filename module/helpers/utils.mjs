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

export function resizeInput (html) {
  const resize = html.find('input.auto-resize');
  const numberInput = html.find('input[type=number]');
  const min = 12;

  resize.each(function() {
    this.style.width = 0;
    this.style.width = (this.scrollWidth > min ? this.scrollWidth : min) + "px";
    this.style.minWidth = 0;
    this.style.minWidth = (this.scrollWidth > min ? this.scrollWidth : min) + "px";
  });

  resize.on("input", function() {
    this.style.width = 0;
    this.style.width = (this.scrollWidth > min ? (this.scrollWidth + 2) : min) + "px";
    this.style.minWidth = 0;
    this.style.minWidth = (this.scrollWidth > min ? (this.scrollWidth + 2) : min) + "px";
  });

  numberInput.each(function() {
    this.style.minWidth = 0;
    this.style.minWidth = (this.scrollWidth > min ? this.scrollWidth : min) + "px";
    this.style.width = 0;
    this.style.width = (this.scrollWidth > min ? this.scrollWidth : min) + "px";
  });

  numberInput.on("input", function() {
    this.style.minWidth = 0;
    this.style.minWidth = (this.scrollWidth > min ? this.scrollWidth : min) + "px";
    this.style.width = 0;
    this.style.width = (this.scrollWidth > min ? this.scrollWidth : min) + "px";
  });
}

/* -------------------------------------------- */
/*  Math Functions
/* -------------------------------------------- */

export function sum(array) {
  let sum = array.reduce((partialSum, a) => partialSum + a, 0);
  return sum;
}

