export class WWActiveEffect extends ActiveEffect {
  
  /** @override */
  get isSuppressed() {
    const originatingItem = this.originatingItem;

    if (!originatingItem) {
      return false;
    }

    return !originatingItem.system.active;
  }

  /**
   * The item which this effect originates from if it has been transferred from an item to an actor.
   * @return {import("./item/item").WWItem | undefined}
  */

  get originatingItem() {
    if (this.parent instanceof Item) {
      return this.parent;
    }
    return undefined;
  }

  /**
   * The number of times this effect should be applied.
   * @type {number}
  */

  get factor() {
    return this.originatingItem?.activeEffectFactor ?? 1;
  }

}