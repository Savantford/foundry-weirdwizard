/**
 * Extend DialogV2 with a few alterations
 * @extends {DialogV2}
*/
export default class WWDialog extends foundry.applications.api.DialogV2 {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["weirdwizard"],
    position: {
      width: 450,
      height: "auto",
    }
  };

}