import { Strings } from '../i18n';
import { Field, Record, t } from '@apitable/widget-sdk';
import { themesMap } from '../theme';
import groupBy from 'lodash/groupBy';
import isNumber from 'lodash/isNumber';
import { METRICS_TYPES } from '../const';
import { formatDatetime, getAggregationValue, getFormatter, getNumberBaseFieldPrecision, processChartDataSort, processRecords } from '../helper';
import { ColumnChart } from './column';
import { ChartType, StackType } from './interface';
import {safeParseNumberOrText} from "../utils";

export class ScatterChart extends ColumnChart {
  type = ChartType.Scatter;
  constructor(stackType: StackType) {
    super(stackType);
  }

  getChartStyleFormJSON(fields: Field[]) {
    return {
      title: t(Strings.design_chart_style),
      type: 'object',
      properties: this.commonFormStyleConfig,
    };
  }

  getChartStyleOptions(chartStructure: any, chartStyle: any) {
    // TODO: Scatter grouping consider 0.7 again on, just let go of the following configuration.
    const colorField = ''; //chartStructure.seriesField;
    const { theme, showDataTips } = chartStyle;
    const styleOptions: any = {
      // ...super.getChartStyleOptions(chartStructure, chartStyle),
      theme,
      colorField,
      shape: 'circle',
      color: themesMap[theme]?.defaultColor,
    };
    if (showDataTips) {
      styleOptions.label = {
        position: 'top', // 'top', 'bottom', 'middle',
        layout: [{ type: 'limit-in-plot' }],
      };
      if (this.stackType !== StackType.None) {
        styleOptions.label = {
          position: 'middle', // 'top', 'bottom', 'middle',
          layout: [{ type: 'limit-in-plot' }],
        };
      }
    } else {
      styleOptions.label = null; // Need to explicitly specify not to display label.
    }

    return styleOptions;
  }

  getDefaultFormData(dimensions: Field[], metrics: Field[]): any {
    const hasNoNumberField = metrics.length === 0;
    return {
      chartStructure: {
        chartType: this.formChartType,
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

  /**
   * Data and configuration for generating display charts.
   */
  getChartOptions({ records, fields, chartStructure, chartStyle }: {
    records: Record[];
    fields: Field[];
    chartStructure: any,
    chartStyle: any,
  }) {
    const moreOptions = this.getChartStyleOptions(chartStructure, chartStyle);
    const { dimension, metrics, metricsType, isSplitMultipleValue, seriesField, isFormatDatetime, datetimeFormatter } = chartStructure;
    const { axisSortType, isCountNullValue } = chartStyle;
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    const dimensionName = fields.find(field => field.id === dimension)?.name;
    const metricsField = fields.find(field => field.id === metrics.fieldId);
    const dimensionField = fields.find(field => field.id === dimension);
    let metricsName = metricsField?.name;
    if (metricsType === 'COUNT_RECORDS') {
      metricsName = t(Strings.cout_records);
    }
    const seriesFieldInstance = fields.find(field => field.id === seriesField);
    const shouldFormatDatetime = isFormatDatetime && dimensionField?.formatType?.type === 'datetime';
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
        const _dimension = shouldFormatDatetime ? formatDatetime(row.dimension, datetimeFormatter!)
          : dimensionField?.convertCellValueToString(row.dimension);
        return _dimension || t(Strings.null);
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
      data = Object.keys(groupRows).map(key => {
        const x = key;
        // const y = groupRows[key].map(record => record._getCellValue(metrics.fieldId));
        return {
          [dimensionMetricsMap.dimension.key]: x,
          [dimensionMetricsMap.metrics.key]: groupRows[key].length,
        };
      });

      // Fields as statistical indicators.
    } else {
      if (metrics.openAggregation) {
        data = Object.keys(groupRows).map(key => {
          const x = key;
          const y = groupRows[key].map(row => row.metrics);
          return {
            [dimensionMetricsMap.dimension.key]: x,
            [dimensionMetricsMap.metrics.key]: getAggregationValue(y, metrics.aggregationType, getNumberBaseFieldPrecision(metricsField)),
          };
        });

      } else {
        data = rows.map(row => {
          let metricsValue = row.metrics;
          if (!isNumber(metricsValue)) {
            // Switching field types can cause this result. With a value of 0, the chart does not crash,
            // the form form will give a prompt.
            metricsValue = 0;
          }
          let dimensionValue = shouldFormatDatetime ? formatDatetime(row.dimension, datetimeFormatter!)
            : dimensionField?.convertCellValueToString(row.dimension);
          dimensionValue = dimensionValue || t(Strings.null);
          if (!isCountNullValue && dimensionValue === t(Strings.null)) return null;
          return {
            [dimensionMetricsMap.dimension.key]: dimensionValue,
            [dimensionMetricsMap.metrics.key]: parseFloat(safeParseNumberOrText(metricsValue, metricsField?.property?.precision)),
          };
        }).filter(item => item != null);
      }
    }
    // Handling sorting
    if (axisSortType) {
      data = processChartDataSort({
        data,
        dimensionMetricsMap,
        axisSortType,
        dimensionField,
      });
    }

    // options
    const options: any = {
      data,
      [dimensionMetricsMap.dimension.key]: dimensionMetricsMap.dimension.key,
      [dimensionMetricsMap.metrics.key]: dimensionMetricsMap.metrics.key,
      // style
      marginRatio: 0,
      padding: 'auto',
      meta: {
        [dimensionMetricsMap.dimension.key]: {
          alias: dimensionName,
          // formatter: getFormatter(dimensionField, metricsType === 'COUNT_RECORDS' ? 1 : 100),
        },
        [dimensionMetricsMap.metrics.key]: {
          alias: metricsName,
          formatter: metricsType === 'COUNT_RECORDS' ? false : getFormatter(metricsField),
        },
        COUNT_RECORDS: {
          alisa: t(Strings.cout_records),
        },
      },
      xAxis: {
        title: { text: dimensionName },
        label: {
          autoHide: true,
          autoRotate: true,
          autoEllipsis: true,
        },
      },
      yAxis: {
        title: { text: metricsName },
      },
      // more style
      ...moreOptions,
    };
    return options;
  }
}
