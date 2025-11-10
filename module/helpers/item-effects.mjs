// Constants
export const addEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
  priority: priority
})

export const multiplyEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
  priority: priority
})

export const overrideEffect = (key, value, priority) => ({
  key: key,
  value: (value !== true) ? parseInt(value) : true,
  mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
  priority: priority
})

export const upgradeEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
  priority: priority
})

export const downgradeEffect = (key, value, priority) => ({
  key: key,
  value: parseInt(value),
  mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
  priority: priority
})

export const addObject = (key, value) => ({
  key: key,
  value: JSON.stringify(value),
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
})

export const concatDiceEffect = (key, value) => ({
  key: key,
  value: value ? '+' + String(value) : null,
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
})

export const concatString = (key, value, separator = '') => ({
  key: key,
  value: value ? value + separator : null,
  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
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