/**
 * Extend the basic Token Document with modifications.
 * @extends {TokenDocument}
*/

export default class WWTokenDocument extends TokenDocument {
  /** @override */
  getTrackedAttributes(data, path = []) {
    const attr = 0;/*super.getTrackedAttributes(data, path);
    console.log(attr)
    if (path.length === 0) {
      attr.value.push(["stats", "damage", "value"], ["stats", "health", "total"]);
    }*/
    return attr;
  }
}
