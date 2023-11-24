import { chatMessageButton, diceTotalHtml } from './chat-html-templates.mjs';
import WWRoll from '../dice/roll.mjs';
import GridTemplate from '../canvas/grid-template.mjs';

/* -------------------------------------------- */
/*  Chat methods                                */
/* -------------------------------------------- */

/*import {buildActorInfo, formatDice, getChatBaseData} from './base-messages'
import {TokenManager} from '../pixi/token-manager'*/
import { i18n } from '../helpers/utils.mjs';
import { RollDamage } from '../apps/roll-damage.mjs';

//const tokenManager = new TokenManager()

export function initChatListeners(html) {
  
  // Chat Message Button Handler
  html.on('click', '.chat-button', _onChatMessageButtonClick.bind(this));

  /*html.on('click', '.apply-effect', _onChatApplyEffect.bind(this))
  html.on('click', '.use-talent', _onChatUseTalent.bind(this))
  html.on('click', '.request-challengeroll', _onChatRequestChallengeRoll.bind(this))
  html.on('click', '.make-challengeroll', _onChatMakeChallengeRoll.bind(this))
  html.on('click', '.request-initroll', _onChatRequestInitRoll.bind(this))
  html.on('click', '.make-initroll', _onChatMakeInitRoll.bind(this))*/
  
}

/** 
 * Called when a chat message button is clicked.
 */
async function _onChatMessageButtonClick (event) {

  event.preventDefault()
  const button = event.currentTarget,
    dataset = Object.assign({}, button.dataset)
  ;
  
  switch (dataset.action) {
    // Instant Effect Rolls
    case 'roll-damage': new RollDamage(dataset).render(true); break;
    case 'roll-healing': _onChatRoll(dataset, 'WW.InstantEffect.HealOf', 'apply-healing'); break;
    case 'roll-health-loss': _onChatRoll(dataset, 'WW.InstantEffect.HealthLoseOf', 'apply-health-loss'); break;
    case 'roll-health-recovery': _onChatRoll(dataset, 'WW.InstantEffect.HealthRecoverOf', 'apply-health-recovery'); break;

    // Instant Effect Apply
    case 'apply-damage': _onChatApply(dataset); break;
    case 'apply-damage-half': _onChatApply(dataset); break;
    case 'apply-damage-double': _onChatApply(dataset); break;
    case 'apply-healing': _onChatApply(dataset); break;
    case 'apply-health-loss': _onChatApply(dataset); break;
    case 'apply-health-recovery': _onChatApply(dataset); break;
    case 'apply-affliction': _onChatApplyAffliction(dataset); break;

    // Other events
    //case 'place-template': _onChatPlaceTemplate(dataset); break;
    
  }
  
}

/* -------------------------------------------- */
/*  Chat Roll function                          */
/* -------------------------------------------- */

async function _onChatRoll(dataset, label, nextAction) {
  
  // Prepare following action
  dataset.action = nextAction;

  const origin = fromUuidSync(dataset.originUuid),
    data = {
      actor: _getActorFromOrigin(origin),
      target: canvas.tokens.get(dataset.targetId),
      item: (origin.documentName === 'Item') ? origin : null,
      value: dataset.value
    }
  const labelHtml = i18n(label) + ' ' + '<span class="owner-only">' + data.item.name + '</span><span class="non-owner-only">? ? ?</span>';

  // Prepare roll
  const r = await new WWRoll(data.value, data.actor.system).evaluate({async:true});
  dataset.value = await r.total;
  const rollArray= [r];
  const rollHtml = await diceTotalHtml(r);

  // Prepare message data
  const messageData = {
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    rolls: rollArray,
    speaker: ChatMessage.getSpeaker({ actor: data.actor }),
    flavor: labelHtml,
    content: '<div></div>',
    sound: CONFIG.sounds.dice,
    'flags.weirdwizard': {
      item: data.item?.uuid,
      rollHtml: rollHtml + (dataset.targetId ? truechatMessageButton(dataset) : ''), // Hide buttons from untargeted rolls
      emptyContent: true
    }
  };
  
  await ChatMessage.applyRollMode(messageData, game.settings.get('core', 'rollMode'));
  
  // Send to chat
  await ChatMessage.create(messageData);

}

/* -------------------------------------------- */
/*  Chat Apply functions                        */
/* -------------------------------------------- */

async function _onChatApply(dataset) {
  const target = canvas.tokens.get(dataset.targetId).actor;
  const value = dataset.value;

  switch (dataset.action) {
    case 'apply-damage': target.applyDamage(value); break;
    case 'apply-damage-half': target.applyDamage(Math.floor(value/2)); break;
    case 'apply-damage-double': target.applyDamage(2*value); break;
    case 'apply-healing': target.applyHealing(value); break;
    case 'apply-health-loss': target.applyHealthLoss(value); break;
    case 'apply-health-recovery': target.applyHealthRecovery(value); break;
    
  }

}

/* -------------------------------------------- */

async function _onChatApplyAffliction(dataset) {
  
  const target = canvas.tokens.get(dataset.targetId).actor;

  // Get affliction
  const afflictionId = dataset.value;
  const activeEffect = CONFIG.statusEffects.find(a => a.id === afflictionId);
  activeEffect['statuses'] = [activeEffect.id];

  if (!activeEffect) {
    console.warn('Weird Wizard | _onChatBestowAffliction | Effect not found!')
    return
  }

  const effectData = activeEffect;

  if (target.statuses.has(afflictionId)) {
    ui.notifications.warn(`"${target.name}" is already affected by this affliction.`);
  } else {
    await ActiveEffect.create(effectData, {parent: target})
    .then(e => ui.notifications.info(`Bestowed "${e.name}" to "${target.name}".`));
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
 * Get the Actor from the Origin document
 * @param {Document} origin    The origin document
 * @return {Actor|null}         The Actor entity or null
 * @private
*/

function _getActorFromOrigin(origin) {

  if (origin.documentName === 'Item') { // Case 1 - Origin is an Item
    return origin.parent || null;

  } else { // Case 2 - Origin is an Actor
    return origin || null;
  }
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