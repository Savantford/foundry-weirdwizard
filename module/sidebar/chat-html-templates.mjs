import { i18n } from '../helpers/utils.mjs';

// Prepare Dice Total html template - obsolete?
export async function diceTotalHtml(roll) {
  return '<span class="owner-only">' + await roll.render() + '</span><h4 class="secret-dice-total non-owner-only">' + await roll.total + '</h4>';
}

// Prepare html header for a target - obsolete?
export function targetHeader(target, html, noItem) {
  if ((target.id === undefined) || noItem) return (html ? html : '');

  else return `<p class="owner-only chat-target">${i18n('WW.Targeting.Target')}: ${target.name}</p><p class="non-owner-only chat-target">${i18n('WW.Targeting.Target')}: ???</p><div class="chat-target-content">${html}</div>`;
}

// Prepare html header for a target
export function buttonsHeader(html, label, noItem) {
  return `<div class="chat-target">${label}</div><div class="chat-target-content"><div class="chat-buttons">${html}</div></div>`;
}

// Prepare Html Button for a chat message
export function chatMessageButton({action, value, effectUuid, originUuid, targetIds}) {
  let icon = 'dice';
  let img = '';
  let loc = 'WW.InstantEffect.Button.';
  let showNo = true;

  switch (action) {
    /* Roll Actions */
    case 'rollDamage': {
      loc += 'Damage';
      break;
    }
    case 'rollHealing': {
      loc += 'Healing';
      break;
    }
    case 'rollHealthLoss': {
      loc += 'HealthLoss';
      break;
    }
    case 'rollHealthRegain': {
      loc += 'HealthRegain';
      break;
    }
    case 'applyAffliction': {
      icon = 'skull-crossbones';
      loc = 'WW.InstantEffect.Affliction';
      break;
    }
    /* Apply Actions */
    case 'applyDamage': {
      img = '/systems/weirdwizard/assets/icons/rough-wound-black.svg';
      loc += 'Damage';
      showNo = false;
      break;
    }
    case 'applyDamageHalf': {
      img = '/systems/weirdwizard/assets/icons/slashed-shield-black.svg';
      loc += 'Half';
      showNo = false;
      break;
    }
    case 'applyDamageDouble': {
      img = '/systems/weirdwizard/assets/icons/cross-mark-black.svg';
      loc += 'Double';
      showNo = false;
      break;
    }
    case 'applyHealing': {
      img = '/systems/weirdwizard/assets/icons/caduceus-black.svg';
      loc += 'Healing';
      showNo = false;
      break;
    }
    case 'applyHealthLoss': {
      img = '/systems/weirdwizard/assets/icons/health-decrease-black.svg';
      loc += 'LoseHealth';
      showNo = false;
      break;
    }
    case 'applyHealthRegain': {
      img = '/systems/weirdwizard/assets/icons/health-increase-black.svg';
      loc += 'RegainHealth';
      showNo = false;
      break;
    }
    case 'applyEffect': {
      icon = 'hand-holding-magic';
      loc = 'WW.Effect.Apply';
      showNo = false;
      break;
    }
  }
  
  let html = '';
  
  if (img) { // Vertical Button
    html = '<div class="chat-button flexcol" data-action="' + action +
    (value ? '" data-value="' + value : '') +
    (effectUuid ? '" data-effect-uuid="' + effectUuid : '') +
    '" data-origin-uuid="' + originUuid +
    '" data-target-ids="' + targetIds + '">' +
    '<img src="' + img + '"/>' + 
    '<div>' + i18n(loc) + (effectUuid ? ': ' + fromUuidSync(effectUuid)?.name : '') +
    (showNo ? (': ' + value) : '') + '</div></div>'
  } else { // Inline Button
    html = '<div class="chat-button" data-action="' + action +
    (value ? '" data-value="' + value : '') +
    (effectUuid ? '" data-effect-uuid="' + effectUuid : '') +
    '" data-origin-uuid="' + originUuid +
    '" data-target-ids="' + targetIds + '">' +
    '<i class="fa-solid fa-' + icon + '"></i>' +
    i18n(loc) + (effectUuid ? ': ' + fromUuidSync(effectUuid)?.name : '') +
    (showNo ? (': ' + value) : '') + '</div>';
  }
  
  return html;
}

export function chatMessageButtonArray({value, originUuid, targetIds}) {
  const actions = ['applyDamage', 'applyDamageHalf', 'applyDamageDouble', 'applyHealing']
  let html = '<div class="chat-button-container">';

  actions.forEach(a => {
    html += chatMessageButton({action: a, value, originUuid, targetIds});
  })

  html += '</div>';
  
  return html;
}


/* Prepare action string from label string */
export function actionFromLabel(label) {
  let action = '';
  
  switch (label) {
    case ('damage'): action = 'rollDamage'; break;
    case ('heal'): action = 'rollHealing'; break;
    case ('healthLose'): action = 'rollHealthLoss'; break;
    case ('healthRegain'): action = 'rollHealthRegain'; break;
    case ('affliction'): action = 'applyAffliction'; break;
  }
  
  return action;
}

