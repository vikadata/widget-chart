import { Strings } from '../i18n';
import { Field, Record, t } from '@vikadata/widget-sdk';
import { themesMap } from '../theme';
import groupBy from 'lodash/groupBy'; 
import isNumber from 'lodash/isNumber';
import { METRICS_TYPES } from '../const';
import { formatDatetime, getAggregationValue, getFormatter, getNumberBaseFieldPrecision, processChartDataSort, processRecords } from '../helper';
import { ColumnChart } from './column';
import { ChartType, StackType } from './interface';

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
    // TODO: 散点分组考虑 0.7 再上，放开下面的配置即可。
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
      styleOptions.label = null; // 需要显式地指定不展示 label
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
   * 生成展示图表用到的数据和配置
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
    // 处理多选值分离
    const rows = processRecords({
      records,
      dimensionField,
      metricsField,
      metricsType,
      seriesField: seriesFieldInstance,
      isSplitMultiValue: isSplitMultipleValue,
    });
    // 未分组下的数据，按分类维度聚合。
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
    // 记录总数作为统计指标。
    if (metricsType === 'COUNT_RECORDS') {
      // 未分组下的数据，按分类维度聚合。
      data = Object.keys(groupRows).map(key => {
        const x = key;
        // const y = groupRows[key].map(record => record._getCellValue(metrics.fieldId));
        return {
          [dimensionMetricsMap.dimension.key]: x,
          [dimensionMetricsMap.metrics.key]: groupRows[key].length,
        };
      });

      // 字段作为统计指标
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
            metricsValue = 0; // 切换字段类型会造成这种结果。记数值为 0，图表不奔溃, form 表单会给出提示。
          }
          let dimensionValue = shouldFormatDatetime ? formatDatetime(row.dimension, datetimeFormatter!)
            : dimensionField?.convertCellValueToString(row.dimension);
          dimensionValue = dimensionValue || t(Strings.null);
          if (!isCountNullValue && dimensionValue === t(Strings.null)) return null;
          return {
            [dimensionMetricsMap.dimension.key]: dimensionValue,
            [dimensionMetricsMap.metrics.key]: parseFloat(metricsValue?.toFixed(metricsField?.property?.precision)),
            // [seriesField]: seriesFieldInstance?.convertCellValueToString(row.series) || t(Strings.null),
          };
        }).filter(item => item != null);
      }
    }
    // 处理排序
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
      // 数据
      data,
      [dimensionMetricsMap.dimension.key]: dimensionMetricsMap.dimension.key,
      [dimensionMetricsMap.metrics.key]: dimensionMetricsMap.metrics.key,
      // 样式
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
      // 更多样式
      ...moreOptions,
    };
    return options;
  }
}