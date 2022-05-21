import { Strings } from '../i18n';
import { t } from '@vikadata/widget-sdk';
import { ColumnChart } from './column';
import { ChartType } from './interface';

export class BarChart extends ColumnChart {
  type = ChartType.Bar;

  get commonFormStyleConfig() {
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    return {
      ...super.commonFormStyleConfig,
      axisSortType: {
        title: t(Strings.chart_sort),
        type: 'object',
        properties: {
          axis: {
            title: t(Strings.select_axis_sort),
            type: 'string',
            enum: [dimensionMetricsMap.metrics.key, dimensionMetricsMap.dimension.key],
            enumNames: [t(Strings.chart_sort_by_x_axis), t(Strings.chart_sort_by_y_axis)],
            default: dimensionMetricsMap.metrics.key,
          },
          sortType: {
            title: t(Strings.select_sort_rule),
            type: 'string',
            default: 'AES',
            enum: ['AES', 'DESC'],
            enumNames: [t(Strings.chart_sort_by_ascending), t(Strings.chart_sort_by_descending)],
          },
        },
      },
    };
  }
  getFormDimensionMetricsMap() {
    return {
      dimension: {
        title: t(Strings.select_bar_chart_y_axis),
        key: 'yField',
      },
      metrics: {
        title: t(Strings.select_bar_chart_x_axis),
        key: 'xField',
      },
    };
  }
}