export default class ListEntryConfig extends FormApplication {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "list-entry-config";
    options.template = "systems/weirdwizard/templates/configs/list-entry-config.hbs";
    options.height = "auto";
    options.width = 400;
    options.title = "Edit Entry";

    return options;
  }

  constructor(doc, dataset, options={}) {
    super(dataset, options);
    
    this.doc = doc;
    if (doc instanceof Actor) this.actor = doc;
    this.arrPath = 'system.' + dataset.array;
    this.arr = foundry.utils.getProperty(doc, this.arrPath);
    this.entryId = dataset.entryId;
    this.entry = this.arr[dataset.entryId];
    
  }

  /* -------------------------------------------- */

  async getData(options = {}) {
    const context = super.getData();

    // Pass fields
    context.entry = this.entry;
    if (this.actor) context.grantedBy = this.actor.items.get(this.entry?.grantedBy) ? this.actor.items.get(this.entry.grantedBy).name : '';
    
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

  }

  /* -------------------------------------------- */

  async _updateObject(event, formData) { // Update item data.
    
    let arr = this.arr;

    arr[this.entryId] = formData;
    
    if (this.doc._id) await this.doc.update({ [this.arrPath]: arr });
    else {
      await this.doc.updateSource({ [this.arrPath]: arr })
      await this.doc.apps[('wwsl-entry-form')]?.render();
    };
  }
}

