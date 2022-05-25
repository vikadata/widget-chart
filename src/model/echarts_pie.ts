import { Field, Record } from '@vikadata/widget-sdk';
import sum from 'lodash/sum';
import { EchartsBase } from './echarts_base';
import { ChartType, StackType } from './interface';
import { Strings, t } from '../i18n';
import { sortBy } from '../sortBy';
import { guessNumberFieldPrecision, maxRenderNum, processChartData, processRecords } from '../helper';

export class EchartsPie extends EchartsBase {
  type = ChartType.EchartsPie;

  constructor(stackType: StackType, theme) {
    super(stackType, theme);
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

  getChartStyleOptions(chartStructure: any, chartStyle: any, data) {
    const { showDataTips } = chartStyle;
    const color = { color: this.theme === 'dark' ? '#fff' : '#333' };

    // 区分普通配置和series配置
    const dataSum = data.reduce((pre, cur) => pre += cur.value, 0);
    const styleOption: any = {
      commonOption: { ...this.getCommonStyleOptions() },
      series: {
        type: 'pie',
        radius: '70%',
        minShowLabelAngle: 2,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1,
        },
        label: {
          ...color,
          show: showDataTips,
          formatter: (params) => `${params.name}: ${Number(params.value / dataSum * 100).toFixed(2)}%`
        },
      },
    };
    // 环形饼图
    if (this.stackType === StackType.Stack) {
      // 内
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
            const precision = guessNumberFieldPrecision(data.map(item => item.value).filter(Boolean));
            const totalValue = sum(data.map(item => item.value)).toFixed(precision);
            const totalContent = totalValue + '';
            return `{a|${t(Strings.total)}}\n{b|${totalContent}}`;
          },
          rich: {
            a: { fontSize: 18, height: 24, },
            b: { fontSize: 24, fontWeight: 'bolder' }
          }
        },
        emphasis: {
          label: { show: true }
        },
      };
      // 外
      styleOption.series = {
        ...styleOption.series,
        radius: ['50%', '70%'],
        label: {
          ...styleOption.series.label,
          formatter: (params) => {
            return `${params.name}: ${params.percent}%`
          }
        }
      };
    }
    return styleOption;
  }

  /**
   * 获取 echarts 饼图配置的参数
   * @param {Object} param 配置参数对象
   * @property {Record[]} param.records 数据
   * @property {Field[]} param.fields 表属性
   * @property {} param.chartStructure 
   */
  getChartOptions({ records, fields, chartStructure, chartStyle }: {
    records: Record[];
    fields: Field[];
    chartStructure: any,
    chartStyle: any,
  }) {
    // 统计字段 id，统计指定字段的类型（求和，平均），统计数值类型，是否切割多选值，日期格式化
    const { dimension, metrics, metricsType, isSplitMultipleValue, isFormatDatetime: _isFormatDatetime, datetimeFormatter } = chartStructure;
    const { isCountNullValue } = chartStyle;
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    // 统计维度属性，统计数值属性
    const dimensionField = fields.find(field => field.id === dimension);
    const metricsField = fields.find(field => field.id === metrics.fieldId) || {};
    const isFormatDatetime = _isFormatDatetime && dimensionField?.formatType?.type === 'datetime';

    // 处理多选值分离
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

    // 饼图默认按照统计指标从小到大顺时针排序渲染
    data = sortBy(data, (item) => {
      const angleValue = item[dimensionMetricsMap.metrics.key];
      if (angleValue == null) return 0; // FIXME: 看看能不能在上一步处理空值
      return angleValue;
    });

    data = data.slice(0, maxRenderNum);

    const styleOption = this.getChartStyleOptions(chartStructure, chartStyle, data);
    const options = {
      ...styleOption.commonOption,
      series: [{ ...styleOption.series, data }],
    };

    if (this.stackType === StackType.Stack) {
      return {
        ...options,
        series: [
          {  ...styleOption.series, data},
          { ...styleOption.stackSeries, data }
        ]
      };
    }
    return options;
  }
}