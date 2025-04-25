import { Field, Record } from '@apitable/widget-sdk';
import { EchartsBase } from './echarts_base';
import { ChartType, StackType } from './interface';
import { Strings, t } from '../i18n';
import { sortBy } from '../sortBy';
import { getNumberBaseFieldPrecision, maxRenderNum, processChartData, processRecords } from '../helper';
import { safeParseNumberOrText, safeParseNumberOrTextWithSeparator } from '../utils';

export class EchartsPie extends EchartsBase {
  type = ChartType.EchartsPie;

  constructor(stackType: StackType, theme) {
    super(stackType, theme);
  }

  add(arg1, arg2) {
    let len1, len2, expand, subLen;
    try {
      len1 = arg1.toString().split('.')[1].length;
    } catch (e) {
      len1 = 0;
    }
    try {
      len2 = arg2.toString().split('.')[1].length;
    } catch (e) {
      len2 = 0;
    }
    subLen = Math.abs(len1 - len2);
    expand = Math.pow(10, Math.max(len1, len2));
    if (subLen > 0) {
      const scale = Math.pow(10, subLen);
      if (len1 > len2) {
        arg1 = Number(arg1.toString().replace('.', ''));
        arg2 = Number(arg2.toString().replace('.', '')) * scale;
      } else {
        arg1 = Number(arg1.toString().replace('.', '')) * scale;
        arg2 = Number(arg2.toString().replace('.', ''));
      }
    } else {
      arg1 = Number(arg1.toString().replace('.', ''));
      arg2 = Number(arg2.toString().replace('.', ''));
    }
    return (arg1 + arg2) / expand;
  }

  getFormDimensionMetricsMap() {
    return {
      dimension: {
        title: t(Strings.select_chart_category),
        key: 'name',
      },
      metrics: {
        title: t(Strings.select_chart_values),
        key: 'value',
      },
    };
  }

  getChartStyleFormJSON() {
    return {
      title: t(Strings.design_chart_style),
      type: 'object',
      properties: {
        ...this.getCommonFormConfigJson(),
      },
    };
  }

  getChartStyleOptions(chartStructure: any, chartStyle: any, { metricsType, data, metricsField }) {
    const { showDataTips } = chartStyle;
    const color = { color: this.theme === 'dark' ? '#fff' : '#333' };

    const fieldPrecision = getNumberBaseFieldPrecision(metricsField);

    // Distinguish between normal configuration and series configuration.
    const dataSum = data.reduce((pre, cur) => pre = this.add(pre, cur.value), 0);
    // const dataSum = data.reduce((pre, cur) => pre += cur.value, 0);
    const styleOption: any = {
      commonOption: { ...this.getCommonStyleOptions() },
      series: {
        type: 'pie',
        radius: '70%',
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        label: {
          ...color,
          show: showDataTips,
          formatter: (params) => `${params.name}: ${safeParseNumberOrText(params.percent, 1)} %`
        },
      },
    };
    // Ring Pie Chart
    if (this.stackType === StackType.Stack) {
      // Inside
      styleOption.stackSeries = {
        ...styleOption.series,
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          ...color,
          show: true,
          position: 'center',
          overflow: 'truncate',
          width: 100,
          formatter: () => {
            // const totalContent = Math.round(params.value / (params.percent / 100));
            // console.log(totalContent, params.value / (params.percent / 100));
            // return `{a|${t(Strings.total)}}\n{b|${totalContent}}`;
            return `{a|${t(Strings.total)}}\n{b|${safeParseNumberOrTextWithSeparator(dataSum, fieldPrecision)}}`;
          },
          // formatter: () => {
          //   const precision = guessNumberFieldPrecision(data.map(item => item.value).filter(Boolean));
          //   const totalValue = sum(data.map(item => item.value)).toFixed(precision);
          //   const totalContent = totalValue + '';
          //   return `{a|${t(Strings.total)}}\n{b|${totalContent}}`;
          // },
          rich: {
            a: { fontSize: 18, height: 24 },
            b: { fontSize: 24, fontWeight: 'bolder' }
          }
        },
        emphasis: {
          label: { show: true }
        },
      };
      // Outside
      styleOption.series = {
        ...styleOption.series,
        radius: ['50%', '70%'],
        label: {
          ...styleOption.series.label,
          formatter: (params) => {
            return `${params.name}: ${safeParseNumberOrText(params.percent, 1)}%`;
          }
        }
      };
    }
    return styleOption;
  }

  /**
   * Get the parameters of the echarts pie chart configuration.
   * @param {Object} param Configuration parameter objects.
   * @property {Record[]} param.records
   * @property {Field[]} param.fields
   * @property {} param.chartStructure
   */
  getChartOptions({ records, fields, chartStructure, chartStyle }: {
    records: Record[];
    fields: Field[];
    chartStructure: any,
    chartStyle: any,
  }) {
    // Statistic field id, type of statistic specified field (sum, average),
    // type of statistic value, whether to cut multi-selected values, date formatting.
    const { dimension, metrics, metricsType, isSplitMultipleValue, isFormatDatetime: _isFormatDatetime, datetimeFormatter } = chartStructure;
    const { isCountNullValue } = chartStyle;
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    // Statistical dimensional attributes, statistical numerical attributes.
    const dimensionField = fields.find(field => field.id === dimension);
    const metricsField = fields.find(field => field.id === metrics.fieldId) || {};
    const isFormatDatetime = _isFormatDatetime && dimensionField?.formatType?.type === 'datetime';

    // Handling multiple choice value separation.
    const rows = processRecords({
      records,
      dimensionField,
      metricsField,
      metricsType,
      isSplitMultiValue: isSplitMultipleValue,
    });

    let data = processChartData({
      rows,
      dimensionMetricsMap,
      metrics,
      metricsField,
      metricsType,
      dimensionField,
      isCountNullValue,
      isFormatDatetime,
      datetimeFormatter,
    }).filter(v => v.value > 0);

    // Pie charts are rendered clockwise from smallest to largest by default.
    data = sortBy(data, (item) => {
      const angleValue = item[dimensionMetricsMap.metrics.key];
      if (angleValue == null) return 0; // FIXME: See if you can handle null values in the previous step.
      return angleValue;
    });

    data = data.slice(0, maxRenderNum);

    const styleOption = this.getChartStyleOptions(chartStructure, chartStyle, { metricsType, data, metricsField });
    const options = {
      ...styleOption.commonOption,
      series: [{ ...styleOption.series, data }],
    };

    if (this.stackType === StackType.Stack) {
      return {
        ...options,
        series: [
          { ...styleOption.series, data },
          { ...styleOption.stackSeries, data }
        ]
      };
    }
    return options;
  }
}
