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
    case 'roll-damage': {
      loc += 'Damage';
      break;
    }
    case 'roll-healing': {
      loc += 'Healing';
      break;
    }
    case 'roll-health-loss': {
      loc += 'HealthLoss';
      break;
    }
    case 'roll-health-regain': {
      loc += 'HealthRegain';
      break;
    }
    case 'apply-affliction': {
      icon = 'skull-crossbones';
      loc = 'WW.InstantEffect.Affliction';
      break;
    }
    /* Apply Actions */
    case 'apply-damage': {
      img = '/systems/weirdwizard/assets/icons/rough-wound-black.svg';
      loc += 'Damage';
      showNo = false;
      break;
    }
    case 'apply-damage-half': {
      img = '/systems/weirdwizard/assets/icons/slashed-shield-black.svg';
      loc += 'Half';
      showNo = false;
      break;
    }
    case 'apply-damage-double': {
      img = '/systems/weirdwizard/assets/icons/cross-mark-black.svg';
      loc += 'Double';
      showNo = false;
      break;
    }
    case 'apply-healing': {
      img = '/systems/weirdwizard/assets/icons/caduceus-black.svg';
      loc += 'Healing';
      showNo = false;
      break;
    }
    case 'apply-health-loss': {
      img = '/systems/weirdwizard/assets/icons/health-decrease-black.svg';
      loc += 'LoseHealth';
      showNo = false;
      break;
    }
    case 'apply-health-regain': {
      img = '/systems/weirdwizard/assets/icons/health-increase-black.svg';
      loc += 'RegainHealth';
      showNo = false;
      break;
    }
    case 'apply-effect': {
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
    '<i class="fas fa-' + icon + '"></i>' +
    i18n(loc) + (effectUuid ? ': ' + fromUuidSync(effectUuid)?.name : '') +
    (showNo ? (': ' + value) : '') + '</div>';
  }
  
  return html;
}

export function chatMessageButtonArray({value, originUuid, targetIds}) {
  const actions = ['apply-damage', 'apply-damage-half', 'apply-damage-double', 'apply-healing']
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
    case ('damage'): action = 'roll-damage'; break;
    case ('heal'): action = 'roll-healing'; break;
    case ('healthLose'): action = 'roll-health-loss'; break;
    case ('healthRegain'): action = 'roll-health-regain'; break;
    case ('affliction'): action = 'apply-affliction'; break;
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
    case 'roll-damage': {
      data.loc += 'Damage';
      break;
    }
    case 'roll-healing': {
      data.loc += 'Healing';
      break;
    }
    case 'roll-health-loss': {
      data.loc += 'HealthLoss';
      break;
    }
    case 'roll-health-regain': {
      data.loc += 'HealthRegain';
      break;
    }
    case 'apply-affliction': {
      data.icon = 'skull-crossbones';
      data.loc = 'WW.InstantEffect.Affliction';
      break;
    }
    /* Apply Actions */
    case 'apply-damage': {
      data.img = '/systems/weirdwizard/assets/icons/rough-wound-black.svg';
      data.loc += 'Damage';
      data.showNo = false;
      break;
    }
    case 'apply-damage-half': {
      data.img = '/systems/weirdwizard/assets/icons/slashed-shield-black.svg';
      data.loc += 'Half';
      data.showNo = false;
      break;
    }
    case 'apply-damage-double': {
      data.img = '/systems/weirdwizard/assets/icons/cross-mark-black.svg';
      data.loc += 'Double';
      data.showNo = false;
      break;
    }
    case 'apply-healing': {
      data.img = '/systems/weirdwizard/assets/icons/caduceus-black.svg';
      data.loc += 'Healing';
      data.showNo = false;
      break;
    }
    case 'apply-health-loss': {
      data.img = '/systems/weirdwizard/assets/icons/health-decrease-black.svg';
      data.loc += 'LoseHealth';
      data.showNo = false;
      break;
    }
    case 'apply-health-regain': {
      data.img = '/systems/weirdwizard/assets/icons/health-increase-black.svg';
      data.loc += 'RegainHealth';
      data.showNo = false;
      break;
    }
    case 'apply-effect': {
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
  
  const flags = effect.flags.weirdwizard;
  const data = {
    action: 'apply-effect',
    uuid: effect.uuid,
    trigger: flags.trigger,
    //icon: 'dice',
    //img: '',
    //loc: 'WW.InstantEffect.Button.',
    //showNo: true
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
      action: 'apply-effect',
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