export class WWAfflictions {
  /**
   * Checks if the actor can do the action he is trying to perform, with the relative attribute
   * @param actor                 The actor
   * @param actionType            The type of action: [action / challenge]
   * @param actionAttribute       The attribute name, lowercase
   * @returns {boolean}           True if the actor is blocked
  */
  static isActorBlocked(actor, actionType, actionAttribute) {
    actionAttribute = actionAttribute.toLowerCase();
    const isBlocked = actor.system.maluses.autoFail[actionType]?.[actionAttribute] > 0;
    if (isBlocked) {
      // TODO: more precise message? Currently it picks the first message
      let msg = actor.getEmbeddedCollection('ActiveEffect').find(effect => Boolean(effect.flags?.warningMessage))
        ?.flags.warningMessage;
      msg = msg ?? _loc(`WW.AutoFail${actionType.capitalize()}s`);
      ui.notifications.error(msg);
    }
    return isBlocked
  }

  static async clearAfflictions(actor) {
    if (!actor) return;
    
    const afflictions = actor
      .getEmbeddedCollection('ActiveEffect')
      .filter(e => e.statuses.size > 0)
      .filter(e => e.type = 'affliction')
      .map(e => e._id);
    await actor.deleteEmbeddedDocuments('ActiveEffect', afflictions);
  }

  /**
   * Builds the Afflictions Active Effects for the token quick menu
   * @returns list of active effect data
  */
  static buildAll() {
    const buildAffliction = affliction => {
      const {changes = [], ...data} = affliction;
      
      return {
        ... data,
        name: _loc(CONFIG.WW.AFFLICTIONS[data.id]),
        tint: '#FF0900',
        description: data.id.includes('impaired') ? _loc('WW.Affliction.ImpairedDesc') : _loc(CONFIG.WW.AFFLICTIONS[data.id] + 'Desc'),
        duration: { expiry: 'luckEnds' },
        system: {
          durationPreset: 'luckEnds',
          changes: changes
        }
      }
    }

    return this.afflictionsData().map(affliction => buildAffliction(affliction));
  }

  /**
   * A getter for data used by afflictions.
   */
  static afflictionsData() {
    const baneAllAttributes = value => {
      return [
        addChange('banes.str', value),
        addChange('banes.agi', value),
        addChange('banes.int', value),
        addChange('banes.wil', value)
      ];
    }

    const againstAll = value => {
      return [
        addChange('boonsAgainst.def', value),
        addChange('boonsAgainst.str', value),
        addChange('boonsAgainst.agi', value),
        addChange('boonsAgainst.int', value),
        addChange('boonsAgainst.wil', value)
      ];
    }

    return [
      // Blinded
      {
        id: 'blinded',
        img: 'icons/svg/blind.svg',
        changes: [
          booleanChange('speed.halved')
        ]
      },

      // Confused
      {
        id: 'confused',
        img: 'icons/svg/stoned.svg',
        changes: [
          addChange('banes.int'),
          addChange('banes.wil')
        ]
      },

      // Controlled
      { id: 'controlled', img: 'systems/weirdwizard/assets/icons/puppet.svg' },

      // Cursed
      {
        id: 'cursed',
        img: 'systems/weirdwizard/assets/icons/bleeding-eye.svg',
        changes: [addChange('banes.luck')]
      },

      // Deafened
      { id: 'deafened', img: 'icons/svg/deaf.svg' },

      // Frightened
      {
        id: 'frightened',
        img: 'icons/svg/terror.svg',
        changes: [
          ...baneAllAttributes(1),
          ...againstAll(1)
        ]
      },

      // Held
      {
        id: 'held',
        img: 'systems/weirdwizard/assets/icons/manacles.svg',
        changes: [
          downgradeChange('speed.override'),
          booleanChange('autoSuccessAgainst.agi', true),
        ]
      },

      // Strength Impaired
      {
        id: 'impairedStr',
        img: 'systems/weirdwizard/assets/icons/biceps-impaired.svg',
        changes: [
          addChange('banes.str'),
          addChange('boonsAgainst.str')
        ]
      },

      // Agility Impaired
      {
        id: 'impairedAgi',
        img: 'systems/weirdwizard/assets/icons/agility-impaired.svg',
        changes: [
          addChange('banes.agi'),
          addChange('boonsAgainst.agi')
        ]
      },

      // Intellect Impaired
      {
        id: 'impairedInt',
        img: 'systems/weirdwizard/assets/icons/open-book-impaired.svg',
        changes: [
          addChange('banes.int'),
          addChange('boonsAgainst.int')
        ]
      },

      // Will Impaired
      {
        id: 'impairedWil',
        img: 'systems/weirdwizard/assets/icons/burning-star-impaired.svg',
        changes: [
          addChange('banes.wil'),
          addChange('boonsAgainst.wil')
        ]
      },

      // On Fire
      {
        id: 'onFire',
        img: 'systems/weirdwizard/assets/icons/flaming-claw.svg'
      },

      // Poisoned
      {
        id: 'poisoned',
        img: 'systems/weirdwizard/assets/icons/poison.svg',
        changes: [
          ...baneAllAttributes(1),
          ...againstAll(1)
        ]
      },

      // Prone
      { id: 'prone', img: 'systems/weirdwizard/assets/icons/fallen.svg' },

      // Slowed
      {
        id: 'slowed',
        img: 'systems/weirdwizard/assets/icons/snail.svg',
        changes: [ downgradeChange('speed.override', 2) ]
      },

      // Stunned
      {
        id: 'stunned',
        img: 'icons/svg/daze.svg',
        changes: [
          downgradeChange('speed.override'),
          ...baneAllAttributes(2),
          ...againstAll(2)
        ]
      },

      // Unconscious
      {
        id: 'unconscious',
        img: 'icons/svg/unconscious.svg',
        changes: [
          downgradeChange('speed.override'),
          booleanChange('autoFail.str', true),
          booleanChange('autoFail.agi', true),
          booleanChange('autoFail.int', true),
          booleanChange('autoFail.wil', true),
          ...againstAll(3)
        ]
      },

      // Asleep
      { id: 'asleep', img: 'icons/svg/sleep.svg' },

      // Vulnerable
      {
        id: 'vulnerable',
        img: 'systems/weirdwizard/assets/icons/broken-shield.svg',
        changes: [ ...againstAll(1) ]
      },

      // Weakened
      {
        id: 'weakened',
        img: 'systems/weirdwizard/assets/icons/back-pain.svg',
        changes: [
          addChange('banes.str'),
          addChange('banes.agi'),
          addChange('boonsAgainst.str'),
          addChange('boonsAgainst.agi'),
          booleanChange('speed.halved', true)
        ]
      }
    ]
  }
}

// Constants
const keyFromPreset = preset => {
  const [groupKey] = preset ? preset.split('.') : [];
  return CONFIG.WW.EFFECT_CHANGE_PRESET_DATA?.[groupKey]?.options?.[preset].key;
}

const createChange = (preset, value, priority, type) => ({
  key: keyFromPreset(preset),
  preset,
  value,
  priority,
  phase: 'final',
  type
})

const addChange = (preset, value = 1, priority = 120) => createChange(preset, value, priority, 'add');
const subtractChange = (preset, value = 1, priority = 120) => createChange(preset, value, priority, 'subtract');
const booleanChange = (preset, value = true, priority = 120) => createChange(preset, value, priority, 'override');
const downgradeChange = (preset, value = 0, priority = 150) => createChange(preset, value, priority, 'downgrade');