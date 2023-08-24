/* -------------------------------------------- */
/*  Chat methods                                */
/* -------------------------------------------- */

/*import {buildActorInfo, formatDice, getChatBaseData} from './base-messages'
import {TokenManager} from '../pixi/token-manager'*/
import { rollDamage } from '../apps/roll-damage.mjs';

//const tokenManager = new TokenManager()

export function initChatListeners(html) {
  //html.on('click', '.damage-roll', _onChatRollDamage.bind(this))
  /*html.on('click', '.healing-roll', _onChatApplyHealing.bind(this))
  html.on('click', '.apply-damage', _onChatApplyDamage.bind(this))
  html.on('click', '.apply-effect', _onChatApplyEffect.bind(this))
  html.on('click', '.use-talent', _onChatUseTalent.bind(this))
  html.on('click', '.place-template', _onChatPlaceTemplate.bind(this))
  html.on('click', '.request-challengeroll', _onChatRequestChallengeRoll.bind(this))
  html.on('click', '.make-challengeroll', _onChatMakeChallengeRoll.bind(this))
  html.on('click', '.request-initroll', _onChatRequestInitRoll.bind(this))
  html.on('click', '.make-initroll', _onChatMakeInitRoll.bind(this))*/
}

/* -------------------------------------------- */

async function _onChatRollDamage(event) {
  console.log(event)
  event.preventDefault()
  const li = event.currentTarget
  const token = li/*.closest('.weirdwizard')*/
  const actor = _getChatCardActor(token)
  const item = li.children[0]
  /*const damageformular = item.dataset.damage
  const damagetype = item.dataset.damagetype
  const selected = tokenManager.targets
  const itemId = item.dataset.itemId || li.closest('.weirdwizard').dataset.itemId
  const rollMode = game.settings.get('core', 'rollMode')*/
  console.log(item.system.damage)
  let obj = {
    actor: actor,
    target: li,
    label: i18n('WW.Damage.Of') + ' ' + item.name,
    baseDamage: item.system.damage,
    bonusDamage: actor.system.stats.bonusdamage
  }

  new rollDamage(obj).render(true)

  /*const damageRoll = new Roll(damageformular, {})
  damageRoll.evaluate({async: false})

  let totalDamage = ''
  let totalDamageGM = ''
  if (['blindroll'].includes(rollMode)) {
    totalDamage = '?'
    totalDamageGM = damageRoll.total
  } else {
    totalDamage = damageRoll.total
  }

  var templateData = {
    actor: actor,
    item: {
      id: itemId,
    },
    data: {},
    diceData: formatDice(damageRoll),
  }
  templateData.data['damageTotal'] = totalDamage
  templateData.data['damageTotalGM'] = totalDamageGM
  templateData.data['damageDouble'] = +damageRoll.total * 2
  templateData.data['damageHalf'] = Math.floor(+damageRoll.total / 2)
  templateData.data['damagetype'] = damagetype
  templateData.data['isCreature'] = actor.type === 'creature'
  templateData.data['actorInfo'] = buildActorInfo(actor)

  const chatData = getChatBaseData(actor, rollMode)
  if (damageRoll) {
    chatData.rolls = [damageRoll],
    chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL
  }
  const template = 'systems/demonlord/templates/chat/damage.hbs'
  renderTemplate(template, templateData).then(content => {
    chatData.content = content
    chatData.sound = CONFIG.sounds.dice
    ChatMessage.create(chatData)
  })
  Hooks.call('WW.RollDamage', {
    sourceToken: tokenManager.getTokenByActorId(actor.id),
    targets: selected,
    itemId,
  })*/
}