/* Prepare a complementary object from a label string */
export function dataFromLabel(label) {
  
  const data = {
    action: label.includes('apply') ? label : actionFromLabel(label),
    icon: 'dice',
    img: '',
    loc: 'WW.InstantEffect.Button.',
    showNo: true
  }

  switch (data.action) {
    /* Roll Actions */
    case 'rollDamage': {
      data.loc += 'Damage';
      break;
    }
    case 'rollHealing': {
      data.loc += 'Healing';
      break;
    }
    case 'rollHealthLoss': {
      data.loc += 'HealthLoss';
      break;
    }
    case 'rollHealthRegain': {
      data.loc += 'HealthRegain';
      break;
    }
    case 'applyAffliction': {
      data.icon = 'skull-crossbones';
      data.loc = 'WW.InstantEffect.Affliction';
      break;
    }
    /* Apply Actions */
    case 'applyDamage': {
      data.img = '/systems/weirdwizard/assets/icons/rough-wound-black.svg';
      data.loc += 'Damage';
      data.showNo = false;
      break;
    }
    case 'applyDamageHalf': {
      data.img = '/systems/weirdwizard/assets/icons/slashed-shield-black.svg';
      data.loc += 'Half';
      data.showNo = false;
      break;
    }
    case 'applyDamageDouble': {
      data.img = '/systems/weirdwizard/assets/icons/cross-mark-black.svg';
      data.loc += 'Double';
      data.showNo = false;
      break;
    }
    case 'applyHealing': {
      data.img = '/systems/weirdwizard/assets/icons/caduceus-black.svg';
      data.loc += 'Healing';
      data.showNo = false;
      break;
    }
    case 'applyHealthLoss': {
      data.img = '/systems/weirdwizard/assets/icons/health-decrease-black.svg';
      data.loc += 'LoseHealth';
      data.showNo = false;
      break;
    }
    case 'applyHealthRegain': {
      data.img = '/systems/weirdwizard/assets/icons/health-increase-black.svg';
      data.loc += 'RegainHealth';
      data.showNo = false;
      break;
    }
    case 'applyEffect': {
      data.icon = 'hand-holding-magic';
      data.loc = 'WW.Effect.Apply';
      data.showNo = false;
      break;
    }
  }

  return data;
}

/* Prepare a complementary object from a label string */
export function actDataFromEffect(effect) {
  const data = {
    action: 'applyEffect',
    uuid: effect.uuid,
    trigger: effect.system.trigger
  }

  return data;
}

// Add intant effects to chat message html
export function addInstEffs(effects, origin, target) {
    
  if (!target) target = '';

  let finalHtml = '';

  effects = effects.filter(e => e.trigger === 'onUse');
  
  effects.forEach(e => {
    if (!e.value && !e.affliction) return ui.notifications.warn(i18n("WW.Roll.AgainstWrn"));
    let html = '';
    
    if (e.target === 'self') target = this.token.uuid;
    
    if (e.label === 'affliction') html = chatMessageButton({
      action: actionFromLabel(e.label),
      value: e.affliction,
      originUuid: origin,
      targetId: target
    });

    else html = chatMessageButton({
      action: actionFromLabel(e.label),
      value: e.value,
      originUuid: origin,
      targetId: target
    });
    
    finalHtml += html;
  })
  
  return finalHtml;
}

// Add Active Effects to chat message html
export function addActEffs(actEffs, origin, target, singleRoll = false) {
  //const origin = this.origin.uuid,
  //const instEffs = this.instEffs[trigger],
    /*actEffs = this.effects[trigger],
    /*target = options.target,*/
  
  let targets = target// ? this.targets.filter(t => t.id === target) : this.targets;
  
  let finalHtml = '',
    anyHtml = '',
    enemiesHtml = '',
    alliesHtml = '',
    noneHtml = ''
  ;
  
  // Handle instant effects
  /*instEffs.forEach(e => {
    let html = '';
    
    if (e.target === 'self') targets = this.token.uuid;

    // Get target ids string
    const targetIds = this._getTargetIds(targets, e.target);

    // Create the chat button
    if (e.label === 'affliction') html = chatMessageButton({
      action: actionFromLabel(e.label),
      value: e.affliction,
      originUuid: origin,
      targetIds: targetIds
    });

    else html = chatMessageButton({
      action: actionFromLabel(e.label),
      value: e.value,
      originUuid: origin,
      targetIds: targetIds
    });
    
    // Assign to group html
    switch (e.target) {
      case 'tokens': anyHtml += html; break;
      case 'enemies': enemiesHtml += html; break;
      case 'allies': alliesHtml += html; break;
    }
    
  })*/

  // Handle active effects
  actEffs.forEach(e => {
    
    let html = '';
    
    if (e.target === 'none') targets = [fromUuidSync(origin)];
    
    // Get target ids string
    function _getTargetIds(targets, effTarget) {
      let targetIds = '';
  
      targets.forEach(t => {
        if (targetIds) targetIds += ',';
  
        targetIds += t.id;
      })
  
      return targetIds;
    }

    const targetIds = _getTargetIds(targets, e.target);
    
    // Create the chat button
    html = chatMessageButton({
      action: 'applyEffect',
      originUuid: origin,
      targetIds: targetIds,
      value: '',
      effectUuid: e.uuid
    });
    
    // Assign to group html
    switch (e.target) {
      case 'tokens': anyHtml += html; break;
      case 'enemies': enemiesHtml += html; break;
      case 'allies': alliesHtml += html; break;
      case 'none': noneHtml += html; break;
    }

  })
  
  // Add htmls to finalHtml
  if (singleRoll) {
    if (anyHtml) finalHtml += buttonsHeader(anyHtml, 'Any', !this.item);
    if (enemiesHtml) finalHtml += buttonsHeader(enemiesHtml, 'Enemies', !this.item);
    if (alliesHtml) finalHtml += buttonsHeader(alliesHtml, 'Allies', !this.item);
    if (noneHtml) finalHtml += buttonsHeader(noneHtml, 'None', !this.item);
    
  } else {
    finalHtml += '<div class="chat-buttons">';
    if (anyHtml) finalHtml += anyHtml;
    if (enemiesHtml) finalHtml += enemiesHtml;
    if (alliesHtml) finalHtml += alliesHtml;
    if (noneHtml) finalHtml += noneHtml;
    finalHtml += '</div>';
  }
  
  return finalHtml;
}