import { BasicValueType, Field, Record } from '@apitable/widget-sdk';
import { EChartsCoreOption, EChartsOption } from 'echarts';
import { ChartType, FormChatType, IDimensionMetricsMap, IFormConfig, IFormProperties, StackType } from "./interface";
import { Strings, t } from '../i18n';
import { themesMap } from '../theme';
import { formatterValue, getFieldFormEnum } from '../helper';
import { EchartsPie, EchartsScatter } from '.';
import { AGGREGATION_TYPES, AGGREGATION_TYPES_NAMES, CHART_TYPES, METRICS_TYPES, METRICS_TYPES_NAMES } from '../const';
import { canvasUtilsIns } from '../utils';

export abstract class EchartsBase {
  abstract type: ChartType;
  stackType?: StackType;
  mainAxisLabels?: string[] = [];
  theme = 'light';

  constructor(stackType: StackType, theme) {
    this.stackType = stackType;
    this.theme = theme;
  }

  /**
   * Different types of chart classification dimensions and statistical indicators are called differently, 
   * and the corresponding chart configuration fields are also different.
   */
  abstract getFormDimensionMetricsMap(): IDimensionMetricsMap;

  /**
   * Configuration of styles used to generate charts.
   * @param {Object} chartStructure Graphical computing related objects.
   * @param {Object} chartStyle Chart style related objects.
   * @param {Object} data Processed row data.
   */
  abstract getChartStyleOptions(chartStructure, chartStyle, data);

  /**
   * Chart instantiation configuration parameters.
   * @param {Object} props Chart instantiation parameter object
   * @property {Record[]} props.records Field Row Records
   * @property {Field[]} props.fields Field column records
   * @property {Object} props.chartStructure Graphical computing related objects
   * @property {Object} props.chartStyle Chart style related objects
   */
  abstract getChartOptions(props: { records: Record[], fields: Field[], chartStructure, chartStyle }): EChartsOption;

  /**
   * Get form configuration information for different chart types
   * @param {Field[]} fields 
   */
  abstract getChartStyleFormJSON(fields: Field[]): IFormConfig;

  /**
   * Get chart type.
   */
  get formChartType(): string {
    const chartType = CHART_TYPES.find(item => item.class === this.constructor && item.stackType === this.stackType);
    if (!chartType) return FormChatType.EchartsColumn;
    return chartType.id;
  }

  /**
   * Get rotation angle.
   */
  getRotate(texts: string[], isColumn = false, axisItemWidth, { width, height, existLegend }) {
    const scale = existLegend ? 0.8 : 0.9;
    canvasUtilsIns.setCanvasSize(width * 0.8, height * scale);
    return canvasUtilsIns.calcSize(texts, isColumn, axisItemWidth);
  }

