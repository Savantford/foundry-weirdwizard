import { i18n } from './utils.mjs'

export default function migrateWorld(forced) {
  const lastMigration = game.settings.get('weirdwizard', 'lastMigrationVersion');

  const isNewer = foundry.utils.isNewerVersion;

  // Check if the versions are experimental
  let isLastMigrationExp = lastMigration.includes('-exp') ? true : false;

  // If last migration was done previous to the version indicated, perform the data migration needed
  //if (isNewer(isLastMigrationExp ? '3.0.0-exp' : '3.0.0', lastMigration) || forced) _charOptions(forced);
  if (isNewer(isLastMigrationExp ? '2.3.0-exp' : '2.0.0', lastMigration) || forced) _effectOverhaul(forced);
  //if (isNewer(isLastMigrationExp ? '3.0.0-exp' : '2.1.0', lastMigration) || forced) _preReleaseDraft(forced);
  
}

/* ----------------------------------------------------- */

/* Character Options (3.0.0-exp / 3.0.0) */
/*function _charOptions(forced) {
  forced ? _notifyForcedStart() : _notifyStart();

  // Actors Tab
  for (const a of game.actors) {
    updateProfessions(a);
  }
  
  // Scene Unlinked Tokens
  for (const s of game.scenes) {
    
    for (const t of s.tokens) {
      const a = t.actor;
      if (a) {
        updateChanges(a);
        
        for (const i of a.items) {
          updateChanges(i);
          convertInstEffs(i);
        }
      }
    }
  }

  // Compendium Packs
  //game.packs.actors
  
  // Update lastMigrationVersion with current version value
  const current = game.system.version != '#{VERSION}#' ? game.system.version : '3.0.0';
  game.settings.set('weirdwizard', 'lastMigrationVersion', current);

  _notifyFinish();
}*/

/**
 * @actor     A target Actor document
*/
/*function updateProfessions(actor) {
  const professions = actor.system.details.professions;
  console.log(professions)
  /*for (const e of doc.effects) {
    let changes = [];

    for (let c of e.changes) {

      // Return if key is already updated or undefined
      if (!c.key.includes('system') || !c.key) return;
      c.key = _convertKey(c);
      changes.push(c)
      
    }
    
    e.update({ 'changes': changes } )
  }*/
//}*/

/* ----------------------------------------------------- */

/* Effect Overhaul (2.3.0-exp / 2.0.0) */
function _effectOverhaul(forced) {
  forced ? _notifyForcedStart() : _notifyStart();

  // Actors Tab
  for (const a of game.actors) {
    updateChanges(a);

    for (const i of a.items) {
      updateChanges(i);
      convertInstEffs(i);
    }
  }

  // Items Tab
  for (const i of game.items) {
    updateChanges(i);
    convertInstEffs(i);
  }
  
  // Scene Unlinked Tokens
  for (const s of game.scenes) {
    
    for (const t of s.tokens) {
      const a = t.actor;
      if (a) {
        updateChanges(a);
        
        for (const i of a.items) {
          updateChanges(i);
          convertInstEffs(i);
        }
      }
    }
  }

  // Compendium Packs
  //game.packs.actors.effects
  //game.packs.actors.items.effects
  //game.packs.items.effects
  
  // Update lastMigrationVersion with current version value
  const current = game.system.version != '#{VERSION}#' ? game.system.version : '2.3.0';
  game.settings.set('weirdwizard', 'lastMigrationVersion', current);

  _notifyFinish();
}

/**
 * @doc     A target Actor or Item document
*/
function updateChanges(doc) {
  
  for (const e of doc.effects) {
    let changes = [];

    for (let c of e.changes) {

      // Return if key is already updated or undefined
      if (!c.key.includes('system') || !c.key) return;
      c.key = _convertKey(c);
      changes.push(c)
      
    }
    
    e.update({ 'changes': changes } )
  }
}

/**
 * @doc     A target Item document
*/
function convertInstEffs(doc) {
  let instEffs = doc.system.instant;

  if ('damage' in doc.system) {
    instEffs.push(_makeInstEff('damage', doc.system.damage))
  }

  if ('healing' in doc.system) {
    instEffs.push(_makeInstEff('heal', doc.system.healing))
  }

  if ('affliction' in doc.system) {
    instEffs.push(_makeInstEff('affliction', '', doc.system.affliction))
  }

  doc.update({ 'system.instant': instEffs } )
}

