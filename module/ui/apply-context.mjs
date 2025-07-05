import { i18n } from "../helpers/utils.mjs";
/**
 * Extend ContextMenu to make a custom context menu with localized header labels
 * @extends {ContextMenu}
*/

export default class ApplyContext extends ContextMenu {

  /**
   * Render the Context Menu by iterating over the menuItems it contains.
   * Check the visibility of each menu item, and only render ones which are allowed by the item's logical condition.
   * Attach a click handler to each item which is rendered.
   * @param {jQuery} target     The target element to which the context menu is attached
   */
  render(target) {
    const existing = $("#context-menu");
    let html = existing.length ? existing : $('<nav id="context-menu"></nav>');
    let ol = $('<ol class="context-items"></ol>');
    html.html(ol);

    if ( !this.menuItems.length ) return;

    const groups = this.menuItems.reduce((acc, entry) => {
      const group = entry.group ?? "_none";
      acc[group] ??= [];
      acc[group].push(entry);
      return acc;
    }, {});

    for ( const [group, entries] of Object.entries(groups) ) {
      let parent = ol;
      if ( group !== "_none" ) {
        const groupIcon = CONFIG.WW.APPLY_CONTEXT_ICONS[group];
        const groupHeader = i18n(CONFIG.WW.APPLY_CONTEXT_HEADERS[group]);
        const groupItem = $(`<li class="context-group" data-group-id="${group}"><div class="context-header"><i class="fa-solid fa-${groupIcon}"></i> ${groupHeader}</div><ol></ol></li>`);
        ol.append(groupItem);
        parent = groupItem.find("ol");
      }
      for ( const item of entries ) {
        // Determine menu item visibility (display unless false)
        let display = true;
        if ( item.condition !== undefined ) {
          display = ( item.condition instanceof Function ) ? item.condition(target) : item.condition;
        }
        if ( !display ) continue;

        // Construct and add the menu item
        const name = game.i18n.localize(item.name);
        const li = $(`<li class="context-item">${item.icon}${name}</li>`);
        li.children("i").addClass("fa-fw");
        parent.append(li);

        // Record a reference to the item
        item.element = li[0];
      }
    }

    // Bail out if there are no children
    if ( ol.children().length === 0 ) return;

    // Append to target
    this._setPosition(html, target);

    // Apply interactivity
    if ( !existing.length ) this.activateListeners(html);

    // Deactivate global tooltip
    game.tooltip.deactivate();

    // Animate open the menu
    return this._animateOpen(html);
  }

  /* -------------------------------------------- */

}