export default class WWCombatantGroup extends foundry.documents.CombatantGroup {

  /**
   * The default icon used for newly created CombatantGroup documents.
   * @type {string}
   */
  static DEFAULT_ICON = "icons/environment/people/charge.webp";

  /**
   * Determine default artwork based on the provided combatant group data.
   * @param {CombatantGroupData} createData The source combatant group data.
   * @returns {{img: string}}               Candidate combatant group image.
   */
  static getDefaultArtwork(createData) {
    return { img: this.DEFAULT_ICON };
  }

  /**
   * Is this group currently expanded in the combat tracker?
   * @type {boolean}
   */
  _expanded = false;

  /**
   * The disposition for this combatant group.
   * Returns the value for Secret if there are no members.
   * @returns {number}
   */
  get disposition() {
    return this.members.first()?.disposition ?? CONST.TOKEN_DISPOSITIONS.SECRET;
  }

  /**
   * The controller/representative of this combatant group.
   * @returns {Actor}
   */
  get controller() {
    return this.members.first() ?? null;
  }

  /**
   * The disposition for this combatant group.
   * @returns {string || null}
   */
  get phase() {
    
    const controller = this.members.first();
    
    if (!controller) return 'enemies';

    if (controller?.actorType === 'character') {
      if (controller.takingInit) return 'init';
      else return 'allies';

    } else if (controller?.actorType === 'npc') {
      if (controller.disposition === 1) return 'allies';
      else return 'enemies';
    }

  }

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // Provide a default image
    if (!data.img) this.updateSource(this.constructor.getDefaultArtwork(data));
  }

  /**
   * The number of members who are defeated.
   * @returns {number}
   */
  get numDefeated() {
    let count = 0;

    for ( const member of this.members.values() ) {
      if (member.isDefeated) count += 1;
    }
    
    return count;
  }

  /**
   * The number of members who already acted this round.
   * @returns {number}
   */
  get numActed() {
    let count = 0;

    for ( const member of this.members.values() ) {
      if (member.acted) count += 1;
    }
    
    return count;
  }

}