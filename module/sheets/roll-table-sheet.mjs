// Similar syntax to importing, but note that
// this is object destructuring rather than an actual import
const RollTableSheet = foundry.applications?.sheets?.RollTableSheet ?? (class {});

/**
 * Extend the basic RollTableSheet with modifications tailored for SotWW
 * @extends {RollTableSheet}
 */
export default class WWRollTableSheet extends RollTableSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['weirdwizard'],
    window: {
      title: this.title
    },
    actions: {
    }
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    const { constructor: cls, id, name, type } = this.document;
    const prefix = cls.hasTypeData && type !== "base" ? CONFIG[cls.documentName].typeLabels[type] : cls.metadata.label;
    return `${name} - ${game.i18n.localize(prefix)}`;
  }
}