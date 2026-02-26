export function addFormattingOptions(menu, dropdowns) {
  const toggleMark = foundry.prosemirror.commands.toggleMark;
  const wrapIn = foundry.prosemirror.commands.wrapIn;
  const bug = (name) => `/systems/weirdwizard/assets/decorations/bugs/${name}.webp`;
  const image = menu.schema.nodes.image;

  if ("format" in dropdowns) {
    // Wizardry
    dropdowns.format.entries.push({
      action: "dividers",
      title: "WW.System.TextEditor.Dividers",
      children: [
        {
          action: "spear-divider",
          title: "WW.System.TextEditor.SpearDivider",
          node: menu.schema.nodes.horizontal_rule,
          attrs: { _preserve: { class: "spear" } },
          scope: "text",
          cmd: () => {
            const hr = menu.schema.nodes.horizontal_rule;
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(hr.create({ _preserve: { class: "spear" } })).scrollIntoView());
          }
        },
        {
          action: "bug-clouds-pigeon",
          title: "WW.System.TextEditor.Bug.CloudsPigeon",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('clouds-pigeon'),
              alt: "WW.System.TextEditor.Bug.CloudsPigeon",
              //width: form.elements.width.value,
              //height: form.elements.height.value,
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-clouds-sky-father",
          title: "WW.System.TextEditor.Bug.CloudsSkyFather",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('clouds-sky-father'),
              alt: "WW.System.TextEditor.Bug.CloudsSkyFather",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-cockatrice-and-hydra",
          title: "WW.System.TextEditor.Bug.CockatriceAndHydra",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('cockatrice-and-hydra'),
              alt: "WW.System.TextEditor.Bug.CockatriceAndHydra",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-double-dragons",
          title: "WW.System.TextEditor.Bug.DoubleDragons",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('double-dragons'),
              alt: "WW.System.TextEditor.Bug.DoubleDragons",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-dragon-breath",
          title: "WW.System.TextEditor.Bug.DragonBreath",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('dragon-breath'),
              alt: "WW.System.TextEditor.Bug.DragonBreath",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-gorgon-and-harpy",
          title: "WW.System.TextEditor.Bug.GorgonAndHarpy",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('gorgon-and-harpy'),
              alt: "WW.System.TextEditor.Bug.GorgonAndHarpy",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-keys",
          title: "WW.System.TextEditor.Bug.Keys",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('keys'),
              alt: "WW.System.TextEditor.Bug.Keys",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-shelf-book-and-hands",
          title: "WW.System.TextEditor.Bug.ShelfBookAndHands",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('shelf-book-and-hands'),
              alt: "WW.System.TextEditor.Bug.ShelfBookAndHands",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-shelf-goat-skull",
          title: "WW.System.TextEditor.Bug.ShelfGoatSkull",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('shelf-goat-skull'),
              alt: "WW.System.TextEditor.Bug.ShelfGoatSkull",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-swords",
          title: "WW.System.TextEditor.Bug.Swords",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('Swords'),
              alt: "WW.System.TextEditor.Bug.Swords",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-vines-dragonflies",
          title: "WW.System.TextEditor.Bug.VinesDragonflies",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('vines-dragon-flies'),
              alt: "WW.System.TextEditor.Bug.VinesDragonflies",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-vines-grape-cluster",
          title: "WW.System.TextEditor.Bug.VinesGrapeCluster",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('vines-grape-cluster'),
              alt: "WW.System.TextEditor.Bug.VinesGrapeCluster",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        },
        {
          action: "bug-vines-green-man",
          title: "WW.System.TextEditor.Bug.VinesGreenMan",
          node: menu.schema.nodes.image,
          attrs: { _preserve: { class: "bug" } },
          scope: "text",
          cmd: () => {
            menu.view.dispatch(menu.view.state.tr.replaceSelectionWith(image.create({
              src: bug('vines-green-man'),
              alt: "WW.System.TextEditor.Bug.VinesGreenMan",
              _preserve: { class: "bug" }
            })).scrollIntoView());
          }
        }
      ]
    });

    // Text box
    dropdowns.format.entries.push({
      action: "textbox",
      title: "WW.System.TextEditor.TextBox.Label",
      children: [
        {
          action: "textbox-block",
          title: "WW.System.TextEditor.TextBox.Block",
          node: menu.schema.nodes.section,
          attrs: { _preserve: { class: "textbox" } },
          priority: 1,
          cmd: () => {
            menu._toggleBlock(menu.schema.nodes.section, wrapIn, {
              attrs: { _preserve: { class: "textbox" } },
            });
            return true;
          }
        },

        // Text Box Headings
        {
          action: `textbox-title`,
          title: "WW.System.TextEditor.TextBox.Title",
          priority: 1,
          node: menu.schema.nodes.heading,
          attrs: { level: 4, _preserve: { class: "textbox-heading" } },
          cmd: () => menu._toggleTextBlock(menu.schema.nodes.heading, {attrs: { level: 4, _preserve: { class: "textbox-heading" } }})
        },
        {
          action: `textbox-section`,
          title: "WW.System.TextEditor.TextBox.Section",
          priority: 1,
          node: menu.schema.nodes.heading,
          attrs: { level: 5, _preserve: { class: "textbox-heading" } },
          cmd: () => menu._toggleTextBlock(menu.schema.nodes.heading, {attrs: { level: 5, _preserve: { class: "textbox-heading" } }})
        },
        {
          action: `textbox-example`,
          title: "WW.System.TextEditor.TextBox.Example",
          priority: 1,
          node: menu.schema.nodes.heading,
          attrs: { level: 6, _preserve: { class: "textbox-heading" } },
          cmd: () => menu._toggleTextBlock(menu.schema.nodes.heading, {attrs: { level: 6, _preserve: { class: "textbox-heading" } }})
        }
      ]
    });

    // Statbox
    dropdowns.format.entries.push({
      action: "statbox",
      title: "WW.System.TextEditor.Statbox.Label",
      children: [
        // Statbox blocks
        {
          action: "statbox-regular",
          title: "WW.System.TextEditor.Statbox.Regular",
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
          action: "statbox-background",
          title: "WW.System.TextEditor.Statbox.Background",
          node: menu.schema.nodes.section,
          attrs: { _preserve: { class: "statbox background" } },
          priority: 1,
          cmd: () => {
            menu._toggleBlock(menu.schema.nodes.section, wrapIn, {
              attrs: { _preserve: { class: "statbox background" } },
            });
            return true;
          }
        },

        // Statbox headings
        {
          action: `statbox-name`,
          title: "WW.System.TextEditor.Statbox.Name",
          priority: 1,
          node: menu.schema.nodes.heading,
          attrs: { level: 4, _preserve: { class: "statbox-heading" } },
          cmd: () => menu._toggleTextBlock(menu.schema.nodes.heading, {attrs: { level: 4, _preserve: { class: "statbox-heading" } }})
        },
        {
          action: `statbox-descriptors`,
          title: "WW.System.TextEditor.Statbox.Descriptors",
          priority: 1,
          node: menu.schema.nodes.heading,
          attrs: { level: 5, _preserve: { class: "statbox-heading" } },
          cmd: () => menu._toggleTextBlock(menu.schema.nodes.heading, {attrs: { level: 5, _preserve: { class: "statbox-heading" } }})
        },
        {
          action: `statbox-section`,
          title: "WW.System.TextEditor.Statbox.Section",
          priority: 1,
          node: menu.schema.nodes.heading,
          attrs: { level: 6, _preserve: { class: "statbox-heading" } },
          cmd: () => menu._toggleTextBlock(menu.schema.nodes.heading, {attrs: { level: 6, _preserve: { class: "statbox-heading" } }})
        }
      ]
    });
  }
}