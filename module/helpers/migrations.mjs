import { i18n } from './utils.mjs';

export function fullMigration(forced) {
  const lastMigration = game.settings.get('weirdwizard', 'lastMigrationVersion');

  const isNewer = foundry.utils.isNewerVersion;

  // Check if the versions are experimental
  const isLastMigrationExp = lastMigration.includes('-exp');

  // If last migration was done previous to the version indicated, perform the data migration needed
  if (isNewer(isLastMigrationExp ? '2.3.0-exp' : '2.0.0', lastMigration) || forced) effectOverhaul(forced);
  if (isNewer(isLastMigrationExp ? '3.0.0-exp' : '3.0.0', lastMigration) || forced) strToCharOptions(forced);
  if (isNewer(isLastMigrationExp ? '6.0.0-exp' : '6.0.0', lastMigration) || forced) pathsOfJournaling(forced);
  if (isNewer(isLastMigrationExp ? '6.1.0-exp' : '6.1.0', lastMigration) || forced) improvedListEntries(forced);
  if (isNewer(isLastMigrationExp ? '6.2.0-exp' : '6.2.0', lastMigration) || forced) v13Support(forced);
  
}

/* -------------------------------------------- */
/* v13 Support                                  */
/* 6.2.0-exp / 6.2.0                            */
/* -------------------------------------------- */

export async function v13Support(forced) {
  const warning = ui.notifications.warn(
    forced ? 'WW.System.Migration.Forced' : 'WW.System.Migration.Started',
    { format: { version: '6.2.0' }, progress: true }
  );

  // Migrate world actors
  console.log('Migrating world actors');
  await migrateType(game.actors);
  warning.update({ pct: 0.2 });

  // Migrate world itemms
  console.log('Migrating world items');
  await migrateType(game.items);
  warning.update({ pct: 0.5 });

  // Migrate items embedded in world actors
  for (const actor of game.actors) {
    console.log('Migrating items embedded in world actor:', actor.name);
    await migrateType(actor.items, { parent: actor });
  }
  warning.update({ pct: 0.7 });
  
  // Migrate scene token actors (Unlinked/Synthetic/Delta)
  /*for (const scene of game.scenes) {
    console.log('Migrating actors in scene:', scene.name);
    const actors = scene.tokens.map(t => t.actor);
    await migrateType(actors);    
  }
  warning.update({ pct: 0.5 });*/

  // Migrate items embedded in scene token actors
  /*for (const scene of game.scenes) {
    console.log('Migrating items embedded in actors in scene:', scene.name);
    const actors = scene.tokens.map(t => t.actor);
    console.log(actors)
    for (const actor of actors) {
      await migrateType(actor.items, { parent: actor });
    }
  }
  warning.update({ pct: 0.7 });*/

  // Migrate actors and items in packs
  const packsToMigrate = game.packs.filter(p => shouldMigrateCompendium(p));
  for (const pack of packsToMigrate) {
    console.log('Migrating documents inside pack:', pack.title);
    await pack.getDocuments();
    const wasLocked = pack.config.locked;
    if (wasLocked) await pack.configure({ locked: false });
    await migrateType(pack, { pack: pack.collection });
    if (pack.documentName === 'Actor') {
      for (const actor of pack) await migrateType(actor.items, { parent: actor, pack: pack.collection });
    }
    if (wasLocked) await pack.configure({ locked: true });
  }
  warning.update({ pct: 1.0 });

  ui.notifications.remove(warning);
  ui.notifications.success('WW.System.Migration.Finished', { format: { version: '6.2.0' }, permanent: true });
  console.log('Migration complete');
  
  // Update version
  const current = game.system.version != '#{VERSION}#' ? game.system.version : '6.2.0';
  await game.settings.set('weirdwizard', 'lastMigrationVersion', current);
}

/**
 * @typedef {DocumentCollection<Document> | EmbeddedCollection<Document> | CompendiumCollection<Document>} AnyCollection
 */

/**
 * Migrate the types of documents in the collection.
 * From Draw Steel (Thank you all!)
 * @param {AnyCollection} collection
 * @param {object} [options={}]       Options forwarded to the document update operation.
 * @param {string} [options.pack]     Pack to update.
 * @param {Document} [options.parent] Parent of the collection for embedded collections.
 */