function _makeInstEff(label,value,affliction = '') {
  return {
    label: label,
    trigger: 'onUse',
    target: 'tokens',
    value: value,
    affliction: affliction
  }
}

function _convertKey(change) {
  const oldKey = change.key;
  let newKey = '';
  
  for (let [k,cat] of Object.entries(CONFIG.WW.EFFECT_OPTIONS)) { 
    
    for (let [k,v] of Object.entries(cat.options)) {

      // Look for a matching key
      if (v.key === oldKey) { // Match found
        
        if (v.key.includes('boons') && v.key.includes('global')) { // If key modified global boons

          if (parseInt(change.value) < 0 && k.includes('bane')) { // If key imposed banes
            newKey = k;
            break;
          } else if (parseInt(change.value) >= 0 && k.includes('boon')) { // If key granted boons
            newKey = k;
            break;
          }
        
        } else { // If match includes boon or bane
          newKey = k;
          break;
        }
      } else { // Match not found
        if (oldKey.includes('defense.total')) {
          
          if (change.mode == 2) {
            newKey = 'defense.bonus';
            break;

          } else if (change.mode == 4 || change.mode == 5) {
            newKey = 'defense.armored';
            break;
          }
        } else if (oldKey.includes('defense.natural')) {
          
          if (change.mode == 2) {
            newKey = change.value < 0 ? 'defense.naturalReduce' : 'defense.naturalIncrease';
            break;

          } else if (change.mode == 4 || change.mode == 5) {
            newKey = 'defense.natural';
            break;
          }
        }
      }
    }
  }

  return newKey;
}

/* ----------------------------------------------------- */

/* Rules revised on the Pre Release Draft (2.1.0) */
/*function _preReleaseDraft(forced) {
  forced ? _notifyForcedStart() : _notifyStart();

  // Actors Tab
  for (const a of game.actors) {

    for (const i of a.items) {
      if (i.type === "Equipment") updateProperties(i);
    }
  }

  // Items Tab
  for (const i of game.items) {
    if (i.type === "Equipment") updateProperties(i);
  }
  
  // Scene Unlinked Tokens
  for (const s of game.scenes) {
    
    for (const t of s.tokens) {
      const a = t.actor;
      if (a) {
        
        for (const i of a.items) {
          if (i.type === "Equipment") updateProperties(i);
        }
      }
    }
  }

  // Compendium Packs
  //game.packs.actors.effects
  //game.packs.actors.items.effects
  //game.packs.items.effects
  
  // Update lastMigrationVersion with current version value
  const current = game.system.version != '#{VERSION}#' ? game.system.version : '2.3.0';
  game.settings.set('weirdwizard', 'lastMigrationVersion', current);

  _notifyFinish();
}*/

/**
 * @doc     A target Item document
*/
function updateProperties(doc) {
  console.log(doc)
  let traits = {};
  let advantages = {};
  let disadvantages = {};

  const traitsList = ['ammunition', 'brutal', 'firearm', 'long', 'nimble', 'precise', 'range', 'sharp', 'shattering', 'thrown', 'versatile'];
  const advantagesList = ['disarming', 'driving'];
  const disadvantagesList = ['light', 'reload', 'slow'];
  const properties = doc.system.properties;

  for (const p of Object.keys(properties)) {
    
    // Assign traits
    if (p === 'concussing' && properties[p]) traits['shattering'] = true;
    if (p === 'fast' && properties[p]) traits['precise'] = true;
    if (p === 'great' && properties[p]) traits['forceful'] = true;
    if (p === 'painful' && properties[p]) traits['special'] = true;
    if (p === 'unbalancing' && properties[p]) traits['forceful'] = true;
    if (traitsList.includes(p) && properties[p]) traits[p] = true;

    // Assign advantages
    if (advantagesList.includes(p) && properties[p]) advantages[p] = true;

    // Assign disadvantages
    if (disadvantagesList.includes(p) && properties[p]) disadvantages[p] = true;
    
  }

  doc.update({
    'system.traits': traits,
    'system.advantages': advantages,
    'system.disadvantages': disadvantages
  })

  console.log(traits)
  console.log(advantages)
  console.log(disadvantages)
}

/* ----------------------------------------------------- */

function _notifyStart() { ui.notifications.warn(i18n("WW.System.Migration.Started")); }

function _notifyForcedStart() { ui.notifications.warn(i18n("WW.System.Migration.Forced")); }

function _notifyFinish() { ui.notifications.warn(i18n("WW.System.Migration.Finished")); }

