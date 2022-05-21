import { EchartsColumn } from "./echarts_column";
import { ChartType } from "./interface";

export class EchartsBar extends EchartsColumn {
  type = ChartType.EchartsBar;
  constructor(stackType, theme) {
    super(stackType, theme);
  }
}