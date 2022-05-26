import { Field, Record } from '@vikadata/widget-sdk';
import { ChartType, StackType } from "./interface";
import { Strings, t } from "../i18n";
import { formatterValue, maxRenderNum, processChartData, processRecords, sortSeries } from '../helper';
import { BarSeriesOption } from 'echarts';
import { EchartsBase } from './echarts_base';

export class EchartsColumn extends EchartsBase {
  type = ChartType.EchartsColumn;
  
  constructor(stackType: StackType, theme) {
    super(stackType, theme);
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
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    return {
      title: t(Strings.design_chart_style),
      type: 'object',
      properties: {
        ...this.getCommonFormConfigJson(),
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
      }
    }
  }

  /**
   * 图表样式配置 - echarts 柱状图
   * @param {any} chartStructure 
   * @param chartStyle 
   * @returns 
   */
  getChartStyleOptions(chartStructure: any, chartStyle: any, { noFormatMetric, metricsField }) {
    const { showDataTips } = chartStyle;
    const isColumn = this.type === ChartType.EchartsColumn;
    const dataIndex = isColumn ? 1 : 0;
    const color = this.stackType === StackType.None && this.theme === 'dark' ? { color: '#fff' } : { color: '#333' };
    const { property, type } = metricsField;

    // 区分普通配置和series配置
    const styleOption: any = {
      commonOption: {
        ...this.getCommonStyleOptions(),
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, appendToBody: true },
      },
      series: {
        type: 'bar',
        label: {
          ...color,
          show: showDataTips,
          position: 'inside',
          formatter: (params) => {
            const value = Array.isArray(params.value) ? params.value[dataIndex] : params.value;
            return formatterValue({ property, type }, value, noFormatMetric);
          }
        },
      },
    };
    if (this.stackType === StackType.None) {
      styleOption.series.label.position = this.type === ChartType.EchartsColumn ? 'top' : 'outside';
    }
    if (this.stackType !== StackType.None) {
      styleOption.series.stack = 'total';
    }
    if (this.stackType === StackType.Percent) {
      styleOption.commonOption.tooltip.valueFormatter = (value) => `${value} %`;
      styleOption.series.label.formatter = (params) => {
        return `${(params.value[dataIndex])}%`;
      }
    }

    return styleOption;
  }

  getChartOptions({ records, fields, chartStructure, chartStyle }: {
    records: Record[];
    fields: Field[];
    chartStructure: any,
    chartStyle: any,
  }) {
    // 堆叠字段
    const { seriesField, dimension, metrics, metricsType, isSplitMultipleValue,
      isFormatDatetime: _isFormatDatetime, datetimeFormatter } = chartStructure;
    
    const isColumn = this.type === ChartType.EchartsColumn;
    const isPercent = this.stackType === StackType.Percent
    const { axisSortType, isCountNullValue } = chartStyle;
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    const yKey = dimensionMetricsMap.metrics.key;
    // 统计维度属性，统计数值属性，统计数值名称
    const dimensionField = fields.find(field => field.id === dimension) as Field;
    const metricsField = fields.find(field => field.id === metrics.fieldId) as Field || {};
    const isFormatDatetime = _isFormatDatetime && dimensionField?.formatType?.type === 'datetime';
    const seriesFieldInstance = fields.find(field => field.id === seriesField);
    // 获取 y 轴的统计维度
    const countTotalRecords = metricsType === 'COUNT_RECORDS';

    // 是否需要格式化 y 轴文本字段
    const noFormatMetric = countTotalRecords || this.stackType === StackType.Percent;

    // 处理多选值分离
    const rows = processRecords({
      records,
      dimensionField,
      metricsField,
      metricsType,
      seriesField: seriesFieldInstance,
      isSplitMultiValue: isSplitMultipleValue,
    });

    // 处理分组、空值、格式化
    let data = processChartData({
      rows,
      dimensionMetricsMap,
      metrics,
      metricsField,
      metricsType,
      dimensionField,
      seriesFieldInstance,
      isCountNullValue,
      isFormatDatetime,
      datetimeFormatter,
    });

    const styleOption = this.getChartStyleOptions(chartStructure, chartStyle, { noFormatMetric, metricsField });
    const { axisNames, legendNames, sortedSeries } = sortSeries({
      axisSortType,
      dimensionMetricsMap,
      dimensionField,
      seriesField: seriesFieldInstance!,
      data,
      isColumn,
      isPercent,
    });

    const series: BarSeriesOption[] = [];
    if (seriesFieldInstance) {
      for (let i = 0; i < sortedSeries.length; i++) {
        const item = sortedSeries[i];
        series.push({
          ...styleOption.series,
          name: item.sortKey,
          data: item.series.slice(0, maxRenderNum),
        });
      }
    } else {
      series.push({
        ...styleOption.series,
        data: sortedSeries.map((v) => v[yKey]),
      });
    }

    this.mainAxisLabels = [...axisNames] as string[];

    const { mainAxis: mainAxisOption, subAxis: subAxisOption } = this.getCommonGridStyleOptions({
      dimensionField,
      metricsField,
      mainAxisData: [...axisNames] as string[],
      noFormatMetric,
      countTotalRecords,
    });
    
    const subPercentAxis = isPercent ? { max: 100 } : {};

    const mainAxis = { ...mainAxisOption };
    const subAxis = { ...subAxisOption, ...subPercentAxis };

    const options = {
      ...styleOption.commonOption,
      legend: { ...styleOption.commonOption.legend, data: legendNames },
      xAxis: isColumn ? mainAxis : subAxis,
      yAxis: isColumn ? subAxis : mainAxis,
      series,
      // 缩放 - 暂时不做
      // dataZoom: [{
      //   type: 'slider', [isColumn ? 'xAxisIndex' : 'yAxisIndex']: 0,
      //   [isColumn ? 'bottom' : 'left']: 0,
      // }]
    };

    return options;
  }
}
