// Constants
export const addEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.add,
  priority: priority
})

export const subtractEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.subtract,
  priority: priority
})

export const multiplyEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.MULTIPLY,
  priority: priority
})

export const overrideEffect = (key, value, priority) => ({
  key: key,
  value: (value !== true) ? parseInt(value) : true,
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.OVERRIDE,
  priority: priority
})

export const upgradeEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.UPGRADE,
  priority: priority
})

export const downgradeEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.DOWNGRADE,
  priority: priority
})

export const addObject = (key, value) => ({
  key: key,
  value: JSON.stringify(value),
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.add,
})

export const concatDiceEffect = (key, value) => ({
  key: key,
  value: value ? '+' + String(value) : null,
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.add,
})

export const concatString = (key, value, separator = '') => ({
  key: key,
  value: value ? value + separator : null,
  type: CONST.ACTIVE_EFFECT_CHANGE_TYPES.add,
})

/* -------------------------------------------- */

export class WWActiveEffects {
  static async removeEffectsByOrigin(doc, originID) {
    const toDel = doc.getEmbeddedCollection('ActiveEffect').filter(effect => effect.data?.origin?.includes(originID))

    const promises = []
    for await (const e of toDel) {
      promises.push(await e.delete({ parent: doc }))
    }
    return Promise.all(promises)
  }

}