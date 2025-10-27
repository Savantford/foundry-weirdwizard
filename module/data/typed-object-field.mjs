import { DataModelValidationFailure } from "./validation-failure.mjs";

const DataField = foundry.data.fields.DataField;

/**
 * Is a string key of an object used for certain deletion or forced replacement operations.
 * @param {string} key
 * @returns {boolean}
 */
export function isDeletionKey(key) {
  if ( !(typeof key === "string") ) return false;
  return (key[1] === "=") && ((key[0] === "=") || (key[0] === "-"));
}

/**
 * A subclass of ObjectField that represents a mapping of keys to the provided DataField type.
 */
export class TypedObjectField extends foundry.data.fields.ObjectField {
  /**
   * @param {DataField} element             The value type of each entry in this object.
   * @param {DataFieldOptions} [options]    Options which configure the behavior of the field.
   * @param {DataFieldContext} [context]    Additional context which describes the field
   */
  constructor(element, options, context) {
    super(options, context);
    if ( !(element instanceof DataField) ) throw new Error("The element must be a DataField");
    if ( element.parent !== undefined ) throw new Error("The element DataField already has a parent");
    element.name ||= "element";
    element.parent = this;
    this.element = element;
  }

  /* -------------------------------------------- */

  /**
   * The value type of each entry in this object.
   * @type {DataField}
   */
  element;

  /* -------------------------------------------- */

  /** @override */
  static recursive = true;

  /* -------------------------------------------- */

  /** @inheritDoc */
  static get _defaults() {
    return foundry.utils.mergeObject(super._defaults, {validateKey: undefined});
  }

  /* -------------------------------------------- */

  /** @override */
  _cleanType(data, options) {
    options.source = options.source || data;
    for ( const key in data ) {
      const isDeletion = isDeletionKey(key);
      const k = isDeletion ? key.slice(2) : key;
      if ( this.validateKey?.(k) === false ) {
        delete data[key];
        continue;
      }
      if ( isDeletion && (key[0] === "-") ) continue;
      data[key] = this.element.clean(data[key], options);
    }
    return data;
  }

  /* -------------------------------------------- */

  /** @override */
  _validateType(data, options={}) {
    if ( foundry.utils.getType(data) !== "Object" ) throw new Error("must be an object");
    options.source = options.source || data;
    const mappingFailure = new DataModelValidationFailure();
    for ( const key in data ) {
      if ( key.startsWith("-=") ) continue;

      // Validate the field's current value
      const value = data[key];
      const failure = this.element.validate(value, options);

      // Failure may be permitted if fallback replacement is allowed
      if ( failure ) {
        mappingFailure.fields[key] = failure;

        // If the field internally applied fallback logic
        if ( !failure.unresolved ) continue;

        // If fallback is allowed at the object level
        if ( options.fallback && !key.startsWith("==") ) {
          const initial = this.element.getInitialValue(options.source);
          if ( this.element.validate(initial, {source: options.source}) === undefined ) {  // Ensure initial is valid
            data[key] = initial;
            failure.fallback = initial;
            failure.unresolved = false;
          }
          else failure.unresolved = mappingFailure.unresolved = true;
        }

        // Otherwise the field-level failure is unresolved
        else failure.unresolved = mappingFailure.unresolved = true;
      }
    }
    if ( !foundry.utils.isEmpty(mappingFailure.fields) ) return mappingFailure;
  }

  /* -------------------------------------------- */

  /** @override */
  _validateModel(changes, options={}) {
    options.source = options.source || changes;
    if ( !changes ) return;
    for ( const key in changes ) {
      const change = changes[key];  // May be nullish
      if ( change && this.element.constructor.recursive ) this.element._validateModel(change, options);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  initialize(value, model, options={}) {
    const object = {};
    for ( const key in value ) object[key] = this.element.initialize(value[key], model, options);
    return object;
  }

  /* -------------------------------------------- */

  /** @override */
  _updateDiff(source, key, value, difference, options) {

    // * -> undefined, or * -> null
    if ( (value === undefined) || (value === null) || (options.recursive === false) ) {
      super._updateDiff(source, key, value, difference, options);
      return;
    }

    // {} -> {}, undefined -> {}, or null -> {}
    source[key] ||= {};
    value ||= {};
    source = source[key];
    const schemaDiff = difference[key] = {};
    for ( const [k, v] of Object.entries(value) ) {
      let name = k;
      const specialKey = isDeletionKey(k);
      if ( specialKey ) name = k.slice(2);

      // Special operations for deletion or forced replacement
      if ( specialKey ) {
        if ( k[0] === "-" ) {
          if ( v !== null ) throw new Error("Removing a key using the -= deletion syntax requires the value of that"
            + " deletion key to be null, for example {-=key: null}");
          if ( name in source ) {
            schemaDiff[k] = v;
            delete source[name];
          }
        }
        else if ( k[0] === "=" ) schemaDiff[k] = source[name] = applySpecialKeys(v);
        continue;
      }

      // Perform type-specific update
      this.element._updateDiff(source, k, v, schemaDiff, options);
    }

    // No updates applied
    if ( isEmpty(schemaDiff) ) delete difference[key];
  }

  /* -------------------------------------------- */

  /** @override */
  _updateCommit(source, key, value, diff, options) {
    const s = source[key];

    // Special Cases: * -> undefined, * -> null, undefined -> *, null -> *
    if ( !s || !value || Object.isSealed(s) ) {
      source[key] = value;
      return;
    }

    // Remove keys which no longer exist in the new value
    for ( const k of Object.keys(s) ) {
      if ( !(k in value) ) delete s[k];
    }

    // Update fields in source which changed in the diff
    for ( let [k, d] of Object.entries(diff) ) {
      if ( isDeletionKey(k) ) {
        if ( k[0] === "-" ) continue;
        k = k.slice(2);
      }
      this.element._updateCommit(s, k, value[k], d, options);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  toObject(value) {
    if ( (value === undefined) || (value === null) ) return value;
    const object = {};
    for ( const key in value ) object[key] = this.element.toObject(value[key]);
    return object;
  }

  /* -------------------------------------------- */

  /** @override */
  apply(fn, data={}, options={}) {

    // Apply to this TypedObjectField
    const thisFn = typeof fn === "string" ? this[fn] : fn;
    thisFn?.call(this, data, options);

    // Recursively apply to inner fields
    const results = {};
    for ( const key in data ) {
      const r = this.element.apply(fn, data[key], options);
      if ( !options.filter || !isEmpty(r) ) results[key] = r;
    }
    return results;
  }

  /* -------------------------------------------- */

  /** @override */
  _addTypes(source, changes, options={}) {
    if ( (foundry.utils.getType(source) !== "Object") || (foundry.utils.getType(changes) !== "Object") ) return;
    for ( const key in changes ) this.element._addTypes(source[key], changes[key], options);
  }

  /* -------------------------------------------- */

  /** @override */
  _getField(path) {
    if ( path.length === 0 ) return this;
    if ( path.shift() !== this.element.name ) return undefined;
    return this.element._getField(path);
  }

  /* -------------------------------------------- */

  /**
   * Migrate this field's candidate source data.
   * @param {object} sourceData   Candidate source data of the root model
   * @param {any} fieldData       The value of this field within the source data
   */
  migrateSource(sourceData, fieldData) {
    if ( !(this.element.migrateSource instanceof Function) ) return;
    if ( foundry.utils.getType(fieldData) !== "Object" ) return;
    for ( const key in fieldData ) {
      if ( key.startsWith("-=") ) continue;
      this.element.migrateSource(sourceData, fieldData[key]);
    }
  }
}