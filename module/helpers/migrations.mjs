import { i18n } from './utils.mjs'

export default function migrateWorld(forced) {
  const lastMigration = game.settings.get('weirdwizard', 'lastMigrationVersion');
  //const current = game.system.version
  const current = game.system.version != '#{VERSION}#' ? game.system.version : '2.3.0';

  const isNewer = foundry.utils.isNewerVersion;

  // Check if the versions are experimental
  //let isCurrentExp = current.includes('-exp') ? true : false;
  let isLastMigrationExp = lastMigration.includes('-exp') ? true : false;

  // If last migration was done previous to the version indicated, perform the data migration needed
  if (isNewer(isLastMigrationExp ? '2.3.0-exp' : '2.0.0', lastMigration) || forced) _effectOverhaul(forced);
  
}

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
  game.settings.set('weirdwizard', 'lastMigrationVersion', 'current');

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
  console.log(instEffs)

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

function _notifyStart() { ui.notifications.warn(i18n("WW.System.Migration.Started")); }

function _notifyForcedStart() { ui.notifications.warn(i18n("WW.System.Migration.Forced")); }

function _notifyFinish() { ui.notifications.warn(i18n("WW.System.Migration.Finished")); }

function _convertKey(change) {
  const oldKey = change.key;
  let newKey = '';
  
  for (let [k,cat] of Object.entries(CONFIG.WW.effOptions)) { 
    
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