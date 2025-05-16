import QuestCalendar from "./quest-calendar.mjs";
/**
 * Extend Application to make a Sage Tools app
 * @extends {Application}
*/
export default class SageTools extends Application {

  static get defaultOptions() {

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['weirdwizard form'],
      popOut: true,
      submitOnChange: true,
      closeOnSubmit: false,
      minimizable: false,
      template: 'systems/weirdwizard/templates/apps/sage-tools.hbs',
      id: 'sage-tools',
      title: 'Sage Tools',
      width: 320,
      height: 'auto',
      top: 220,
      left: 120,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'scene' }]
    });

  }

  async getData(options = {}) {
    const context = super.getData();

    // Prepare users
    context.users = [];
    
    for (const user of game.users) {
      if (!user.isGM) context.users.push({
        name: user.name,
        avatar: user.avatar,
        character: user.character ? user.character : null,
        folderActors: game.actors.filter(a => a.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)).filter(a => !user.character),
        sceneActors: game.scenes.viewed.tokens.filter(a => a.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER))
      });
      
    }

    context.combat = game.combat;
    context.worldTime = game.weirdwizard.utils.formatTime(game.time.worldTime);

    context.index = {
      charOptions: await TextEditor.enrichHTML(`
        index:charopts
        index:traits
        index:talents
        index:spells
      `),
      equipment: await TextEditor.enrichHTML(`
        index:armor
        index:weapons
        index:hirelings
      `),
    }

    return await context;
  }

  /** @inheritdoc */
  /*_getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    const canConfigure = game.user.isGM;

    if (canConfigure) {
      const closeIndex = buttons.findIndex(btn => btn.label === "Close");
      buttons.splice(closeIndex, 0, {
        label: "QC.Settings.Label",
        class: "configure-app",
        icon: "fas fa-cog",
        onclick: ev => this._onConfigureApp(ev)
      });

      buttons.splice(closeIndex, 0, {
        label: "QC.Reset.Label",
        class: "reset-app",
        icon: "fas fa-eraser",
        onclick: ev => this._reset(ev)
      });
    }

    return buttons;
  }*/

  /* -------------------------------------------- */
  /*  Event Listeners                             */
  /* -------------------------------------------- */

  activateListeners(html) {
    super.activateListeners(html);

    // Handle buttons
    html.find('.button').click(ev => this._onButtonClick(ev));

    // Quest Calendar
    html.find('.quest-calendar').click(ev => QuestCalendar.toggleVis('toggle'));
  }

  /**
   * Handle actor button clicks
   * @param {PointerEvent} event      The originating click event
   * @private
   */
  _onButtonClick(event) {
    const el = event.currentTarget,
      dataset = el.dataset;

    switch(dataset.action) {

      // Open an actor sheet
      case 'open-sheet': {
        const doc = fromUuidSync(dataset.uuid);
        if (doc instanceof TokenDocument) { doc.actor.sheet.render(true) } else doc.sheet.render(true);
      }; break;
      
      // Activate the Combat tab
      case 'combat-tab': {
        ui.combat.activate();
      }; break;

      // Open a Combat Tracker pop up
      case 'combat-popout': {
        ui.combat.renderPopout();
      }; break;

      case 'advance-time': {
        game.time.advance(60);
      }; break;

    }
    
    this.render(true);
    
  }

  /* -------------------------------------------- */
  /*  Misc Functions                              */
  /* -------------------------------------------- */

  // Toggle visibility of the main window.
  static async toggleVis(mode) {
    //if (!game.modules.get('sagetools')?.viewAuth) return;
    if (!ui?.sagetools) ui.sagetools = new SageTools();
    
    if (mode === 'toggle') {
      // If Visible is true and app is rendered
      if (game.settings.get('sagetools', 'visible') === true && ui.sagetools.rendered) {
        // Stop any currently-running animations, and then animate the app
        // away before close(), to avoid the stock close() animation.
        $('#sage-tools').stop();
        $('#sage-tools').css({ animation: 'close 0.2s', opacity: '0' });
        setTimeout(function () {
          // Pass an object to .close() to indicate that it came from sage-tools,
          // and not from an Escape keypress.
          ui.sagetools.close({ sagetools: true });
          
        }, 200);
        game.settings.set('sagetools', 'visible', false);
      } else {
        // Make sure there isn't already an instance of the app rendered.
        // Fire off a close() just in case, clears up some stuck states.
        if (ui.sagetools.rendered) {
          ui.sagetools.close({ sagetools: true });
        }

        ui.sagetools.render(true);
        game.settings.set('sagetools', 'visible', true);
      }
      
    } else if (game.settings.get('sagetools', 'visible') === true) {
      ui.sagetools.render(true);
    }
  }

  /* Utility */

  setting(name) {
    return game.settings.get('sagetools', name)
  }

  async _reset() {
    const confirm = await Dialog.confirm({
      title: i18n('QC.Reset.Title'),
      content: i18n('QC.Reset.Msg') + '<p class="qc-dialog-sure">' + i18n('QC.Reset.Confirm') + '</p>'
    });

    if (confirm) { return adv(-this.world) } else { return };
  }

}