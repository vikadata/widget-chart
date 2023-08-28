import { Field, Record } from '@apitable/widget-sdk';
import groupBy from 'lodash/groupBy';
import isNumber from 'lodash/isNumber';
import { formatDatetime, formatterValue, getAggregationValue, getNumberBaseFieldPrecision, groupByDimensionValue, maxRenderNum, processChartDataSort, processRecords, sortSeries } from '../helper';
import { Strings, t } from "../i18n";
import { METRICS_TYPES } from '../const';
import { ChartType, StackType } from "./interface";
import { EchartsBase } from './echarts_base';

export class EchartsScatter extends EchartsBase {
  type = ChartType.EchartsScatter;
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
      },
    };
  }

  getDefaultFormData(dimensions: Field[], metrics: Field[]): any {
    const hasNoNumberField = metrics.length === 0;
    return {
      chartStructure: {
        chartType: ChartType.EchartsScatter,
        dimension: dimensions[0]?.id,
        metricsType: hasNoNumberField ? METRICS_TYPES[0] : METRICS_TYPES[1],
        metrics: !hasNoNumberField ? {
          openAggregation: false,
          fieldId: metrics[0]?.id,
          aggregationType: 'SUM',
        } : {},
        seriesField: '',
      },
      chartStyle: {
        annotations: [],
        isStack: false,
        isGroup: false,
        theme: 'theme1',
      },
    };
  }

  getChartStyleOptions(chartStructure: any, chartStyle: any, { noFormatMetric, metricsField }) {
    const { showDataTips } = chartStyle;
    const color = { color: this.theme === 'dark' ? '#fff' : '#333' };
    const { property, type } = metricsField;

    const styleOption: any = {
      commonOption: {
        ...this.getCommonStyleOptions(),
        tooltip: {
          position: 'top',
          valueFormatter: (value) => formatterValue(metricsField, value, noFormatMetric),
          appendToBody: true,
        }
      },
      series: {
        type: 'scatter',
        label: {
          ...color,
          show: showDataTips,
          position: 'outside',
          distance: 2,
          formatter: (params) => formatterValue({ property, type }, params.value[1], noFormatMetric)
        },
        symbolSize: 8,
      },
    };
    return styleOption;
  }

  getChartOptions({ records, fields, chartStructure, chartStyle }: {
    records: Record[];
    fields: Field[];
    chartStructure: any,
    chartStyle: any,
  }) {
    const { dimension, metrics, metricsType, isSplitMultipleValue, seriesField, isFormatDatetime, datetimeFormatter } = chartStructure;
    const { axisSortType, isCountNullValue } = chartStyle;
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    const metricsField = fields.find(field => field.id === metrics.fieldId) as Field || {};
    const dimensionField = fields.find(field => field.id === dimension) as Field;
    const seriesFieldInstance = fields.find(field => field.id === seriesField);
    const shouldFormatDatetime = isFormatDatetime && dimensionField?.formatType?.type === 'datetime';

    const countTotalRecords = metricsType === 'COUNT_RECORDS';
    
    // Whether the y-axis text field needs to be formatted.
    const noFormatMetric = metricsType === 'COUNT_RECORDS' || this.stackType === StackType.Percent;

    let data: any = [];
    // Handling multiple choice value separation.
    const rows = processRecords({
      records,
      dimensionField,
      metricsField,
      metricsType,
      seriesField: seriesFieldInstance,
      isSplitMultiValue: isSplitMultipleValue,
    });
    // Data under ungrouped, aggregated by categorical dimension.
    const groupRows = groupBy(rows, row => {
      try {
        return groupByDimensionValue({ dimension: row.dimension, shouldFormatDatetime, datetimeFormatter });
      } catch (error) {
        return t(Strings.null);
      }
    });

    if (!isCountNullValue) {
      delete groupRows[t(Strings.null)];
    }
    // The total number of records is used as a statistical indicator.
    if (metricsType === 'COUNT_RECORDS') {
      // Data under ungrouped, aggregated by categorical dimension.
      data = Object.keys(groupRows).map(key => ({
        [dimensionMetricsMap.dimension.key]: key,
        [dimensionMetricsMap.metrics.key]: groupRows[key].length,
      }));
      // Fields as statistical indicators.
    } else {
      if (metrics.openAggregation) {
        data = Object.keys(groupRows).map(key => {
          const y = groupRows[key].map(row => row.metrics);
          return {
            [dimensionMetricsMap.dimension.key]: key,
            [dimensionMetricsMap.metrics.key]: getAggregationValue(y, metrics.aggregationType, getNumberBaseFieldPrecision(metricsField)),
          };
        });
      } else {
        data = rows.map(row => {
          let metricsValue = row.metrics;
          if (!isNumber(metricsValue)) {
            // Switching field types can cause this result. With a value of 0, 
            // the chart does not crash, the form form will give a prompt.
            metricsValue = 0;
          }
          let dimensionValue = shouldFormatDatetime ?
            formatDatetime(row.dimension, datetimeFormatter!) :
            row.dimension;
          dimensionValue = dimensionValue || t(Strings.null);
          if (!isCountNullValue && dimensionValue === t(Strings.null)) return null;
          const precision = metricsField?.property?.precision ?? metricsField?.fieldData?.property?.formatting?.precision
          return {
            [dimensionMetricsMap.dimension.key]: dimensionValue,
            [dimensionMetricsMap.metrics.key]: parseFloat(metricsValue?.toFixed(precision)),
          };
        }).filter(item => item != null);
      }
    }

    const { sortedSeries, axisNames } = sortSeries({ axisSortType, dimensionMetricsMap, dimensionField, data, metricsField });

    const seriesData: string[][] = [];
    for (let i = 0; i < sortedSeries.length; i++) {
      const item = sortedSeries[i];
      const { xField, yField } = item;
      seriesData.push([xField, yField]);
    }

    const { mainAxis, subAxis } = this.getCommonGridStyleOptions({
      dimensionField,
      metricsField,
      mainAxisData: [...axisNames] as string[],
      noFormatMetric,
      countTotalRecords,
    });

    const styleOption = this.getChartStyleOptions(chartStructure, chartStyle, { noFormatMetric, metricsField });

    this.mainAxisLabels = axisNames as string[];

    return {
      ...styleOption.commonOption,
      xAxis: { ...mainAxis },
      yAxis: { ...subAxis },
      series: [{
        ...styleOption.series,
        data: seriesData
      }]
    }
  }
}
