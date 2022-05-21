import { Form, ThemeProvider, defaultTheme } from '@vikadata/components';
import { Strings } from './i18n';
import {
  BasicValueType, FieldType, useCloudStorage, useFields,
  useRecords, useViewsMeta, useViewport, useSettingsButton, t
} from '@vikadata/widget-sdk';
import isEqual from 'lodash/isEqual';
import React, { useCallback, useMemo, useRef } from 'react';
import { WidgetChartCanvas } from './chart_canvas';
import { CHART_TYPES, DATETIME_FORMATTER_TYPES, DATETIME_FORMATTER_TYPES_NAMES } from './const';
import { ColumnChart } from './model';
import { Chart } from './model/base';
import { StackType } from './model/interface';
import { getUiSchema } from './ui_schema';
import { getGroupOrStackFormJSON } from './helper';
import { ChartError } from './chart_error';
import { FormWrapper } from './sc';

const MAX_DIMENSION_SIZE = 300;
const ChartMap = {};
CHART_TYPES.forEach(item => ChartMap[item.id] = item);

const useGetDefaultFormData = () => {
  const views = useViewsMeta();
  const fields = useFields(views[0].id);

  // 默认表单配置
  return useCallback(() => {
    // 分类维度 (附件不可以作为分类维度)
    const dimensions = fields.filter(field => {
      if (field.type === FieldType.Attachment) {
        return false;
      }
      if (field.type === FieldType.MagicLookUp && field.entityType === FieldType.Attachment) {
        return false;
      }
      return true;
    });
    // 统计指标 （只有数字字段可以作为统计指标）
    const metrics = fields.filter(field => field.basicValueType === BasicValueType.Number);
    return {
      dataSource: {
        view: views[0].id,
      },
      ...new ColumnChart(StackType.None).getDefaultFormData(dimensions, metrics),
    };
    // 因为只在第一次使用，所以不需要更新
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * 图表配置构成：
 * 1. 数据源（视图）
 * 2. 图表结构（图表类型，分类维度和统计指标）
 * 3. 图表样式（影响图表展示的其它配置项）
 * FormJSON 表示构建表单的配置，影响表单长什么样子
 * FormData 表示表单的实际数据。
 */
const WidgetChartBase: React.FC = () => {
  // 新建图表需要的上下文
  const views = useViewsMeta();
  const { viewIds, viewNames } = useMemo(() => {
    const viewIds = views.map(view => view.id);
    const viewNames = views.map(view => view.name);
    return { viewIds, viewNames };
  }, [views]);

  const { isFullscreen } = useViewport();
  const [isShowingSettings] = useSettingsButton();

  const getDefaultFormData = useGetDefaultFormData();
  const [formData, setFormData, editable] = useCloudStorage('FormData', getDefaultFormData);

  const readOnly = !editable;
  const viewId = formData.dataSource.view;
  const records = useRecords(viewId);
  const fields = useFields(viewId);
  const isPartOfDataRef = useRef(false);

  const { dimensions, metrics } = useMemo(() => {
    return {
      dimensions: fields.filter(field => {
        if (field.type === FieldType.Attachment) {
          return false;
        }
        if (field.type === FieldType.MagicLookUp && field.entityType === FieldType.Attachment) {
          return false;
        }
        return true;
      }),
      metrics: fields.filter(field => field.basicValueType === BasicValueType.Number),
    };
  }, [fields]);

  // const [hasError, setHasError] = useState(false);
  // const { run: _setHasError } = useDebounceFn(setHasError, { wait: 300 });

  // 获取图表类型
  const chartType = ChartMap[formData.chartStructure.chartType];
  const configChart = useMemo(() => new (chartType.class)(chartType.stackType) as Chart, [chartType]);

  const chartOptions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dataSource, ...options } = formData;
    return options;
  }, [formData]);

  // useWhyDidYouUpdate('chartOptions', { chartOptions });

  // 结合上下文配置表单 JSON
  const schema: any = useMemo(() => {
    // 配置表单的图表结构 JSON
    const chartStructureFormJSON = configChart.getChartStructureFormJSON(dimensions, metrics);
    // 配置表单的图表样式 JSON
    const chartStyleFormJSON = configChart.getChartStyleFormJSON([{ id: undefined, name: '  ' } as any, ...dimensions]);
    return {
      type: 'object',
      title: t(Strings.chart_settings),
      definitions: {
        seriesField: getGroupOrStackFormJSON(dimensions, chartType.stackType).seriesField,
        isFormatDatetime: {
          type: 'boolean',
          description: t(Strings.format_date), // '格式化日期',
        },
        datetimeFormatter: {
          type: 'string',
          title: '日期格式',
          enum: DATETIME_FORMATTER_TYPES,
          enumNames: DATETIME_FORMATTER_TYPES_NAMES,
          default: DATETIME_FORMATTER_TYPES[0],
        },
        isSplitMultipleValue: {
          title: t(Strings.split_multiple_values),
          type: 'boolean',
          description: t(Strings.split_multiple_values),
        },
      },
      properties: {
        dataSource: {
          title: t(Strings.select_data_source),
          type: 'object',
          properties: {
            view: {
              type: 'string',
              title: t(Strings.select_view),
              enum: viewIds,
              enumNames: viewNames,
            },
          },
        },
        chartStructure: chartStructureFormJSON,
        chartStyle: chartStyleFormJSON,
      },
    };
  }, [configChart, dimensions, metrics, viewIds, viewNames, chartType]);
  // 图表样式相关的配置
  const plotOptions = useMemo(() => {
    const options = configChart.getChartOptions({
      records,
      fields,
      chartStructure: chartOptions.chartStructure,
      chartStyle: chartOptions.chartStyle,
    });

    isPartOfDataRef.current = false;
    const dimensionMetricsMap = configChart.getFormDimensionMetricsMap();

    // 分类/分组 后分类项目超过 100 则截断数据，展示部分图表数据。
    const dimensionKey = dimensionMetricsMap.dimension.key;
    const dimensionSet = new Set(options.data.map(item => item[dimensionKey]));
    const seriesField = options.seriesField;
    const seriesSet = seriesField ?
      new Set(options.data.map(item => item[seriesField])) : new Set();
    if (dimensionSet.size > MAX_DIMENSION_SIZE || seriesSet.size > MAX_DIMENSION_SIZE) {
      isPartOfDataRef.current = true;
      options.data = options.data.slice(0, MAX_DIMENSION_SIZE);
    }
    return options;
  }, [chartOptions, configChart, fields, records]);

  const onFormChange = (data: any) => {
    // 切换图表时，使用默认的图表 formData。
    // 主要用于兼容不同数据类型的分类维度（散点）
    // -----
    const nextFormData = data.formData;
    if (isEqual(formData, nextFormData)) {
      return;
    }

    // 切换图表类型，merge 配置
    if (formData.chartStructure.chartType !== nextFormData.chartStructure.chartType) {
      const chartType = ChartMap[nextFormData.chartStructure.chartType];
      const _defaultFormData = (new (chartType.class)(chartType.stackType) as Chart).getDefaultFormData(dimensions, metrics);
      const mergedFormData = {
        dataSource: formData.dataSource, // 数据源保持不变
        chartStructure: {
          ...formData.chartStructure,
          chartType: nextFormData.chartStructure.chartType, // 除了变化图表类型其它不变
        },
        chartStyle: {
          ..._defaultFormData.chartStyle,
          ...formData.chartStyle,
        },
      };
      // 切换成堆叠类型，并且堆叠字段没有设置分组字段。
      if (chartType.stackType !== StackType.None && !mergedFormData.chartStructure.seriesField) {
        const restFields = [...dimensions, ...metrics]
          .filter(item => item.id !== mergedFormData.chartStructure.dimension && item.id !== mergedFormData.chartStructure.metrics);
        mergedFormData.chartStructure.seriesField = restFields[0]?.id;
      }
      return setFormData(mergedFormData);
    }
    return setFormData(nextFormData);
  };

  const transformErrors = (errors) => {
    // _setHasError(Boolean(errors && errors.length));
    return errors.map(error => {
      if (error.property === '.dataSource.view') {
        error.message = t(Strings.chart_option_view_had_been_deleted);
      }
      return error;
    });
  };
  return (
    <ThemeProvider theme={defaultTheme}>
      <div style={{ display: 'flex', height: '100%' }}>
        <ChartError hasError={false} isExpanded={isFullscreen} openSetting={isShowingSettings}>
          <WidgetChartCanvas
            chartType={configChart.type}
            options={plotOptions}
            isExpanded={isFullscreen}
            isPartOfData={isPartOfDataRef.current}
          />
        </ChartError>
        <FormWrapper openSetting={isShowingSettings} readOnly={readOnly}>
          <Form
            formData={formData}
            uiSchema={getUiSchema(viewId)}
            schema={schema}
            onChange={onFormChange}
            transformErrors={transformErrors}
            onError={(e) => console.log('error', e)}
            liveValidate
          >
            <div />
          </Form>
        </FormWrapper>
      </div>
    </ThemeProvider>
  );
};

export const WidgetChart = React.memo(WidgetChartBase);
