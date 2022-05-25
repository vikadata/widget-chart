import { Field, Record, BasicValueType } from '@vikadata/widget-sdk';
import groupBy from 'lodash/groupBy'; 
import sortBy from 'lodash/sortBy';
import { PieChart, ScatterChart } from '.';
import { AGGREGATION_TYPES, AGGREGATION_TYPES_NAMES, CHART_TYPES, METRICS_TYPES, METRICS_TYPES_NAMES } from '../const';
import { getFieldFormEnum, getFormatter, getRightDimensionValue, processChartData, processChartDataSort, processRecords } from '../helper';
import { themesMap } from '../theme';
import { ChartType, FormChatType, IDimensionMetricsMap, StackType } from './interface';
import { t, Strings } from '../i18n';

export abstract class Chart {

  abstract type: ChartType;
  stackType?: StackType;
  constructor(stackType?: StackType) {
    this.stackType = stackType;
  }

  /**
   * 生成图表样式表单配置
   * @param fields 
   */
  abstract getChartStyleFormJSON(fields: Field[]);

  /**
   * 通用图表样式配置
   */
  get commonFormStyleConfig() {
    return {
      isCountNullValue: {
        title: t(Strings.show_empty_values),
        type: 'boolean',
        description: t(Strings.show_empty_values_describle),
      },
      showDataTips: {
        title: t(Strings.show_data_tips),
        type: 'boolean',
        description: t(Strings.show_data_tips_describle),
      },
      theme: {
        title: t(Strings.select_theme_color),
        type: 'string',
        enum: Object.keys(themesMap),
        // enumNames: Object.keys(themesMap),
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
    const { seriesField, dimension, metrics, metricsType, isSplitMultipleValue,
      isFormatDatetime: _isFormatDatetime, datetimeFormatter } = chartStructure;
    const { axisSortType, isCountNullValue } = chartStyle;
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    const dimensionField = fields.find(field => field.id === dimension);
    const isFormatDatetime = _isFormatDatetime && dimensionField?.formatType?.type === 'datetime';
    const dimensionName = dimensionField?.name || 'dimensionName';
    const metricsField = fields.find(field => field.id === metrics.fieldId);
    let metricsName = metricsField?.name || 'metricsName';
    if (metricsType === 'COUNT_RECORDS') {
      metricsName = t(Strings.cout_records);
    }
    const seriesFieldInstance = fields.find(field => field.id === seriesField);
    // 统计指标字段不格式化的情况
    // 1. 统计类型为统计记录总数，相当于指定格式化为整数。
    // 2. 百分比堆叠，相当于指定格式化为百分比。
    const noFormatMetric = metricsType === 'COUNT_RECORDS' || this.stackType === StackType.Percent;

    let data: any = [];
    // 数据预处理
    /**
     * 1. 处理多选分离值
     * 2. 处理分组，空值
     * 3. 处理排序
     */
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
    data = processChartData({
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
    // 处理排序
    if (axisSortType) {
      data = processChartDataSort({
        data,
        dimensionMetricsMap,
        axisSortType,
        dimensionField,
        seriesField: seriesFieldInstance,
      });
    }

    // const singleColorCharts = [ChartType.Bar, ChartType.Column, ChartType.Line, ChartType.Scatter];
    // const colorConfig: any = {};
    // // 图形部分的情况下，切换主题时，选区首个颜色。
    // const { theme } = chartStyle;
    // if (singleColorCharts.includes(this.type)) {
    //   if (!seriesField) {
    //     colorConfig.color = themesMap[theme]?.defaultColor;
    //   } else {

    //     let allSeries = Object.keys(groupBy(data, seriesField));
    //     allSeries = sortBy(allSeries, item => getRightDimensionValue(item, seriesFieldInstance));
    //     // res.rawFields = ['xField', 'yField'],
    //     const themeColors = themesMap[theme].colors20;
    //     colorConfig.colorField = seriesField;
    //     colorConfig.color = (item) => {
    //       const seriesValue = item[seriesField];
    //       const sortIndex = allSeries.findIndex(eachItem => eachItem == seriesValue);
    //       console.debug({ sortIndex, themeColors, allSeries, item });
    //       return themeColors[sortIndex % 20];
    //     };
    //   }
    // }

    // G2DOC: 分组图形组内排序 https://github.com/antvis/g2/issues/1556
    let seriesSortOptions = {};
    if (seriesFieldInstance) {
      let allSeries = Object.keys(groupBy(data, seriesField));
      allSeries = sortBy(allSeries, item => getRightDimensionValue(item, seriesFieldInstance));
      seriesSortOptions = {
        [seriesField]: {
          type: 'cat',
          values: allSeries,
        }
      };
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
      appendPadding: 20,
      meta: {
        [dimensionMetricsMap.dimension.key]: {
          alias: dimensionName,
        },
        [dimensionMetricsMap.metrics.key]: {
          alias: metricsName,
          formatter: noFormatMetric ? false : getFormatter(metricsField, 100),
        },
        COUNT_RECORDS: {
          alisa: t(Strings.cout_records),
        },
        ...seriesSortOptions,
      },
      xAxis: {
        title: { text: dimensionMetricsMap.dimension.key === 'xField' ? dimensionName : metricsName },
        label: {
          autoHide: true,
          autoRotate: true,
          autoEllipsis: true,
        },
      },
      yAxis: {
        title: { text: dimensionMetricsMap.metrics.key === 'yField' ? metricsName : dimensionName },
      },
      label: {
        layout: [{ type: 'limit-in-plot' }],
      },
      // limitInPlot: false,
      // 更多样式
      ...moreOptions,
      // ...colorConfig,
    };
    return options;
  }

  /**
   * 生成图表用到的样式配置
   * @param formData 
   */
  getChartStyleOptions(chartStructure: any, chartStyle: any) {
    const { theme } = chartStyle;
    const { seriesField } = chartStructure;
    const res: any = {
      // TODO: 图形统一使用 brush 的效果不太好。需要针对不同的图表类型，定制不同的交互效果，待设计确定。
      // interactions: [{ type: 'brush' }],
      theme,
      // FIXME: 这里对日期的处理会出问题，展示注释掉
      // legend: {
      //   itemName: { formatter: (text) => `${(text + '')?.split('\n').join(' ')}` },
      // }, 
      tooltip: {
        itemTpl: `<li class="g2-tooltip-list-item">
        <span class="g2-tooltip-marker" style="background-color:{color}"></span>
        <span class="g2-tooltip-name" style="max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        display: inline-block;">{name}</span>:<span class="g2-tooltip-value">{value}</span>
      </li>`,
        // customItems: (originalItems: any[]) => {
        //   console.log('customItems', { originalItems });
        //   // process originalItems, 
        //   return originalItems;
        // },
      },
    };

    const singleColorCharts = [ChartType.Bar, ChartType.Column, ChartType.Line, ChartType.Scatter];
    // 图形部分的情况下，切换主题时，选区首个颜色。
    if (singleColorCharts.includes(this.type) && !seriesField) {
      res.color = themesMap[theme]?.defaultColor;
    }
    return res;
  }

  /**
   * 不同类型的图表分类维度、统计指标的叫法不一样，对应的图表配置字段也不一样。
   */
  abstract getFormDimensionMetricsMap(): IDimensionMetricsMap;

  /**
   * 分类维度、统计指标字段，生成表格结构的表单配置。
   * @param dimensions 
   * @param metrics 
   */
  getChartStructureFormJSON(dimensions: Field[], metrics: Field[]) {
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    const dimensionsEnum = getFieldFormEnum(dimensions);
    const metricsEnum = getFieldFormEnum(metrics);
    const chartDoNotShowGroupOrStack = [PieChart, ScatterChart]; //ScatterChart
    const dimensionFormJSON = {
      title: dimensionMetricsMap.dimension.title,
      type: 'string',
      enum: dimensionsEnum.enum,
      enumNames: dimensionsEnum.enumNames,
    };

    const metricsFormProperties = this.formChartType === FormChatType.Scatter ? {
      openAggregation: {
        title: t(Strings.aggregate_values),
        type: 'boolean',
        description: t(Strings.aggregate_values_describle),
        default: false,
      },
    } : {
      fieldId: {
        type: 'string',
        title: '统计字段',
        ...metricsEnum,
      },
      aggregationType: {
        type: 'string',
        title: '聚合类型',
        enum: AGGREGATION_TYPES,
        enumNames: AGGREGATION_TYPES_NAMES,
        default: 'SUM',
      },
    };
    // 统计指标 by field
    const metricsFormJSON = {
      title: dimensionMetricsMap.metrics.title,
      type: 'object',
      properties: metricsFormProperties,
      dependencies: {
        openAggregation: {
          oneOf: [
            {
              properties: {
                openAggregation: {
                  const: true,
                },
                fieldId: {
                  type: 'string',
                  title: '统计字段',
                  ...metricsEnum,
                },
                aggregationType: {
                  type: 'string',
                  title: '聚合类型',
                  enum: AGGREGATION_TYPES,
                  enumNames: AGGREGATION_TYPES_NAMES,
                  default: 'SUM',
                },
              },
            },
            {
              properties: {
                openAggregation: {
                  const: false,
                },
                fieldId: {
                  type: 'string',
                  title: '统计字段',
                  ...metricsEnum,
                },
              },
            },
          ],
        },
      },
    };
    const dimensionDeps = dimensions.map(dimension => {
      const res: any = {
        properties: {
          dimension: {
            enum: [dimension.id],
          },
        },
      };
      if (dimension.basicValueType === BasicValueType.Array) {
        res.properties.isSplitMultipleValue = { $ref: '#/definitions/isSplitMultipleValue' };
      }
      if (dimension.formatType?.type === 'datetime') {
        res.properties.isFormatDatetime = { $ref: '#/definitions/isFormatDatetime' };
      }
      return res;
    });

    const isFormatDatetimeDeps = [
      {
        properties: {
          isFormatDatetime: {
            const: false,
          },
        },
      },
      {
        properties: {
          isFormatDatetime: {
            const: true,
          },
          datetimeFormatter: { $ref: '#/definitions/datetimeFormatter' },
        },
      },
    ];

    const chartTypeDeps = CHART_TYPES.map(
      chart => {
        const res: any = {
          properties: {
            chartType: {
              enum: [chart.id],
            },
          },
        };
        if (!chartDoNotShowGroupOrStack.includes(chart.class)) {
          res.properties.seriesField = { $ref: '#/definitions/seriesField' };
        }
        return res;
      }
    );
    return {
      title: t(Strings.design_chart_structure),
      type: 'object',
      properties: {
        chartType: {
          type: 'string',
          title: t(Strings.select_chart_type),
          enum: CHART_TYPES.map(chart => chart.id),
          enumNames: CHART_TYPES.map(chart => chart.name),
        },
        dimension: dimensionFormJSON,
        metricsType: {
          type: 'string',
          title: dimensionMetricsMap.metrics.title,
          enum: METRICS_TYPES,
          enumNames: METRICS_TYPES_NAMES,
          default: METRICS_TYPES[0],
        },
      },
      dependencies: {
        dimension: {
          oneOf: dimensionDeps,
        },
        isFormatDatetime: {
          oneOf: isFormatDatetimeDeps,
        },
        metricsType: {
          oneOf: [
            {
              properties: {
                metricsType: {
                  enum: [METRICS_TYPES[0]],
                },
              },
            },
            {
              properties: {
                metricsType: {
                  enum: [METRICS_TYPES[1]],
                },
                metrics: metricsFormJSON,
              },
            },
          ],
        },
        chartType: {
          oneOf: chartTypeDeps,
        },
      },
    };
  }

  /**
   * g2的图表类型 + stack => 图表类型
   */
  get formChartType() {
    const chartType = CHART_TYPES.find(item => item.class === this.constructor && item.stackType === this.stackType);
    if (!chartType) return FormChatType.Column;
    return chartType.id;
  }

  /**
   * 获取不同图表的初始化 formData
   * @param dimensions 
   * @param metrics 
   */
  getDefaultFormData(dimensions: Field[], metrics: Field[]) {
    const hasNoNumberField = metrics.length === 0;
    return {
      chartStructure: {
        chartType: this.formChartType,
        dimension: dimensions[0]?.id,
        metricsType: hasNoNumberField ? METRICS_TYPES[0] : METRICS_TYPES[1],
        metrics: !hasNoNumberField ? {
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
}

