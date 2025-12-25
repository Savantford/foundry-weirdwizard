/**
 * A controller class for managing a text input widget that filters the contents of some other UI element.
 */
export default class IndexFilter extends foundry.applications.ux.SearchFilter {

  /**
   * Test whether a given object matches a provided filter
   * @param {object} obj          An object to test against
   * @param {FieldFilter} filter  The filter to test
   * @returns {boolean}           Whether the object matches the filter
   */
  static evaluateFilter(obj, filter) {
    const docValue = foundry.utils.getProperty(obj, filter.field);
    const filterValue = filter.value;
    
    const evaluate = () => {
      switch (filter.operator) {
        case SearchFilter.OPERATORS.EQUALS:
          if ( docValue.equals instanceof Function ) return docValue.equals(filterValue);
          else return (docValue === filterValue);
        case SearchFilter.OPERATORS.CONTAINS:
          return Array.isArray(filterValue) ? filterValue.includes(docValue) : [filterValue].includes(docValue);
        case SearchFilter.OPERATORS.STARTS_WITH:
          return docValue.startsWith(filterValue);
        case SearchFilter.OPERATORS.ENDS_WITH:
          return docValue.endsWith(filterValue);
        case SearchFilter.OPERATORS.LESS_THAN:
          return (docValue < filterValue);
        case SearchFilter.OPERATORS.LESS_THAN_EQUAL:
          return (docValue <= filterValue);
        case SearchFilter.OPERATORS.GREATER_THAN:
          return (docValue > filterValue);
        case SearchFilter.OPERATORS.GREATER_THAN_EQUAL:
          return (docValue >= filterValue);
        case SearchFilter.OPERATORS.BETWEEN: {
          if ( !Array.isArray(filterValue) || filterValue.length !== 2 ) {
            throw new Error(`Invalid filter value for ${filter.operator} operator. Expected an array of length 2.`);
          }
          const [min, max] = filterValue;
          return (docValue >= min) && (docValue <= max);
        }
        case SearchFilter.OPERATORS.IS_EMPTY:
          return foundry.utils.isEmpty(docValue);
        default:
          return (docValue === filterValue);
      }
    };

    // If value is undefined, set result to true
    /*if (filter.field === 'system.grip' && ['One', 'Off', 'Two', 'Natural'].includes(docValue)) {
      console.log(obj.name)
      console.log(filter.field, docValue)
    }*/
    const result = docValue === undefined ? true : evaluate();
    
    return filter.negate ? !result : result;
  }
}