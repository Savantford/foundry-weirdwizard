/* -------------------------------------------- */
/*  Global Functions
/* -------------------------------------------- */

export const Global = {}

Global.getAffBanes = function (system) {
  let banes = -1;
  return banes
}

/*Global.getMod = function() {

}*/

/* -------------------------------------------- */
/*  Math Functions
/* -------------------------------------------- */

Global.sum = function (array) {
  let sum = array.reduce((partialSum, a) => partialSum + a, 0);
  return sum;
}