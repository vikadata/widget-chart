import { Field, t } from '@vikadata/widget-sdk';
import { transformAnnotation } from '../helper';
import { Chart } from './base';
import { ChartType, StackType } from './interface';
import { Strings } from '../i18n';

/**
 * 柱状图相当于笛卡尔坐标系图形的基类。后续的条形图\折线图\散点都是基于这个图的。
 */
export class ColumnChart extends Chart {
  type = ChartType.Column;
  constructor(stackType: StackType) {
    super(stackType);
  }

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
            enum: [dimensionMetricsMap.dimension.key, dimensionMetricsMap.metrics.key],
            enumNames: [t(Strings.chart_sort_by_x_axis), t(Strings.chart_sort_by_y_axis)],
            default: dimensionMetricsMap.dimension.key,
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
        title: t(Strings.select_column_chart_x_axis),
        key: 'xField',
      },
      metrics: {
        title: t(Strings.select_column_chart_y_axis),
        key: 'yField',
      },
    };
  }

  getChartStyleFormJSON(fields: Field[]) {
    return {
      title: t(Strings.design_chart_style),
      type: 'object',
      properties: {
        ...this.commonFormStyleConfig,
        // 暂不支持标注线
        // annotations: {
        //   title: '标注线',
        //   type: 'array',
        //   items: {
        //     type: 'object',
        //     properties: {
        //       title: {
        //         title: '名称',
        //         type: 'string',
        //       },
        //       value: {
        //         title: '数值',
        //         type: 'number',
        //       },
        //       color: {
        //         title: '颜色',
        //         type: 'string',
        //         format: 'color',
        //       },
        //     },
        //   },
        // },
      },
    };
  }

  getChartStyleOptions(chartStructure: any, chartStyle: any) {
    const { annotations, showDataTips } = chartStyle;
    const { seriesField } = chartStructure;
    const styleOptions: any = {
      seriesField,
      annotations: annotations.map(transformAnnotation).flat(1),
      marginRatio: 0,
    };
    if (showDataTips) {
      const dimensionMetricsMap = this.getFormDimensionMetricsMap();
      styleOptions.label = {
        position: 'top', // 'top', 'bottom', 'middle',
        layout: [{ type: 'limit-in-plot' }],
      };
      if (this.stackType !== StackType.None) {
        styleOptions.label = {
          layout: [{ type: 'limit-in-plot' }],
          position: 'middle', // 'top', 'bottom', 'middle',
        };
        if (this.stackType === StackType.Percent) {
          styleOptions.label.content = (item) => {
            return `${(100 * item[dimensionMetricsMap.metrics.key])?.toFixed(2)}%`;
          };
        }
      }
    } else {
      styleOptions.label = null; // 需要显式地指定不展示 label
    }
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
  getDefaultFormData(dimensions: Field[], metrics: Field[]) {
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    const res = super.getDefaultFormData(dimensions, metrics);
    res.chartStyle.axisSortType = {
      axis: dimensionMetricsMap.dimension.key,
      sortType: 'AES',
    };
    return res;
  }
}