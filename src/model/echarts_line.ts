import { LineSeriesOption } from 'echarts';
import { ChartType, StackType } from "./interface";
import { Strings, t } from '../i18n';
import { formatterValue, maxRenderNum, processChartData, processRecords, sortSeries } from '../helper';
import { EchartsBase } from './echarts_base';
import { Field } from '@apitable/widget-sdk';

export class EchartsLine extends EchartsBase {
  type = ChartType.EchartsLine;

  constructor(stackType: StackType, theme) {
    super(stackType, theme);
  }
  
  getChartStyleFormJSON(fields: any[]) {
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    return {
      title: t(Strings.design_chart_style),
      type: 'object',
      properties: {
        smooth: {
          title: t(Strings.show_smooth_line),
          type: 'boolean',
          description: t(Strings.show_smooth_line),
        },
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

  getChartStyleOptions(chartStructure: any, chartStyle: any, { noFormatMetric, metricsField }) {
    const { showDataTips, smooth = false } = chartStyle;
    const color = { color: this.theme === 'dark' ? '#fff' : '#333' };
    const { property, type } = metricsField;

    // Distinguish between normal configuration and series configuration.
    const styleOption: any = {
      commonOption: {
        ...this.getCommonStyleOptions(),
        tooltip: {
          trigger: 'axis', axisPointer: {type: 'shadow'}, appendToBody: true,
          valueFormatter: (value) => formatterValue({property, type}, value, noFormatMetric),
        },
      },
      series: {
        type: 'line',
        smooth,
        label: {
          ...color,
          show: showDataTips,
          formatter: (params) => {
            const value = Array.isArray(params.value) ? params.value[1] : params.value;
            return formatterValue({ property, type }, value, noFormatMetric)
          }
        },
      },
    };

    if (this.stackType !== StackType.None) {
      styleOption.series.stack = 'total';
      styleOption.series.areaStyle = {};
    }

    return styleOption;
  }

  getChartOptions({ records, fields, chartStructure, chartStyle }) {
    // Grouping of statistical fields, statistical field id, statistical type of 
    // specified field (sum, average), statistical value type, whether to cut multi-selected values, 
    // date formatting.
    const { seriesField, dimension, metrics, metricsType, isSplitMultipleValue,
      isFormatDatetime: _isFormatDatetime, datetimeFormatter } = chartStructure;
    
    const { axisSortType, isCountNullValue, excludeZeroPoint } = chartStyle;
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    // Statistical dimension attribute, statistical value attribute, statistical value name.
    const dimensionField = fields.find(field => field.id === dimension) as Field;
    const metricsField = fields.find(field => field.id === metrics.fieldId) || {};
    const isFormatDatetime = _isFormatDatetime && dimensionField?.formatType?.type === 'datetime';
    const seriesFieldInstance: Field = fields.find(field => field.id === seriesField);

    // const xKey = dimensionMetricsMap.dimension.key;
    const yKey = dimensionMetricsMap.metrics.key;

    const countTotalRecords = metricsType === 'COUNT_RECORDS';

    // Whether the y-axis text field needs to be formatted.
    const noFormatMetric = countTotalRecords || this.stackType === StackType.Percent;

    // Handling multiple choice value separation.
    const rows = processRecords({
      records,
      dimensionField,
      metricsField,
      metricsType,
      seriesField: seriesFieldInstance,
      isSplitMultiValue: isSplitMultipleValue,
    });

    // Handling grouping, null values, formatting.
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
      metricsField,
      isColumn: true,
    });

    const series: LineSeriesOption[] = [];
    if (axisSortType && seriesFieldInstance) {
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

    const { mainAxis, subAxis } = this.getCommonGridStyleOptions({
      dimensionField,
      metricsField,
      mainAxisData: [...axisNames] as string[],
      noFormatMetric,
      countTotalRecords,
    });

    const options = {
      ...styleOption.commonOption,
      legend: { ...styleOption.commonOption.legend, data: legendNames },
      xAxis: { ...mainAxis },
      yAxis: { ...subAxis, scale: excludeZeroPoint },
      series,
    };

    return options;
  }
}