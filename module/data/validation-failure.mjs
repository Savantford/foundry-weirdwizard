import { isDeletionKey } from "./typed-object-field.mjs";

/**
 * @import {ElementValidationFailure} from "./_types.mjs";
 */

/**
 * A class responsible for recording information about a validation failure.
 */
export class DataModelValidationFailure {
  /**
   * @param {object} [options]
   * @param {any} [options.invalidValue]       The value that failed validation for this field.
   * @param {any} [options.fallback]           The value it was replaced by, if any.
   * @param {boolean} [options.dropped=false]  Whether the value was dropped from some parent collection.
   * @param {string} [options.message]         The validation error message.
   * @param {boolean} [options.unresolved=false]     Whether this failure was unresolved
   */
  constructor({invalidValue, fallback, dropped=false, message, unresolved=false}={}) {
    this.invalidValue = invalidValue;
    this.fallback = fallback;
    this.dropped = dropped;
    this.message = message;
    this.unresolved = unresolved;
  }

  /**
   * The value that failed validation for this field.
   * @type {any}
   */
  invalidValue;

  /**
   * The value it was replaced by, if any.
   * @type {any}
   */
  fallback;

  /**
   * Whether the value was dropped from some parent collection.
   * @type {boolean}
   */
  dropped;

  /**
   * The validation error message.
   * @type {string}
   */
  message;

  /**
   * If this field contains other fields that are validated as part of its validation, their results are recorded here.
   * @type {Record<string, DataModelValidationFailure>}
   */
  fields = {};

  /**
   * If this field contains a list of elements that are validated as part of its validation, their results are recorded
   * here.
   * @type {ElementValidationFailure[]}
   */
  elements = [];

  /**
   * Record whether a validation failure is unresolved.
   * This reports as true if validation for this field or any hierarchically contained field is unresolved.
   * A failure is unresolved if the value was invalid and there was no valid fallback value available.
   * @type {boolean}
   */
  unresolved;

  /* -------------------------------------------- */

  /**
   * Return this validation failure as an Error object.
   * @returns {DataModelValidationError}
   */
  asError() {
    return new DataModelValidationError(this);
  }

  /* -------------------------------------------- */

  /**
   * Whether this failure contains other sub-failures.
   * @returns {boolean}
   */
  isEmpty() {
    return foundry.utils.isEmpty(this.fields) && foundry.utils.isEmpty(this.elements);
  }

  /* -------------------------------------------- */

  /**
   * Return the base properties of this failure, omitting any nested failures.
   * @returns {{invalidValue: any, fallback: any, dropped: boolean, message: string}}
   */
  toObject() {
    const {invalidValue, fallback, dropped, message} = this;
    return {invalidValue, fallback, dropped, message};
  }

  /* -------------------------------------------- */

  /**
   * Represent the DataModelValidationFailure as a string.
   * @returns {string}
   */
  toString() {
    return DataModelValidationFailure.#formatString(this);
  }

  /* -------------------------------------------- */

  /**
   * Format a DataModelValidationFailure instance as a string message.
   * @param {DataModelValidationFailure} failure    The failure instance
   * @param {number} _d                             An internal depth tracker
   * @returns {string}                              The formatted failure string
   */
  static #formatString(failure, _d=0) {
    let message = failure.message ?? "";
    _d++;
    if ( !foundry.utils.isEmpty(failure.fields) ) {
      message += "\n";
      const messages = [];
      for ( const [key, subFailure] of Object.entries(failure.fields) ) {
        const name = isDeletionKey(key) ? key.slice(2) : key;
        const subMessage = DataModelValidationFailure.#formatString(subFailure, _d);
        messages.push(`${" ".repeat(2 * _d)}${name}: ${subMessage}`);
      }
      message += messages.join("\n");
    }
    if ( !foundry.utils.isEmpty(failure.elements) ) {
      message += "\n";
      const messages = [];
      for ( const element of failure.elements ) {
        const subMessage = DataModelValidationFailure.#formatString(element.failure, _d);
        messages.push(`${" ".repeat(2 * _d)}${element.id}: ${subMessage}`);
      }
      message += messages.join("\n");
    }
    return message;
  }
}

/* -------------------------------------------- */

/**
 * A specialised Error to indicate a model validation failure.
 * @extends {Error}
 */
export class DataModelValidationError extends Error {
  /**
   * @param {DataModelValidationFailure|string} failure  The failure that triggered this error or an error message
   * @param {...any} [params]                            Additional Error constructor parameters
   */
  constructor(failure, ...params) {
    super(failure.toString(), ...params);
    if ( failure instanceof DataModelValidationFailure ) this.#failure = failure;
  }