export async function migrateType(collection, options = {}) {
  const toMigrate = collection.filter(doc => doc?.getFlag('weirdwizard', 'migrateType')).map(doc => ({
    _id: doc.id,
    type: doc.type,
    '==system': doc.system.toObject(),
    'flags.weirdwizard.-=migrateType': null,
  }));

  // Update in increments of 100
  const batches = Math.ceil(toMigrate.length / 100);

  for (let i = 0; i < batches; i++) {
    const updateData = toMigrate.slice(i * 100, (i + 1) * 100);
    await collection.documentClass.updateDocuments(updateData, { pack: options.pack, parent: options.parent, diff: false });
  }
}

/**
 * Determine whether a compendium pack should be migrated during `migrateWorld`.
 * From Draw Steel (Thank you all!)
 * @param {CompendiumCollection} pack
 * @returns {boolean}
 */
function shouldMigrateCompendium(pack) {
  // We only care about actor and item migrations
  if (!['Actor', 'Item'].includes(pack.documentName)) return false;

  // World compendiums should all be migrated, system ones should never by migrated
  if (pack.metadata.packageType === 'world') return true;
  if (pack.metadata.packageType === 'system') return false;

  // Module compendiums should only be migrated if they don't have a download or manifest URL
  const module = game.modules.get(pack.metadata.packageName);
  return !module.download && !module.manifest;
}

/* -------------------------------------------- */
/* Improved List Entries                        */
/* 6.1.0-exp / 6.1.0                            */
/* -------------------------------------------- */

export async function improvedListEntries(forced) {
  await forced ? _notifyForcedStart() : _notifyStart();
  
  async function _fixItem(item) {
    const grantedFlag = item.flags.weirdwizard?.grantedBy ?? null;

    // Update item
    if (grantedFlag) await item.update({'system.grantedBy': grantedFlag});
    
  }

  // Items Tab
  for (const i of game.items) {
    await _fixItem(i);
  }

  // Actors Tab
  for (const a of game.actors) {

    // Items embedded
    for (const i of a.items) {
      await _fixItem(i);
    }
  }
  
  // Scene Unlinked Tokens
  for (const s of game.scenes) {
    
    for (const t of s.tokens) {
      const a = t.actor;

      if (a) {
        // Items embedded
        for (const i of a.items) {
          await _fixItem(i);
        }
      }
    }
  }
  
  // Packs
  for (const p of game.packs) {
    // Ensure only world packs are affected
    if (p.metadata.packageType === 'world') {

      // Item Packs
      if (p.metadata.type === 'Item') {
        const documents = await p.getDocuments();
        
        for (const i of documents) {
          await _fixItem(i);
        }
      
      // Actor Packs
      } else if (p.metadata.type === 'Actor') {
        const documents = await p.getDocuments();
        
        for (const a of documents) {
          // Items embedded
          for (const i of a.items) {
            await _fixItem(i);
          }
        }
      }
    }
  }
  
  // Update lastMigrationVersion with current version value
  const current = game.system.version != '#{VERSION}#' ? game.system.version : '6.1.0';
  game.settings.set('weirdwizard', 'lastMigrationVersion', current);
  
  _notifyFinish(1000);

}

/* -------------------------------------------- */
/* Paths of Journaling: Exordium                */
/* 6.0.0-exp / 6.0.0                            */
/* -------------------------------------------- */

export async function pathsOfJournaling (forced) {
  await forced ? _notifyForcedStart() : _notifyStart();

  _convertEffectFlagsToSystem();

  await _cOptsItemsToPages();
  
  // Update lastMigrationVersion with current version value
  const current = game.system.version != '#{VERSION}#' ? game.system.version : '6.0.0';
  game.settings.set('weirdwizard', 'lastMigrationVersion', current);

  _notifyFinish(1000);

}