  /**
   * Get grid configuration items.
   * @param mergeOptions Chart configuration items
   * @param chartInstance Chart Example
   * @param dom echarts rendering the root node
   */
  getGridOption(mergeOptions, chartInstance, { lightColors, darkColors, width, height }) {
    const { grid, xAxis, yAxis, legend } = mergeOptions;
    const isColumn = this.type === ChartType.EchartsBar;
    const colors = this.theme === 'light' ? lightColors : darkColors;
    const existLegend = legend.data?.length > 0;

    grid.top = existLegend ? 50 : 30;

    // x-axis - angle of rotation of the main axis, maximum width of the text, 
    // width of each item in the table after n equal parts.
    let rotateMainAxis = 0, maxWidth = 0, xAxisItemWidth = 0, interval = 0;;
    if (xAxis && chartInstance.mainAxisLabels) {
      xAxisItemWidth = xAxis.axisLabel.width;
      const result = this.getRotate(chartInstance.mainAxisLabels, isColumn, xAxisItemWidth, { width, height, existLegend });
      rotateMainAxis = isColumn ? -result.rotate : result.rotate;
      maxWidth = result.maxWidth;
      xAxisItemWidth = result.perSize; // Corrected width
      interval = result.interval; // Get interval
    }
    // Does not need to be rotated
    const isNormal = rotateMainAxis === 0;

    // Rotate axis text, configure axis colors, calibrate intervals.
    if (xAxis || yAxis) {
      const splitLine = { lineStyle: { show: true, color: colors.lineColor } };
      const axisLabel = mergeOptions[isColumn ? 'yAxis' : 'xAxis'].axisLabel;
      axisLabel.width = isColumn ? 100 : xAxisItemWidth;
      axisLabel.rotate = rotateMainAxis;
      axisLabel.interval = interval;
      mergeOptions.xAxis.splitLine = splitLine;
      mergeOptions.yAxis.splitLine = splitLine;
    }

    // Whether the width is exceeded needs to be omitted.
    const isOverWidth = maxWidth > xAxisItemWidth;
    if (isColumn) {
      grid.left = isNormal ? 90 : 110;
      grid.bottom = 60;
      yAxis.nameTextStyle.padding = isNormal ? 60 : 70;
      xAxis.nameTextStyle.padding = 25;
    } else {
      grid.bottom = isNormal ? 55 : !isOverWidth ? 90 : 100;
      grid.left = 90;
      xAxis.nameTextStyle.padding = isNormal ? 20 : 60;
      yAxis.nameTextStyle.padding = 60;
    }

    const axis = mergeOptions[isColumn ? 'yAxis' : 'xAxis'];
    const isColumnChart = [ChartType.EchartsColumn, ChartType.Column, ChartType.EchartsBar, ChartType.Bar].includes(chartInstance.type);
    const isNormalColumnChart = chartInstance.stackType === StackType.None && isColumnChart;
    if (axis && axis.data?.length && isNormalColumnChart) {
      const length = axis.data.length;
      const axisArrs = Array.from({ length }).map((cur, i) => {
        return { ...axis, show: i === 0, offset: 0 };
      });
      mergeOptions[isColumn ? 'yAxis' : 'xAxis'] = axisArrs;
    }
  }

  /**
   * Get pie chart configuration items.
   * @param mergeOptions Chart configuration items
   * @param chartInstance Chart instance
   * @param dom echarts renders the root node
   */
  getPieOption(mergeOptions, chartInstance, { width, height }) {
    const { series } = mergeOptions;
    const isPie = this.stackType !== StackType.Stack;
    if (isPie) {
      return;
    }
    const size = Math.min(width, height);
    const labelSeries = series[1].label;
    labelSeries.width = size * 0.5;
    if (labelSeries.width < 90) {
      labelSeries.rich.a.fontSize = 10;
      labelSeries.rich.a.height = 14;
      labelSeries.rich.b.fontSize = 14;
      return;
    }
    if (labelSeries.width > 320) {
      labelSeries.rich.a.fontSize = 24;
      labelSeries.rich.a.height = 28;
      labelSeries.rich.b.fontSize = 28;
    }
  }
  /**
   * Secondary calculation of configuration items before rendering.
   * @param dom echarts instantiates dom
   * @param configs Configuration items after the first calculation
   */
  getMergeOption(configs) {
    const { options, chartInstance, lightColors, darkColors, width, height } = configs;
    const mergeOptions = { ...options };    

    const size = { width: width - 48, height: height - 48 };

    if (this.type !== ChartType.EchartsPie) {
      this.getGridOption(mergeOptions, chartInstance, { lightColors, darkColors, ...size });
    } else {
      this.getPieOption(mergeOptions, chartInstance, size);
    }
    
    return mergeOptions;
  }

