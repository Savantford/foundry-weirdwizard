import WWDialog from "../apps/dialog.mjs";
import { i18n, sysPath } from "../helpers/utils.mjs";
import QuestCalendar from "./quest-calendar.mjs";

// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const ApplicationV2 = foundry.applications?.api?.ApplicationV2 ?? (class {});
const HandlebarsApplicationMixin = foundry.applications?.api?.HandlebarsApplicationMixin ?? (cls => cls);

/**
 * Extend FormApplication to make windows to display a compendium more neatly
 * @extends {ApplicationV2}
*/

export default class SageTools extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'sage-tools',
    tag: 'form',
    classes: ['weirdwizard'],
    window: {
      title: 'WW.Sage.Title',
      icon: 'fa-solid fa-wand-sparkles',
      contentClasses: ['standard-form'],
      controls: [
          {
            action: "resync",
            icon: "fa-solid fa-rotate",
            label: "WW.Sage.Resync",
            ownership: "OWNER"
          }
        ]
    },
    actions: {
      advanceTime: this.#resync,
      // Trackers tab
      advanceTime: this.#advanceGameTime,
      openCalendar: this.#openQuestCalendar,
      combatTab: this.#activateCombatTab,
      combatPopout: this.#openCombatPopout,

      // Players Tab
      openSheet: this.#openSheet
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width: 360,
      height: 'auto',
      top: 220,
      left: 120
    }
  }

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: 'trackers', icon: 'fa-solid fa-stopwatch' },
        { id: 'players', icon: 'fa-solid fa-address-card' },
        { id: 'index', icon: 'fa-solid fa-table-list' }
      ],
      initial: 'trackers',
      labelPrefix: 'WW.Sage.Tabs',
    },
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    tabs: {
      template: 'templates/generic/tab-navigation.hbs' // Foundry-provided generic template
    },
    trackers: {
      template: sysPath('templates/apps/sage/trackers.hbs')
    },
    players: {
      template: sysPath('templates/apps/sage/players.hbs')
    },
    index: {
      template: sysPath('templates/apps/sage/index.hbs')
    },
    bug: {
      template: sysPath('templates/bug.hbs')
    }
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    // One tab group means ApplicationV2#_prepareContext will populate `tabs`
    const context = await super._prepareContext(options);

    Object.assign(context, {
      tabGroups: this.tabGroups,
      
    });
    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    if (partId in context.tabs) context.tab = context.tabs[partId];

    switch (partId) {
      case "trackers":
        context.combat = game.combat;
        context.worldTime = game.weirdwizard.utils.formatTime(game.time.worldTime);
      break;
      
      case "players":
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
      break;

      case "index":
        const TextEditor = foundry.applications.ux.TextEditor.implementation;

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
      break;
    }
    return context;
  }

  /* -------------------------------------------------- */
  /*   Actions                                          */
  /* -------------------------------------------------- */

  /**
   * Resync the app's data by re-rendering (Better solution pending)
   *
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #resync(event, target) {
    this.render(true);
  }

  /* -------------------------------------------------- */

  /**
   * Open the specified actor sheet
   *
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #openSheet(event, target) {
    const doc = fromUuidSync(target.dataset.uuid);
    if (doc instanceof TokenDocument) { doc.actor.sheet.render(true) } else doc.sheet.render(true);
  }

  /* -------------------------------------------------- */

  /**
   * Activate the Combat Tracker tab
   *
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #activateCombatTab(event, target) {
    ui.combat.activate();
  }

  /* -------------------------------------------------- */

  /**
   * Open the Combat Tracker popout
   *
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #openCombatPopout(event, target) {
    ui.combat.renderPopout();
  }

  /* -------------------------------------------------- */

  /**
   * Advance the Game Time by 1 minute
   *
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #advanceGameTime(event, target) {
    await game.time.advance(60);

    this.render(true);
  }

  /* -------------------------------------------------- */

  /**
   * Open the Quest Calendar app
   *
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   */
  static async #openQuestCalendar(event, target) {
    target.find('.quest-calendar').click(ev => QuestCalendar.toggleVis('toggle'));
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

}