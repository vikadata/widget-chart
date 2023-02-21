import { Field, Record, BasicValueType } from '@apitable/widget-sdk';
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
   * Generate chart style form configuration.
   * @param fields 
   */
  abstract getChartStyleFormJSON(fields: Field[]);

  /**
   * General chart style configuration.
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
   * Data and configuration for generating display charts.
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
    // Statistical indicator fields that are not formatted.
    // 1. The statistics type is the total number of statistical records, 
    // which is equivalent to specifying formatting as an integer.
    // 2. Percentage stacking, equivalent to specifying formatting as a percentage.
    const noFormatMetric = metricsType === 'COUNT_RECORDS' || this.stackType === StackType.Percent;

    let data: any = [];
    // Data pre-processing.
    /**
     * 1. Handles multiple choice separation values.
     * 2. Process grouping, null values.
     * 3. Handling sorting.
     */
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
    // Handling sorting.
    if (axisSortType) {
      data = processChartDataSort({
        data,
        dimensionMetricsMap,
        axisSortType,
        dimensionField,
        seriesField: seriesFieldInstance,
      });
    }

    // G2DOC: Sorting within grouped graphics groups https://github.com/antvis/g2/issues/1556
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
      data,
      [dimensionMetricsMap.dimension.key]: dimensionMetricsMap.dimension.key,
      [dimensionMetricsMap.metrics.key]: dimensionMetricsMap.metrics.key,
      // style
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
      // More styles
      ...moreOptions,
      // ...colorConfig,
    };
    return options;
  }

  /**
   * Configuration of styles used to generate charts.
   * @param formData 
   */
  getChartStyleOptions(chartStructure: any, chartStyle: any) {
    const { theme } = chartStyle;
    const { seriesField } = chartStructure;
    const res: any = {
      // TODO: Using brush for the graphs does not work well. Different interaction effects need to 
      // be customized for different chart types, to be determined by design.
      // interactions: [{ type: 'brush' }],
      theme,
      // FIXME: Here the handling of the date will be problematic, show commented out.
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
    // In the case of the graphics section, the first color of the selection when switching themes.
    if (singleColorCharts.includes(this.type) && !seriesField) {
      res.color = themesMap[theme]?.defaultColor;
    }
    return res;
  }

  /**
   * Different types of chart classification dimensions and statistical indicators are called differently, 
   * and the corresponding chart configuration fields are also different.
   */
  abstract getFormDimensionMetricsMap(): IDimensionMetricsMap;

  /**
   * Categorize dimensions, statistical indicator fields, 
   * and generate form configurations for table structures.
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
        title: 'Statistical fields',
        ...metricsEnum,
      },
      aggregationType: {
        type: 'string',
        title: 'Aggregation Type',
        enum: AGGREGATION_TYPES,
        enumNames: AGGREGATION_TYPES_NAMES,
        default: 'SUM',
      },
    };
    // Statistical indicators by field
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
                  title: 'Statistical fields',
                  ...metricsEnum,
                },
                aggregationType: {
                  type: 'string',
                  title: 'Aggregation Type',
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
                  title: 'Statistical fields',
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
   * g2's chart type + stack => chart type.
   */
  get formChartType() {
    const chartType = CHART_TYPES.find(item => item.class === this.constructor && item.stackType === this.stackType);
    if (!chartType) return FormChatType.Column;
    return chartType.id;
  }

  /**
   * Get the initialization of the different charts formData.
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