/* -------------------------------------------- */
/*
async function _onChatApplyHealing(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const isFullRate = +item.dataset.healing === 1

  const selected = tokenManager.targets
  if (selected.length === 0) {
    ui.notifications.info(game.i18n.localize('WW.DialogWarningActorsNotSelected'))
    return
  }

  selected.forEach(token => token.actor.applyHealing(isFullRate))

  const actor = _getChatCardActor(li.closest('.weirdwizard'))
  const sourceToken = tokenManager.getTokenByActorId(actor.id)
  const itemId = li.closest('.weirdwizard').dataset.itemId
  Hooks.call('WW.ApplyHealing', {
    sourceToken,
    targets: selected,
    itemId,
  })
}

/* -------------------------------------------- */
/*
async function _onChatApplyDamage(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const damage = parseInt(item.dataset.damage)

  var selected = tokenManager.targets
  if (selected.length == 0) {
    ui.notifications.info(game.i18n.localize('WW.DialogWarningActorsNotSelected'))
    return
  }

  selected.forEach(token => token.actor.increaseDamage(+damage))

  const actor = _getChatCardActor(li.closest('.weirdwizard'))
  const sourceToken = tokenManager.getTokenByActorId(actor.id)
  const itemId = li.closest('.weirdwizard').dataset.itemId
  Hooks.call('WW.ApplyDamage', {
    sourceToken,
    targets: selected,
    itemId,
    damage,
  })
}

/* -------------------------------------------- */
/*
async function _onChatApplyEffect(event) {
  event.preventDefault()
  const htmlTarget = event.currentTarget
  const effectUuid = htmlTarget.attributes.getNamedItem('data-effect-uuid').value
  const activeEffect = await fromUuid(effectUuid)

  if (!activeEffect) {
    console.warn('Demonlord | _onChatApplyEffect | Effect not found!')
    return
  }
  const selected = tokenManager.targets
  if (selected.length === 0) {
    tokenManager.warnNotSelected()
    return
  }

  const effectData = activeEffect.toObject()
  selected.forEach(target => {
    ActiveEffect.create(effectData, {parent: target.actor})
      .then(e => ui.notifications.info(`Added "${e.name}" to "${target.actor.name}"`))
  })
}

/* -------------------------------------------- */
/*
async function _onChatUseTalent(event) {
  const token = event.currentTarget.closest('.weirdwizard')
  const actor = _getChatCardActor(token)
  if (!actor) return

  const div = event.currentTarget.children[0]
  const talentId = div.dataset.itemId
  actor.rollTalent(talentId)
}

/* -------------------------------------------- */
/*
async function _onChatRequestChallengeRoll(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const attribute = item.dataset.attribute

  const start = li.closest('.request-challengeroll')
  let boonsbanes = start.children[0].value
  if (boonsbanes == undefined) boonsbanes = parseInt(item.dataset.boba)
  if (isNaN(boonsbanes)) boonsbanes = 0

  var selected = tokenManager.targets
  if (selected.length == 0) {
    ui.notifications.info(game.i18n.localize('WW.DialogWarningActorsNotSelected'))
  }

  let boonsbanestext = ''
  if (boonsbanes == 1) {
    boonsbanestext = boonsbanes + ' ' + game.i18n.localize('WW.DialogBoon')
  }
  if (boonsbanes > 1) {
    boonsbanestext = boonsbanes + ' ' + game.i18n.localize('WW.DialogBoons')
  }
  if (boonsbanes == -1) {
    boonsbanestext = boonsbanes.toString().replace('-', '') + ' ' + game.i18n.localize('WW.DialogBane')
  }
  if (boonsbanes < -1) {
    boonsbanestext = boonsbanes.toString().replace('-', '') + ' ' + game.i18n.localize('WW.DialogBanes')
  }

  selected.forEach(token => {
    const actor = token.actor

    var templateData = {
      actor: actor,
      data: {
        attribute: {
          value: game.i18n.localize(CONFIG.DL.attributes[attribute.toLowerCase()]),
        },
        boonsbanes: {
          value: boonsbanes,
        },
        boonsbanestext: {
          value: boonsbanestext,
        },
      },
    }

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
        token: actor.token,
        alias: actor.name,
      },
    }

    chatData.whisper = ChatMessage.getWhisperRecipients(actor.name)

    const template = 'systems/demonlord/templates/chat/makechallengeroll.hbs'
    renderTemplate(template, templateData).then(content => {
      chatData.content = content

      ChatMessage.create(chatData)
    })
  })
}

/* -------------------------------------------- */
/*
async function _onChatMakeChallengeRoll(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const attributeName = item.dataset.attribute
  const boonsbanes = item.dataset.boonsbanes
  const actorId = item.dataset.actorid
  const actor = game.actors.get(actorId)
  const attribute = actor.getAttribute(attributeName)
  const start = li.closest('.weirdwizard')
  const boonsbanesEntered = start.children[1].children[0].children[0].children[1]?.value

  actor.rollAttribute(attribute, parseInt(boonsbanes) + parseInt(boonsbanesEntered), 0)
}

/* -------------------------------------------- */
/*
async function _onChatRequestInitRoll(event) {
  event.preventDefault()

  var selected = tokenManager.targets
  if (selected.length == 0) {
    ui.notifications.info(game.i18n.localize('WW.DialogWarningActorsNotSelected'))
  }

  selected.forEach(token => {
    const actor = token.actor

    var templateData = {
      actor: actor,
      token: canvas.tokens.controlled[0]?.data,
      data: {},
    }

    const chatData = {
      user: game.user.id,
      speaker: {
        actor: actor.id,
        token: actor.token,
        alias: actor.name,
      },
    }

    chatData.whisper = ChatMessage.getWhisperRecipients(actor.name)

    const template = 'systems/demonlord/templates/chat/makeinitroll.hbs'
    renderTemplate(template, templateData).then(content => {
      chatData.content = content
      ChatMessage.create(chatData)
    })
  })
}

/* -------------------------------------------- */
/*
async function _onChatMakeInitRoll(event) {
  event.preventDefault()
  const li = event.currentTarget
  const item = li.children[0]
  const actorId = item.dataset.actorid
  const actor = game.actors.get(actorId)
  let combatantFound = null

  for (const combatant of game.combat.combatants) {
    if (combatant.actor?._id === actor._id) {
      combatantFound = combatant
    }
  }

  if (combatantFound) {
    game.combat.rollInitiative(combatantFound._id)
  }
}

/* -------------------------------------------- */