  /**
   * The root validation failure that triggered this error.
   * @type {DataModelValidationFailure}
   */
  #failure;

  /* -------------------------------------------- */

  /**
   * Retrieve the root failure that caused this error, or a specific sub-failure via a path.
   * @param {string} [path]  The property path to the failure.
   * @returns {DataModelValidationFailure}
   *
   * @example Retrieving a failure.
   * ```js
   * const changes = {
   *   "foo.bar": "validValue",
   *   "foo.baz": "invalidValue"
   * };
   * try {
   *   doc.validate(expandObject(changes));
   * } catch ( err ) {
   *   const failure = err.getFailure("foo.baz");
   *   console.log(failure.invalidValue); // "invalidValue"
   * }
   * ```
   */
  getFailure(path) {
    if ( !this.#failure ) return;
    if ( !path ) return this.#failure;
    let failure = this.#failure;
    for ( const p of path.split(".") ) {
      if ( !failure ) return;
      if ( !foundry.utils.isEmpty(failure.fields) ) failure = failure.fields[p];
      else if ( !foundry.utils.isEmpty(failure.elements) ) failure = failure.elements.find(e => e.id?.toString() === p);
    }
    return failure;
  }

  /* -------------------------------------------- */

  /**
   * Retrieve a flattened object of all the properties that failed validation as part of this error.
   * @returns {Record<string, DataModelValidationFailure>}
   *
   * @example Removing invalid changes from an update delta.
   * ```js
   * const changes = {
   *   "foo.bar": "validValue",
   *   "foo.baz": "invalidValue"
   * };
   * try {
   *   doc.validate(expandObject(changes));
   * } catch ( err ) {
   *   const failures = err.getAllFailures();
   *   if ( failures ) {
   *     for ( const prop in failures ) delete changes[prop];
   *     doc.validate(expandObject(changes));
   *   }
   * }
   * ```
   */
  getAllFailures() {
    if ( !this.#failure || this.#failure.isEmpty() ) return;
    return DataModelValidationError.#aggregateFailures(this.#failure);
  }

  /* -------------------------------------------- */

  /**
   * Log the validation error as a table.
   */
  logAsTable() {
    const failures = this.getAllFailures();
    if ( foundry.utils.isEmpty(failures) ) return;
    console.table(Object.entries(failures).reduce((table, [p, failure]) => {
      table[p] = failure.toObject();
      return table;
    }, {}));
  }

  /* -------------------------------------------- */

  /**
   * Generate a nested tree view of the error as an HTML string.
   * @returns {string}
   */
  asHTML() {
    const renderFailureNode = failure => {
      if ( failure.isEmpty() ) return `<li>${foundry.utils.escapeHTML(failure.message || "")}</li>`;
      const nodes = [];
      for ( const [field, subFailure] of Object.entries(failure.fields) ) {
        nodes.push(`<li><details><summary>${field}</summary><ul>${renderFailureNode(subFailure)}</ul></details></li>`);
      }
      for ( const element of failure.elements ) {
        const name = element.name || element.id;
        const html = `
          <li><details><summary>${name}</summary><ul>${renderFailureNode(element.failure)}</ul></details></li>
        `;
        nodes.push(html);
      }
      return nodes.join("");
    };
    return `<ul class="summary-tree">${renderFailureNode(this.#failure)}</ul>`;
  }

  /* -------------------------------------------- */

  /**
   * Collect nested failures into an aggregate object.
   * @param {DataModelValidationFailure} failure                               The failure.
   * @returns {DataModelValidationFailure|Record<string, DataModelValidationFailure>}  Returns the failure at the leaf of the
   *                                                                           tree, otherwise an object of
   *                                                                           sub-failures.
   */
  static #aggregateFailures(failure) {
    if ( failure.isEmpty() ) return failure;
    const failures = {};
    const recordSubFailures = (field, subFailures) => {
      if ( subFailures instanceof DataModelValidationFailure ) failures[field] = subFailures;
      else {
        for ( const [k, v] of Object.entries(subFailures) ) {
          failures[`${field}.${k}`] = v;
        }
      }
    };
    for ( const [field, subFailure] of Object.entries(failure.fields) ) {
      recordSubFailures(field, DataModelValidationError.#aggregateFailures(subFailure));
    }
    for ( const element of failure.elements ) {
      recordSubFailures(element.id, DataModelValidationError.#aggregateFailures(element.failure));
    }
    return failures;
  }
}
