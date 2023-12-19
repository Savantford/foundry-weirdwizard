export const effChanges = {};

effChanges.boons = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  luck: addInt(),
  attack: addInt()
}

effChanges.banes = {
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt(),
  luck: addInt(),
  attack: addInt()
}

effChanges.autoFail = {
  str: setBoo(),
  agi: setBoo(),
  int: setBoo(),
  wil: setBoo()
}

effChanges.boonsAgainst = {
  def: addInt(),
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt()
}

effChanges.banesAgainst = {
  def: addInt(),
  str: addInt(),
  agi: addInt(),
  int: addInt(),
  wil: addInt()
}

effChanges.extraDamage = {
  dice: addInt(),
  mod: addInt()
}

effChanges.defense = {
  override: overInt(),
  bonus: addInt(),
  armored: upInt(1),
  natural: overInt(1),
  naturalIncrease: addInt(),
  naturalReduce: addInt()
}

effChanges.health = {
  tempIncrease: addInt(),
  tempReduce: addInt(),
  override: overInt(),
  increase: addInt()
}

effChanges.speed = {
  tempIncrease: addInt(),
  tempReduce: addInt(),
  halved: setBoo(),
  override: overInt(),
  increase: addInt()
}

effChanges.size = {
  increase: addInt(),
  override: overInt()
}

effChanges.upgradeAttribute = {
  str: upInt(),
  agi: upInt(),
  int: upInt(),
  wil: upInt()
}

effChanges.downgradeAttribute = {
  str: downInt(),
  agi: downInt(),
  int: downInt(),
  wil: downInt()
}

effChanges.overrideAttribute = {
  str: overInt(),
  agi: overInt(),
  int: overInt(),
  wil: overInt()
}

/* Make functions */

/* Mode Number:
  0: Special
  1: Multiply
  2: Add
  3: Downgrade
  4: Upgrade
  5: Override
*/

function addInt(priority = null) {
  return makeChangeData(2,'int',priority)
}

function overInt(priority = null) {
  return makeChangeData(5,'int',priority)
}

function upInt(priority = null) {
  return makeChangeData(4,'int',priority)
}

function downInt(priority = null) {
  return makeChangeData(3,'int',priority)
}

function setBoo(priority = null) {
  return makeChangeData(5,'boo',priority)
}

function makeChangeData(mode,valueType,priority = null/*,labelKey*/) {
  return {
    mode: mode,
    priority: priority,
    valueType: valueType/*,
    valueLabel: 'WW.EffectKeys.Value.' + labelKey*/
  };
}