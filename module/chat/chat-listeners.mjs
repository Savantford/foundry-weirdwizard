/* -------------------------------------------- */
/*  Chat methods                                */
/* -------------------------------------------- */

/*import {buildActorInfo, formatDice, getChatBaseData} from './base-messages'
import {TokenManager} from '../pixi/token-manager'*/
import { i18n } from '../helpers/utils.mjs';
import { rollDamage } from '../apps/roll-damage.mjs';

//const tokenManager = new TokenManager()

export function initChatListeners(html) {
  
  // Instant Effect Rolls
  html.on('click', '.damage-roll', _onChatRollDamage.bind(this));
  html.on('click', '.healing-roll', _onChatRollHealing.bind(this));
  //html.on('click', '.health-loss-roll', _onChatRollHealthLoss.bind(this));
  //html.on('click', '.health-recovery-roll', _onChatRollHealthRecovery.bind(this));

  // Instant Effect Apply
  html.on('click', '.damage-apply', _onChatApplyDamage.bind(this));
  //html.on('click', '.healing-apply', _onChatApplyHealing.bind(this));
  //html.on('click', '.health-loss-apply', _onChatApplyHealthLoss.bind(this));
  //html.on('click', '.health-recovery-apply', _onChatApplyHealthRecovery.bind(this));
  html.on('click', '.bestow-affliction', _onChatBestowAffliction.bind(this));

  /*html.on('click', '.apply-effect', _onChatApplyEffect.bind(this))
  html.on('click', '.use-talent', _onChatUseTalent.bind(this))
  html.on('click', '.place-template', _onChatPlaceTemplate.bind(this))
  html.on('click', '.request-challengeroll', _onChatRequestChallengeRoll.bind(this))
  html.on('click', '.make-challengeroll', _onChatMakeChallengeRoll.bind(this))
  html.on('click', '.request-initroll', _onChatRequestInitRoll.bind(this))
  html.on('click', '.make-initroll', _onChatMakeInitRoll.bind(this))*/
}

/* -------------------------------------------- */

async function _onChatRollDamage(event) {
  console.log('damage')
  event.preventDefault()
  const li = event.currentTarget;
  const token = li//.closest('.weirdwizard');
  const actor = _getChatCardActor(token);
  /*const damageformular = item.dataset.damage
  const damagetype = item.dataset.damagetype
  const selected = tokenManager.targets*/
  const itemId = li.dataset.itemId || li.closest('.weirdwizard').dataset.itemId;
  const item = actor.items.get(itemId)
  //const rollMode = game.settings.get('core', 'rollMode')
  
  // Prepare roll
  let obj = {
    actor: actor,
    target: li,
    label: item.name,//getSecretLabel(item.name),
    name: item.name,
    baseDamage: li.dataset.damage,
    properties: item.system.properties ? item.system.properties : {},
    bonusDamage: actor.system.stats.bonusdamage
  }

  new rollDamage(obj).render(true);

}

/* -------------------------------------------- */

async function _onChatRollHealing(event) {
  event.preventDefault()
  const li = event.currentTarget;
  const token = li//.closest('.weirdwizard');
  const actor = _getChatCardActor(token);
  console.log(actor)
  /*const damageformular = item.dataset.damage
  const damagetype = item.dataset.damagetype
  const selected = tokenManager.targets*/
  const itemId = li.dataset.itemId || li.closest('.weirdwizard').dataset.itemId;
  const item = actor.items.get(itemId);
  
  // Prepare roll
  let roll = new Roll(li.dataset.healing, actor.system);
  let label = i18n('WW.HealingOf') + ' ' + '<span class="owner-only">' + item.name + '</span><span class="non-owner-only">? ? ?</span>';

  await roll.evaluate();
  console.log(await roll.total);

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: label,
    rollMode: game.settings.get('core', 'rollMode')
  });
  
}

/* -------------------------------------------- */

async function _onChatApplyDamage(event) {
  event.preventDefault()
  console.log('triggered')
  const li = event.currentTarget;
  const token = li//.closest('.weirdwizard');
  const actor = _getChatCardActor(token);
  const damage = parseInt(li.dataset.damage)

  console.log(actor);
  actor.applyDamage(damage);

  /*var selected = tokenManager.targets
  if (selected.length == 0) {
    ui.notifications.info(game.i18n.localize('WW.DialogWarningActorsNotSelected'))
    return
  }

  selected.forEach(token => token.actor.increaseDamage(+damage))*/

  //const sourceToken = tokenManager.getTokenByActorId(actor.id)
  //const itemId = li.closest('.weirdwizard').dataset.itemId
  /*Hooks.call('WW.ApplyDamage', {
    sourceToken,
    targets: selected,
    itemId,
    damage,
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

async function _onChatBestowAffliction(event) {
  console.log('teste')
  event.preventDefault()
  const li = event.currentTarget;
  //const effectUuid = htmlTarget.attributes.getNamedItem('data-affliction').value;
  //const activeEffect = await fromUuid(effectUuid);
  const token = li//.closest('.weirdwizard');
  const target = _getChatCardTarget(token);

  // Get affliction
  console.log(li)
  const afflictionId = li.dataset.affliction;
  const activeEffect = CONFIG.statusEffects.find(a => a.id === afflictionId);
  activeEffect['statuses'] = [activeEffect.id];

  if (!activeEffect) {
    console.warn('Weird Wizard | _onChatBestowAffliction | Effect not found!')
    return
  }

  /*const selected = tokenManager.targets
  if (selected.length === 0) {
    tokenManager.warnNotSelected()
    return
  }*/

  const effectData = activeEffect//.toObject()

  if (target.actor.statuses.has(afflictionId)) {
    ui.notifications.warn(`"${target.actor.name}" is already affected by this affliction.`);
  } else {
    //selected.forEach(target => {
      await ActiveEffect.create(effectData, {parent: target.actor})
        .then(e => ui.notifications.info(`Bestowed "${e.name}" to "${target.actor.name}".`));
    //})
  }
  
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
  // Case 1 - a synthetic actor from a Token
  const tokenKey = card.dataset.tokenId
  if (tokenKey) {
    /*const [sceneId, tokenId] = tokenKey.split('.')
    const scene = game.scenes.get(sceneId)
    if (!scene) return null
    const tokenData = scene.items.get(tokenId)
    if (!tokenData) return null
    const token = new Token(tokenData)*/
    
    return canvas.tokens.get(tokenKey).actor//token.actor
  }

  // Case 2 - use Actor ID directory
  const actorId = card.dataset.actorId;
  return game.actors.get(actorId) || null
}

/* -------------------------------------------- */

/**
 * Get the target Actor which was the target of a chat card
 * @param {HTMLElement} card    The chat card being used
 * @return {Actor|null}         The Actor entity or null
 * @private
*/

function _getChatCardTarget(card) {
  const targetId = card.dataset.targetId;
  return canvas.tokens.get(targetId) || null
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