/* Convert Active Effect flags to system and fix duration */
async function _convertEffectFlagsToSystem() {
  
  function _fixEffects(doc) {

    for (const ae of doc.effects) {
      
      const flags = ae.flags.weirdwizard ?? {};
  
      const system = {
        target: flags.target,
        trigger: flags.trigger,
  
        duration: {
          selected: flags.selectedDuration,
          inMinutes: flags.durationInMinutes,
          inHours: flags.durationInHours,
          inDays: flags.durationInDays,
          autoExpire: flags.autoDelete
        }
      };
      
      // Change Luck Ends duration from  1337 to 777
      let rounds = ae.duration.rounds;
      if (rounds === 1337) rounds = 777;

      // Fix rounds if a minute is selected
      const selected = ae.system.duration.selected;

      if (rounds && (selected === 'none' || selected === '1minute' || selected === 'minutes' || selected === 'hours' || selected === 'days')) {
        rounds = null;
      }
  
      // Update document
      ae.update({
        'system': foundry.utils.mergeObject(system, ae.system),
        'duration.rounds': rounds
      })
  
    }
  }

  // Items Tab
  for (const i of game.items) {
    if (i.effects.size) _fixEffects(i);
  }

  // Actors Tab
  for (const a of game.actors) {
    if (a.effects.size) _fixEffects(a);

    // Items embedded
    for (const i of a.items) {
      if (i.effects.size) _fixEffects(i);
    }
  }

  // Scene Unlinked Tokens
  for (const s of game.scenes) {
    
    for (const t of s.tokens) {
      const a = t.actor;

      if (a) {
        if (a?.effects?.size) _fixEffects(a);

        // Items embedded
        for (const i of a.items) {
          if (i.effects.size) _fixEffects(i);
        }
      }
    }
  }

  // Packs
  for (const p of game.packs) {
    if (p.metadata.packageType !== 'world') return; // Ensure only world packs are affected

    // Item Packs
    if (p.metadata.type === 'Item') {
      const documents = await p.getDocuments();

      for (const i of documents) {
        if (i.effects.size) _fixEffects(i);
      }
    
    // Actor Packs
    } else if (p.metadata.type === 'Actor') {
      const documents = await p.getDocuments();

      for (const a of documents) {
        if (a.effects.size) _fixEffects(a);

        // Items embedded
        for (const i of a.items) {
          if (i.effects.size) _fixEffects(i);
        }
      }
    }
  }
  
}

/* Convert Character Options Items to Journal Pages */
async function _cOptsItemsToPages() {

  const folders = {
    legacy: await getFolderByKey('legacy'),
    journal: await getFolderByKey('journal')
  }
  
  // In the Items Tab
  for (const i of game.items.filter(x => x.type === 'Ancestry' || x.type === 'Path' || x.type === 'Profession')) {
    await _cOptItemToPage({item: i, folders: folders});
  }

  // Embbeded to an Actor in Actors Tab
  for (const a of game.actors.filter(x => x.type === 'character')) {
    
    for (const i of a.items.filter(x => x.type === 'Ancestry' || x.type === 'Path' || x.type === 'Profession')) {
      await _cOptItemToPage({item: i, actor: a, folders: folders});
    }

  }

  // Embbeded to an Actor in Scene Unlinked Tokens
  for (const s of game.scenes) {
    
    for (const t of s.tokens) {
      const a = t.actor;
      
      if (a?.type === 'character' && a.isToken) {
        for (const i of a.items.filter(x => x.type === 'Ancestry' || x.type === 'Path' || x.type === 'Profession')) {
          await _cOptItemToPage({item: i, actor: a, folders: folders});
        }
      }

    }
  }

  // Items in Packs
  for (const p of game.packs) {
    if (p.metadata.packageType !== 'world') return; // Ensure only world packs are affected

    const cOpts = await p.getDocuments({ type__in: ['Ancestry', 'Path', 'Profession'] });
    
    // Item in a pack
    for (const i of cOpts) {
      await _cOptItemToPage({item: i, folders: folders});
    }

    // Item embeded in a character in a pack
    const chars = await p.getDocuments({ type: 'character' });
    
    for (const a of chars) {
      
      for (const i of a.items.filter(x => x.type === 'Ancestry' || x.type === 'Path' || x.type === 'Profession')) {
        await _cOptItemToPage({item: i, actor: a, folders: folders});
      }

    }
  }
  
}