  /**
   * Get the configuration object related to the public style of the chart.
   */
  getCommonStyleOptions(): EChartsCoreOption {
    const isLight = this.theme !== 'dark';
    const legendStyle = {
      textStyle: { width: 200, overflow: 'truncate', color: isLight ? '#333' : '#fff' },
      itemStyle: { borderColor: 'transparent' },
      pageIconColor: isLight ? '#2f4554' : '#fff',
      pageIconInactiveColor: isLight ? '#aaa' : '#8d8d8d',
      pageTextStyle: {
        color: isLight ? '#333' : '#fff',
      }
    }
    return {
      tooltip: { trigger: 'item', appendToBody: true },
      legend: {
        type: 'scroll',
        icon: 'circle',
        formatter: (value) => {
          return value.split('\n').join(' ');
        },
        ...legendStyle
      },
      grid: {
        left: 75,
        bottom: 75,
      },
    };
  }

  /**
   * Get the grid class chart public style related configuration object.
   */
  getCommonGridStyleOptions(props: {
    dimensionField: Field,
    metricsField: Field,
    mainAxisData: string[],
    noFormatMetric: boolean,
    countTotalRecords: boolean,
  }) {
    const { dimensionField, metricsField, mainAxisData, noFormatMetric, countTotalRecords } = props;
    const axisStyle = this.theme === 'dark' ? { color: '#fff' } : { color: '#333' };

    const { property, type } = metricsField;

    return {
      mainAxis: {
        type: 'category',
        data: [...mainAxisData],
        name: dimensionField?.name,
        nameLocation: 'center',
        nameTextStyle: {
          padding: 45,
          ...axisStyle,
        },
        axisLabel: {
          interval: 0,
          width: Math.sqrt(2) / 2 * 110, // cos 45 = sqrt(2) / 2
          ...axisStyle,
          overflow: 'truncate',
        },
        axisTick: {
          show: true,
          alignWithLabel: true,
        }
      },
      subAxis: {
        type: 'value',
        name: countTotalRecords ? t(Strings.cout_records) : metricsField?.name,
        nameLocation: 'center',
        nameTextStyle: {
          padding: 45,
          ...axisStyle,
        },
        axisLabel: {
          width: Math.sqrt(2) / 2 * 90, // cos 45 = sqrt(2) / 2
          overflow: 'truncate',
          ...axisStyle,
          formatter: (value) => formatterValue({ property, type }, value, noFormatMetric),
        }
      }
    };
  }

  /**
   * Get the public property configuration of the form.
   */
  getCommonFormConfigJson(): IFormProperties {
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
      },
    };
  }

  /**
   * Categorize dimensions, statistical indicator fields, 
   * and generate form configurations for table structures.
   * @param {Field[]} dimensions 
   * @param {Field[]} metrics 
   */
  getChartStructureFormJSON(dimensions: Field[], metrics: Field[]) {
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    const dimensionsEnum = getFieldFormEnum(dimensions);
    const metricsEnum = getFieldFormEnum(metrics);
    const chartDoNotShowGroupOrStack = [EchartsPie, EchartsScatter];
    const dimensionFormJSON = {
      title: dimensionMetricsMap.dimension.title,
      type: 'string',
      enum: dimensionsEnum.enum,
      enumNames: dimensionsEnum.enumNames,
    };

    const scatter = [FormChatType.EchartsScatter, FormChatType.Scatter] as string[];
    const metricsFormProperties = scatter.includes(this.formChartType) ? {
      openAggregation: {
        title: t(Strings.aggregate_values),
        type: 'boolean',
        description: t(Strings.aggregate_values_describle),
        default: false,
      },
    } : {
      fieldId: {
        type: 'string',
        title: t(Strings.statistical_field),
        ...metricsEnum,
      },
      aggregationType: {
        type: 'string',
        title: t(Strings.aggregation_types),
        enum: AGGREGATION_TYPES,
        enumNames: AGGREGATION_TYPES_NAMES,
        default: 'SUM',
      },
    };
    // Statistical indicators by field.
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
                  title: t(Strings.statistical_field),
                  ...metricsEnum,
                },
                aggregationType: {
                  type: 'string',
                  title: t(Strings.aggregation_types),
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
                  title: t(Strings.statistical_field),
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
   * Get the initialization of the different charts formData.
   * @param {Field[]} dimensions 
   * @param {Field[]} metrics 
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