/**
 * Get the Actor which is the author of a chat card
 * @param {HTMLElement} card    The chat card being used
 * @return {Actor|null}         The Actor entity or null
 * @private
*/

function _getChatCardActor(card) {
  console.log(card)
  // Case 1 - a synthetic actor from a Token
  const tokenKey = card.dataset.tokenId
  if (tokenKey) {
    const [sceneId, tokenId] = tokenKey.split('.')
    const scene = game.scenes.get(sceneId)
    if (!scene) return null
    const tokenData = scene.items.get(tokenId)
    if (!tokenData) return null
    const token = new Token(tokenData)
    return token.actor
  }

  // Case 2 - use Actor ID directory
  const actorId = card.dataset.actorId
  return game.actors.get(actorId) || null
}

/* -------------------------------------------- */

/**
 * Get the Actor which is the target of a chat card
 * @param {HTMLElement} _card    The chat card being used
 * @return {Array.<Actor>}      An Array of Actor entities, if any
 * @private
 */
// eslint-disable-next-line no-unused-vars
/*function _getChatCardTargets(_card) {
  const character = game.user.character
  const controlled = canvas.tokens.controlled
  const targets = controlled.reduce((arr, t) => (t.actor ? arr.concat([t.actor]) : arr), [])
  if (character && controlled.length === 0) targets.push(character)
  return targets
}

/* -------------------------------------------- */

/*async function _onChatPlaceTemplate(event) {
  event.preventDefault()
  const itemUuid = $(event.currentTarget).data('itemUuid')
  const item = await fromUuid(itemUuid)

  const template = game.weirdwizard.canvas.ActionTemplate.fromItem(item)
  if (template) {
    template.drawPreview()
  }
}

/* -------------------------------------------- */