async function _cOptItemToPage({ item, actor, folders }) {
  
  // Create for an actor
  if (actor) {
    const entry = await getEntryFromActor(actor, folders.journal);

    const folder = await getFolderByKey(actor.uuid, folders);
    
    const page = entry.pages.get(item.id);
    
    if (!page) {
      const pageData = {
        ...item,
        name: `${item.name} (Converted)`,
        src: item.img,
        _id: item.id,
        type: item.type.toLowerCase(),
        'text.content': item.system.description
      }

      // Create the new page
      const newPage = await JournalEntryPage.create(pageData, { keepId: true, parent: entry });

      switch (newPage.type) {
        case 'ancestry': {
          await actor.update({ 'system.charOptions.ancestry': newPage.uuid });
        }; break;

        case 'path': {
          await actor.update({ ['system.charOptions.' + newPage.system.tier]: newPage.uuid });
        }; break;

        case 'profession': {
          const arr = [...actor.system.charOptions.professions];
          arr.push(newPage.uuid);

          await actor.update({ ['system.charOptions.professions']: arr });
        }; break;
      }

      // Create a legacy copy of the item
      const legacyCopy = await Item.create({
        ...item,
        name: `${item.name} (Legacy/Unusable)`,
        _id: item.id,
        folder: folder
      }, { keepId: true, parent: null });

      // Delete the old item from actor
      await actor.deleteEmbeddedDocuments('Item', [item.id]);
    }
    
  }
  
}

// Create backup folder in the world
function getFolderByKey(key, folders) {
  let name = '', type = '', folder = null, color = null;

  switch (key) {
    case 'legacy': {
      name = '6.0.0: Legacy Items Backup';
      type = 'Item';
      color = '#a70000';
    }; break;

    case 'journal': {
      name = '6.0.0: Converted Char Options';
      type = 'JournalEntry';
      color = '#a70000';
    }; break;

    default: {
      const actor = fromUuidSync(key);

      name = actor.name;
      type = 'Item';
      folder = folders.legacy;
    }; break;
  }
  
  const existingFolder = game.folders.getName(name);
  
  // If folder exists, return it
  if (existingFolder) return existingFolder;

  else {
    const newFolder = Folder.create({
      name: name,
      type: type,
      folder: folder,
      color: color
    });
    
    return newFolder;
  }
  
}

async function getEntryFromActor(actor, folder) {
  const collection = await folder.documentCollection;
  
  let entry = await collection.get(actor.id);
  
  if (!entry) {
    entry = await JournalEntry.create({
      name: `${actor.name}'s Legacy CharOptions`,
      _id: actor.id,
      folder: folder
    }, { keepId: true })
  }
  
  return entry;
}

/* -------------------------------------------- */
/* String to Character Options                  */
/* 3.0.0-exp / 3.0.0                            */
/* -------------------------------------------- */
export function strToCharOptions(forced) {
  forced ? _notifyForcedStart() : _notifyStart();

  // Actors Tab
  for (const a of game.actors) {
    _charOptionsFromStr(a, a.system.details.ancestry, 'Ancestry');
    _charOptionsFromStr(a, a.system.details.professions, 'Profession');
    _charOptionsFromStr(a, a.system.details.novice, 'Path', 'novice');
    _charOptionsFromStr(a, a.system.details.expert, 'Path', 'expert');
    _charOptionsFromStr(a, a.system.details.master, 'Path', 'master');
  }
  
  // Scene Unlinked Tokens
  for (const s of game.scenes) {
    
    for (const t of s.tokens) {
      const a = t.actor;

      if (a) {
        _charOptionsFromStr(a);
      }
    }
  }

  // Update lastMigrationVersion with current version value
  const current = game.system.version != '#{VERSION}#' ? game.system.version : '3.0.0';
  game.settings.set('weirdwizard', 'lastMigrationVersion', current);

  _notifyFinish();
}

/**
 * @actor     A target Actor document
*/
function _charOptionsFromStr(actor, oldString, type, tier) {
  
  if (oldString && typeof oldString === 'string') { // Make sure it's a string and not empty

    // Split string in an array
    const arr = oldString.split(',');

    // Create item data array and push each profession
    const itemDataArr = [];
    arr.forEach(i => itemDataArr.push({
      name: i.trim(),
      type: type,
      system: {
        tier: tier
      }
    }));

    // Create a array of items on the actor
    actor.createEmbeddedDocuments('Item', itemDataArr);
    
  }
  
}

/* -------------------------------------------- */
/* Effect Overhaul                              */
/* 2.3.0-exp / 2.0.0                            */
/* -------------------------------------------- */

export function effectOverhaul(forced) {
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

/* -------------------------------------------- */
/* Notification Functions                       */
/* -------------------------------------------- */

function _notifyStart() { ui.notifications.warn(i18n('WW.System.Migration.Started')); }

function _notifyForcedStart() { ui.notifications.warn(i18n('WW.System.Migration.Forced')); }

function _notifyFinish(delay=3000) { setTimeout(function(){ ui.notifications.warn(i18n('WW.System.Migration.Finished')); }, delay); }

