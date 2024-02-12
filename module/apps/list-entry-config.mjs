export default class ListEntryConfig extends FormApplication {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "list-entry-config";
    options.template = "systems/weirdwizard/templates/apps/list-entry-config.hbs";
    options.height = "auto";
    options.width = 400;
    options.title = "Edit Entry";

    return options;
  }

  constructor(actor, dataset, options={}) {
    super(dataset, options);
    
    this.actor = actor;
    this.arrPath = 'system.' + dataset.array;
    this.arr = foundry.utils.getProperty(this.actor, this.arrPath);
    this.entryId = dataset.entryId;
    this.entry = this.arr[dataset.entryId];
  }

  /* -------------------------------------------- */

  async getData(options = {}) {
    const context = super.getData();

    // Pass fields
    context.name = this.entry.name;
    context.category = this.entry.category;
    context.categories = CONFIG.WW.PROFESSION_CATEGORIES;
    context.desc = this.entry.desc;

    // If professions, show category field
    context.showCategory = this.arrPath.includes('professions') ? true : false;
    
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

  }

  /* -------------------------------------------- */

  async _updateObject(event, formData) { // Update item data.
    
    let arr = [...this.arr];

    arr[this.entryId] = formData;
    
    this.actor.update({ [this.arrPath]: arr });
  }
}

