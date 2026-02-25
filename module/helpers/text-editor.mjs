export function addFormattingOptions(menu, dropdowns) {
  const toggleMark = foundry.prosemirror.commands.toggleMark;
  const wrapIn = foundry.prosemirror.commands.wrapIn;

  if ("format" in dropdowns) {
    dropdowns.format.entries.push({
      action: "wizardry",
      title: "WW.System.TextEditor.Wizardry",
      children: [
        {
          action: "statbox-regular",
          title: "WW.System.TextEditor.StatboxRegular",
          node: menu.schema.nodes.section,
          attrs: { _preserve: { class: "statbox" } },
          priority: 1,
          cmd: () => {
            menu._toggleBlock(menu.schema.nodes.section, wrapIn, {
              attrs: { _preserve: { class: "statbox" } },
            });
            return true;
          }
        },
        {
          action: "statbox",
          title: "WW.System.TextEditor.StatboxBackground",
          node: menu.schema.nodes.section,
          attrs: { _preserve: { class: "statbox background" } },
          priority: 1,
          cmd: () => {
            menu._toggleBlock(menu.schema.nodes.section, wrapIn, {
              attrs: { _preserve: { class: "statbox background" } },
            });
            return true;
          }
        }
      ]
    });
  }
}