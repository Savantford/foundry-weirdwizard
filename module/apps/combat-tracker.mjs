import { i18n } from '../helpers/utils.mjs'
import WWCombatTrackerConfig from './combat-config.mjs'

/**
 * The sidebar directory which organizes and displays world-level Combat documents.
*/

export default class WWCombatTracker extends CombatTracker {
  constructor(options) {
    super(options);
    if ( !this.popOut ) game.combats.apps.push(this);

    /**
     * Record a reference to the currently highlighted Token
     * @type {Token|null}
     * @private
     */
    this._highlighted = null;

    /**
     * Record the currently tracked Combat encounter
     * @type {Combat|null}
     */
    this.viewed = null;

    // Initialize the starting encounter
    this.initialize({render: false});
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  /** @override */

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'combat',
      template: 'systems/weirdwizard/templates/apps/combat-tracker.hbs',
      title: 'COMBAT.SidebarTitle',
      scrollY: ['.directory-list']
    });
  }

  /* -------------------------------------------- */

  /**
   * Return an array of Combat encounters which occur within the current Scene.
   * @type {Combat[]}
   */
  get combats() {
    return game.combats.combats;
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /** @inheritdoc */
  createPopout() {
    const pop = super.createPopout();
    pop.initialize({combat: this.viewed, render: true});
    return pop;
  }

  /* -------------------------------------------- */

  /**
   * Initialize the combat tracker to display a specific combat encounter.
   * If no encounter is provided, the tracker will be initialized with the first encounter in the viewed scene.
   * @param {object} [options]                   Additional options to configure behavior.
   * @param {Combat|null} [options.combat=null]  The combat encounter to initialize
   * @param {boolean} [options.render=true]      Whether to re-render the sidebar after initialization
   */
  initialize({combat=null, render=true}={}) {

    // Retrieve a default encounter if none was provided
    if ( combat === null ) {
      const combats = this.combats;
      combat = combats.length ? combats.find(c => c.active) || combats[0] : null;
      combat?.updateCombatantActors();
    }

    // Prepare turn order
    if ( combat && !combat.turns ) combat.turns = combat.setupTurns();

    // Set flags
    this.viewed = combat;
    this._highlighted = null;

    // Also initialize the popout
    if ( this._popout ) {
      this._popout.viewed = combat;
      this._popout._highlighted = null;
    }

    // Render the tracker
    if ( render ) this.render();
  }

  /* -------------------------------------------- */

  /**
   * Scroll the combat log container to ensure the current Combatant turn is centered vertically
   */
  scrollToTurn() {
    const combat = this.viewed;
    if ( !combat || (combat.turn === null) ) return;
    let active = this.element.find('.active')[0];
    if ( !active ) return;
    let container = active.parentElement;
    const nViewable = Math.floor(container.offsetHeight / active.offsetHeight);
    container.scrollTop = (combat.turn * active.offsetHeight) - ((nViewable/2) * active.offsetHeight);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData(options={}) {
    let context = await super.getData(options);

    // Get the combat encounters possible for the viewed Scene
    const combat = this.viewed;
    const hasCombat = combat !== null;
    const combats = this.combats;
    const currentIdx = combats.findIndex(c => c === combat);
    const previousId = currentIdx > 0 ? combats[currentIdx-1].id : null;
    const nextId = currentIdx < combats.length - 1 ? combats[currentIdx+1].id : null;
    const settings = game.settings.get('core', Combat.CONFIG_SETTING);

    // Prepare rendering data
    context = foundry.utils.mergeObject(context, {
      combats: combats,
      currentIndex: currentIdx + 1,
      combatCount: combats.length,
      hasCombat: hasCombat,
      combat,
      turns: [],
      previousId,
      nextId,
      started: this.started,
      control: false,
      settings,
      linked: combat?.scene !== null,
      labels: {}
    });
    context.labels.scope = game.i18n.localize(`COMBAT.${context.linked ? 'Linked' : 'Unlinked'}`);
    if ( !hasCombat ) return context;

    // Format information about each combatant in the encounter
    let hasDecimals = false;
    const turns = [];
    for ( let [i, combatant] of combat.turns.entries() ) {
      if ( !combatant.visible ) continue;
      
      // Prepare turn data
      const resource = combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resource : null,
        resourceMax = combatant.permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resourceMax : null;
      
      const phaseInit = (x => {
        const init = combatant.initiative;
        if (init >= 200) return init - 200
        else if (init >= 100) return init -100
        else return init;
      })
      
      const turn = {
        id: combatant.id,
        name: combatant.name,
        img: await this._getCombatantThumbnail(combatant),
        active: i === combat.turn,
        owner: combatant.isOwner,
        defeated: combatant.isDefeated,
        hidden: combatant.hidden,
        initiative: combatant.initiative,
        phaseInit: phaseInit(),
        hasRolled: combatant.initiative !== null,
        hasResource: resource !== null,
        resource: resource,
        resourceMax: resourceMax,
        canPing: (combatant.sceneId === canvas.scene?.id) && game.user.hasPermission('PING_CANVAS'),
        type: combatant.actor?.type,
        flags: combatant.flags
      };
      if ( (turn.initiative !== null) && !Number.isInteger(turn.initiative) ) hasDecimals = true;
      turn.css = [
        turn.active ? 'active' : '',
        turn.hidden ? 'hidden' : '',
        turn.defeated ? 'defeated' : ''
      ].join(' ').trim();

      // Actor and Token status effects
      turn.effects = new Set();
      if ( combatant.token ) {
        combatant.token.effects.forEach(e => turn.effects.add(e));
        if ( combatant.token.overlayEffect ) turn.effects.add(combatant.token.overlayEffect);
      }
      if ( combatant.actor ) {
        for ( const effect of combatant.actor.temporaryEffects ) {
          if ( effect.statuses.has(CONFIG.specialStatusEffects.DEFEATED) ) turn.defeated = true;
          else if ( effect.icon ) turn.effects.add(effect.icon);
        }
      }
      turns.push(turn);
    }

    // Format initiative numeric precision
    const precision = CONFIG.Combat.initiative.decimals;
    turns.forEach(t => {
      if ( t.initiative !== null ) t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
    });

    // Merge update data for rendering
    return foundry.utils.mergeObject(context, {
      round: combat.round,
      turn: combat.turn,
      turns: turns,
      control: combat.combatant?.players?.includes(game.user)
    });
  }


  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    // Display Combat settings (@override)
    html.find('.combat-settings').off('click').click(ev => {
      ev.preventDefault();
      new WWCombatTrackerConfig().render(true);
    });

    // Acted button
    html.find('.combatant-acted').click(ev => this._onCombatantActed(ev));

    // Taking button
    html.find('.combatant-taking').click(ev => this._onCombatantTaking(ev));
  }

  /* -------------------------------------------- */

  /**
   * Handle a Combatant acted toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _onCombatantActed(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest('.combatant');
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);
    const acted = c.flags.weirdwizard?.acted ? c.flags.weirdwizard.acted : false;
    
    // Combatant status logic
    if (combat.current.combatantId == li.dataset.combatantId) { // Combatant is the current turn
      combat.nextTurn();
      
    } else if (acted) { // Combatant already acted
      // Make sure you want to take the turn
      const confirm = await Dialog.confirm({
        title: i18n('WW.Combat.ActAgain.Title'),
        content: i18n('WW.Combat.ActAgain.Msg') + '<p class="dialog-sure">' + i18n('WW.Combat.ActAgain.Confirm') + '</p>'
      });

      if(!confirm) return;

      await c.setFlag('weirdwizard', 'acted', !acted);
    } else { // Combatant did not act yet

      // Make sure you want to take the turn
      const confirm = await Dialog.confirm({
        title: i18n('WW.Combat.StartTurn.Title'),
        content: i18n('WW.Combat.StartTurn.Msg') + '<p class="dialog-sure">' + i18n('WW.Combat.StartTurn.Confirm') + '</p>'
      });

      if(!confirm) return;

      await combat.update({'turn': combat.turns.findIndex(c => c.id === li.dataset.combatantId)})
    }
  
    //this.render();

    // Push the acted status to the token
    const token = c.token;
    if ( !token ) return;

    const status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.ACTED);
    if ( !status && !token.object ) return;
    const effect = token.actor && status ? status : CONFIG.controlIcons.acted;
    /*if ( token.object ) await token.object.toggleEffect(effect, {overlay: true, active: acted});
    else await token.toggleActiveEffect(effect, {overlay: true, active: acted});*/

  }

  /**
   * Handle a Combatant taking toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _onCombatantTaking(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest('.combatant');
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);
    
    // Flip takingInit
    const taking = c.flags.weirdwizard?.takingInit ? !c.flags.weirdwizard.takingInit : true;
    //await c.update({'flags.weirdwizard.takingInit': taking})
    await c.setFlag('weirdwizard', 'takingInit', taking)
    //this.render();

    // Push the taking initiative status to the token
    const token = c.token;
    if ( !token ) return;
    
    const status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.TAKINGINITIATIVE);
    if ( !status && !token.object ) return;
    const effect = token.actor && status ? status : CONFIG.controlIcons.takingInit;
    /*if ( token.object ) await token.object.toggleEffect(effect, {overlay: true, active: taking});
    else await token.toggleActiveEffect(effect, {overlay: true, active: taking});*/
    
    // Send to chat
    ChatMessage.create({
      content: '<div><b>' + token.actor.name + '</b> ' + (taking ? i18n('WW.Combat.InitiativeMsg') : i18n('WW.Combat.TurnMsg')) + '.</div>',
      sound: CONFIG.sounds.notification
    });

    // Reorder turns
    combat.setAll();
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling the defeated status effect on a combatant Token
   * @param {Combatant} combatant     The combatant data being modified
   * @returns {Promise}                A Promise that resolves after all operations are complete
   * @private
   */
  /*async _onToggleDefeatedStatus(combatant) {
    const isDefeated = !combatant.isDefeated;
    await combatant.update({defeated: isDefeated});
    const token = combatant.token;
    if ( !token ) return;

    // Push the defeated status to the token
    const status = CONFIG.statusEffects.find(e => e.id === CONFIG.specialStatusEffects.DEFEATED);
    if ( !status && !token.object ) return;
    const effect = token.actor && status ? status : CONFIG.controlIcons.defeated;
    if ( token.object ) await token.object.toggleEffect(effect, {overlay: true, active: isDefeated});
    else await token.toggleActiveEffect(effect, {overlay: true, active: isDefeated});
  }*/

}