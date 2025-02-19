import { ItemValue } from "./itemvalue";
import { Question } from "./question";
import { Serializer } from "./jsonobject";
import { QuestionFactory } from "./questionfactory";
import { LocalizableString } from "./localizablestring";
import { settings } from "./settings";
import { surveyLocalization } from "./surveyStrings";
import { CssClassBuilder } from "./utils/cssClassBuilder";

/**
 * A Model for a rating question.
 */
export class QuestionRatingModel extends Question {
  rateValuesChangedCallback: () => void;

  constructor(name: string) {
    super(name);
    this.createItemValues("rateValues");
    var self = this;
    this.registerFunctionOnPropertyValueChanged("rateValues", function() {
      self.fireCallback(self.rateValuesChangedCallback);
    });
    this.onPropertyChanged.add(function(sender: any, options: any) {
      if (
        options.name == "rateMin" ||
        options.name == "rateMax" ||
        options.name == "rateStep"
      ) {
        self.fireCallback(self.rateValuesChangedCallback);
      }
    });

    var locMinRateDescriptionValue = this.createLocalizableString(
      "minRateDescription",
      this,
      true
    );
    var locMaxRateDescriptionValue = this.createLocalizableString(
      "maxRateDescription",
      this,
      true
    );
    locMinRateDescriptionValue.onGetTextCallback = function(text) {
      return text ? text + " " : text;
    };
    locMaxRateDescriptionValue.onGetTextCallback = function(text) {
      return text ? " " + text : text;
    };
  }
  public onSurveyLoad() {
    super.onSurveyLoad();
    this.fireCallback(this.rateValuesChangedCallback);
  }
  /**
   * The list of rate items. Every item has value and text. If text is empty, the value is rendered. The item text supports markdown. If it is empty the array is generated by using rateMin, rateMax and rateStep properties.
   * @see rateMin
   * @see rateMax
   * @see rateStep
   */
  public get rateValues(): Array<any> {
    return this.getPropertyValue("rateValues");
  }
  public set rateValues(val: Array<any>) {
    this.setPropertyValue("rateValues", val);
  }
  /**
   * This property is used to generate rate values if rateValues array is empty. It is the first value in the rating. The default value is 1.
   * @see rateValues
   * @see rateMax
   * @see rateStep
   */
  public get rateMin(): number {
    return this.getPropertyValue("rateMin");
  }
  public set rateMin(val: number) {
    if (!this.isLoadingFromJson && val > this.rateMax - this.rateStep)
      val = this.rateMax - this.rateStep;
    this.setPropertyValue("rateMin", val);
  }
  /**
   * This property is used to generate rate values if rateValues array is empty. It is the last value in the rating. The default value is 5.
   * @see rateValues
   * @see rateMin
   * @see rateStep
   */
  public get rateMax(): number {
    return this.getPropertyValue("rateMax");
  }
  public set rateMax(val: number) {
    if (!this.isLoadingFromJson && val < this.rateMin + this.rateStep)
      val = this.rateMin + this.rateStep;
    this.setPropertyValue("rateMax", val);
  }
  /**
   * This property is used to generate rate values if rateValues array is empty. It is the step value. The number of rate values are (rateMax - rateMin) / rateStep. The default value is 1.
   * @see rateValues
   * @see rateMin
   * @see rateMax
   */
  public get rateStep(): number {
    return this.getPropertyValue("rateStep");
  }
  public set rateStep(val: number) {
    if (val <= 0) val = 1;
    if (!this.isLoadingFromJson && val > this.rateMax - this.rateMin)
      val = this.rateMax - this.rateMin;
    this.setPropertyValue("rateStep", val);
  }
  protected getDisplayValueCore(keysAsText: boolean, value: any): any {
    var res = ItemValue.getTextOrHtmlByValue(this.visibleRateValues, value);
    return !!res ? res : value;
  }
  get visibleRateValues(): ItemValue[] {
    if (this.rateValues.length > 0) return this.rateValues;
    var res = [];
    var value = this.rateMin;
    var step = this.rateStep;
    while (
      value <= this.rateMax &&
      res.length < settings.ratingMaximumRateValueCount
    ) {
      res.push(new ItemValue(value));
      value = this.correctValue(value + step, step);
    }
    return res;
  }
  private correctValue(value: number, step: number): number {
    if (!value) return value;
    if (Math.round(value) == value) return value;
    var fr = 0;
    while (Math.round(step) != step) {
      step *= 10;
      fr++;
    }
    return parseFloat(value.toFixed(fr));
  }
  public getType(): string {
    return "rating";
  }
  protected getFirstInputElementId(): string {
    return this.inputId + "_0";
  }
  supportGoNextPageAutomatic() {
    return true;
  }
  public supportComment(): boolean {
    return true;
  }
  public supportOther(): boolean {
    return true;
  }
  /**
   * The description of minimum (first) item.
   */
  public get minRateDescription(): string {
    return this.getLocalizableStringText("minRateDescription");
  }
  public set minRateDescription(val: string) {
    this.setLocalizableStringText("minRateDescription", val);
  }
  get locMinRateDescription(): LocalizableString {
    return this.getLocalizableString("minRateDescription");
  }
  /**
   * The description of maximum (last) item.
   */
  public get maxRateDescription(): string {
    return this.getLocalizableStringText("maxRateDescription");
  }
  public set maxRateDescription(val: string) {
    this.setLocalizableStringText("maxRateDescription", val);
  }
  get locMaxRateDescription(): LocalizableString {
    return this.getLocalizableString("maxRateDescription");
  }
  protected valueToData(val: any): any {
    if (this.rateValues.length > 0) {
      var item = ItemValue.getItemByValue(this.rateValues, val);
      return !!item ? item.value : val;
    }
    return !isNaN(val) ? parseFloat(val) : val;
  }
  /**
   * Click value again to clear.
   */
  public setValueFromClick(value: any) {
    if (this.value === parseFloat(value)) {
      this.clearValue();
    } else {
      this.value = value;
    }
  }
  public getItemClass(item: ItemValue) {
    const isSelected = this.value == item.value;
    const isDisabled = this.isReadOnly && !item.isEnabled;
    const allowHover = !isDisabled && !isSelected && !(!!this.survey && this.survey.isDesignMode);

    return new CssClassBuilder()
      .append(this.cssClasses.item)
      .append(this.cssClasses.selected, this.value == item.value)
      .append(this.cssClasses.itemDisabled, this.isReadOnly)
      .append(this.cssClasses.itemHover, allowHover)
      .append(this.cssClasses.itemOnError, this.errors.length > 0)
      .toString();
  }
}
Serializer.addClass(
  "rating",
  [
    { name: "hasComment:switch", layout: "row" },
    {
      name: "commentText",
      dependsOn: "hasComment",
      visibleIf: function(obj: any) {
        return obj.hasComment;
      },
      serializationProperty: "locCommentText",
      layout: "row",
    },
    {
      name: "commentPlaceHolder",
      serializationProperty: "locCommentPlaceHolder",
      dependsOn: "hasComment",
      visibleIf: function(obj: any) {
        return obj.hasComment;
      },
    },
    {
      name: "rateValues:itemvalue[]",
      baseValue: function() {
        return surveyLocalization.getString("choices_Item");
      },
    },
    { name: "rateMin:number", default: 1 },
    { name: "rateMax:number", default: 5 },
    { name: "rateStep:number", default: 1, minValue: 0.1 },
    {
      name: "minRateDescription",
      alternativeName: "mininumRateDescription",
      serializationProperty: "locMinRateDescription",
    },
    {
      name: "maxRateDescription",
      alternativeName: "maximumRateDescription",
      serializationProperty: "locMaxRateDescription",
    },
  ],
  function() {
    return new QuestionRatingModel("");
  },
  "question"
);
QuestionFactory.Instance.registerQuestion("rating", (name) => {
  return new QuestionRatingModel(name);
});
