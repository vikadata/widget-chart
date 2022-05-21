import { Strings } from '../i18n';
import { t } from '@vikadata/widget-sdk';
import { ColumnChart } from './column';
import { ChartType, StackType } from './interface';

export class LineChart extends ColumnChart {
  type = ChartType.Line;

  getChartStyleFormJSON(fields: any[]) {
    return {
      title: t(Strings.design_chart_style),
      type: 'object',
      properties: {
        smooth: {
          title: t(Strings.show_smooth_line),
          type: 'boolean',
          description: t(Strings.show_smooth_line),
        },
        ...super.commonFormStyleConfig,
      },
    };
  }

  getChartStyleOptions(chartStructure: any, chartStyle: any) {
    const { seriesField } = chartStructure;
    const smooth = chartStyle.smooth;
    const styleOptions: any = { isGroup: false, smooth, seriesField };
    // 处理堆叠
    switch (this.stackType) {
      case StackType.None:
        styleOptions.isGroup = Boolean(seriesField);
        break;
      case StackType.Stack:
        styleOptions.isStack = Boolean(seriesField);
        break;
      case StackType.Percent:
        styleOptions.isStack = Boolean(seriesField);
        styleOptions.isPercent = true;
    }
    return {
      ...super.getChartStyleOptions(chartStructure, chartStyle),
      ...styleOptions,
    };
  }
}