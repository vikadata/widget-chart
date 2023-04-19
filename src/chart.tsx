import { Form } from '@apitable/components';
import {
  BasicValueType, FieldType, useCloudStorage, useFields, useMeta,
  useRecords, useViewsMeta, useViewport, useSettingsButton, useActiveViewId,
  useViewIds, RuntimeEnv
} from '@apitable/widget-sdk';
import isEqual from 'lodash/isEqual';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { WidgetChartCanvas } from './chart_canvas';
import { CHART_TYPES, DATETIME_FORMATTER_TYPES, DATETIME_FORMATTER_TYPES_NAMES } from './const';
import { EchartsColumn } from './model';
import { EchartsBase } from './model/echarts_base';
import { StackType } from './model/interface';
import { getUiSchema } from './ui_schema';
import { getGroupOrStackFormJSON } from './helper';
import { ChartError } from './chart_error';
import { FormWrapper } from './sc';
import { Strings, t } from './i18n';



// const MAX_DIMENSION_SIZE = 300;
const ChartMap = {};
CHART_TYPES.forEach(item => ChartMap[item.id] = item);

const useGetDefaultFormData = (meta) => {
  // useActiveViewId There exists a new get under the dashboard that is empty, so you need to get the first of all tables.
  const defaultViewId = useViewIds()[0];
  const activeViewId = useActiveViewId();
  const viewId = activeViewId || defaultViewId
  const fields = useFields(viewId);
  // Default form configuration.
  return useCallback(() => {
    // Classification dimensions (attachments are not allowed as classification dimensions).
    const dimensions = fields.filter(field => {
      if (
        (field.type === FieldType.Attachment) || 
        (field.type === FieldType.MagicLookUp && field.entityType === FieldType.Attachment)
      ) {
        return false;
      }
      return true;
    });
    // Statistical indicators (only numeric fields can be used as statistical indicators).
    const metrics = fields.filter(field => field.basicValueType === BasicValueType.Number);
    return {
      dataSource: { view: viewId, filter: null },
      ...new EchartsColumn(StackType.None, meta.theme).getDefaultFormData(dimensions, metrics),
    };
    // Since it is only used for the first time, there is no need to update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId]);
};

/**
 * Chart configuration composition:
 * 1. Data source (view).
 * 2. Chart structure (chart types, classification dimensions and statistical indicators).
 * 3. Chart styles (other configuration items that affect chart presentation).
 * FormJSON Indicates the configuration of the build form that affects what the form will look like.
 * FormData Indicates the actual data of the form.
 */
const WidgetChartBase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Context needed for new chart creation.
  const views = useViewsMeta();
  const meta = useMeta();

  const { isFullscreen } = useViewport();
  const [isShowingSettings] = useSettingsButton();
  const getDefaultFormData = useGetDefaultFormData(meta);
  const [formData, setFormData, editable] = useCloudStorage('FormData', getDefaultFormData);
  const [formRefreshFlag, setFormRefreseFlag] = useState(false);

  const readOnly = !editable;
  const viewId = formData.dataSource.view;
  const records = useRecords(viewId, { filter: formData.dataSource.filter});
  const fields = useFields(viewId);
  const isPartOfDataRef = useRef(false);

  // Get the chart type and instantiate it.
  const chartType = ChartMap[formData.chartStructure.chartType];
  const configChart = useMemo(() => new (chartType.class)(chartType.stackType, meta.theme) as EchartsBase, [chartType, meta.theme]);

  const { viewIds, viewNames } = useMemo(() => {
    const viewIds = views.map(view => view.id);
    const viewNames = views.map(view => view.name);
    return { viewIds, viewNames };
  }, [views]);

  // Get countable fields and classification dimensions.
  const { dimensions, metrics } = useMemo(() => {
    return {
      dimensions: fields.filter(field => {
        return !(
          field.type === FieldType.Attachment ||
          (FieldType.MagicLookUp && field.entityType === FieldType.Attachment)
        );
      }),
      metrics: fields.filter(field => field.basicValueType === BasicValueType.Number),
    };
  }, [fields]);

  // Get the default configured form fields.
  const chartOptions = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dataSource, ...options } = formData;
    return options;
  }, [formData]);

  // Get the form configuration JSON for the corresponding chart.
  const schema: any = useMemo(() => {
    // Configure the form structure of the corresponding chart JSON.
    const chartStructureFormJSON = configChart.getChartStructureFormJSON(dimensions, metrics);
    // Configure the form style for the corresponding chart JSON.
    const chartStyleFormJSON = configChart.getChartStyleFormJSON([{ id: undefined, name: '  ' } as any, ...dimensions]);
    return {
      type: 'object',
      title: t(Strings.chart_settings),
      definitions: {
        seriesField: getGroupOrStackFormJSON(dimensions, chartType.stackType).seriesField,
        isFormatDatetime: {
          type: 'boolean',
          description: t(Strings.format_date), // 'Formatting Date',
        },
        datetimeFormatter: {
          type: 'string',
          title: t(Strings.date_format),
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
            filter: {
              type: 'string',
            },
          },
        },
        chartStructure: chartStructureFormJSON,
        chartStyle: chartStyleFormJSON,
      },
    };
  }, [configChart, dimensions, metrics, viewIds, viewNames, chartType]);

  // Configurations related to chart styles.
  const plotOptions = useMemo(() => {
    const options = configChart.getChartOptions({
      records,
      fields,
      chartStructure: chartOptions.chartStructure,
      chartStyle: chartOptions.chartStyle,
    });

    return options;
  }, [chartOptions, configChart, fields, records]);

  const onFormChange = (data: any) => {
    // When switching between charts, the default chart formData is used.
    // Mainly used for compatibility with classification dimensions of different data types (scatter).
    // -----
    const nextFormData = data.formData;
    if (isEqual(formData, nextFormData)) {
      return;
    }

    setFormRefreseFlag((val) => !val);

    // Switching chart types, merge configuration.
    if (formData.chartStructure.chartType !== nextFormData.chartStructure.chartType) {
      const chartType = ChartMap[nextFormData.chartStructure.chartType];
      const _defaultFormData = (new (chartType.class)(chartType.stackType, meta.theme) as EchartsBase).getDefaultFormData(dimensions, metrics);
      const mergedFormData = {
        dataSource: formData.dataSource, // Data source remains the same.
        chartStructure: {
          ...formData.chartStructure,
          chartType: nextFormData.chartStructure.chartType, // No change except for changing the chart type.
        },
        chartStyle: {
          ..._defaultFormData.chartStyle,
          ...formData.chartStyle,
        },
      };
      // Switch to the stack type and the stack field does not have a grouping field set.
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
    <div ref={containerRef} style={{ display: 'flex', height: '100%' }}>
      <ChartError hasError={false} isExpanded={isFullscreen} openSetting={isShowingSettings}>
        <WidgetChartCanvas
          formRefreshFlag={formRefreshFlag}
          chartInstance={configChart}
          chartType={configChart.type}
          options={plotOptions}
          isExpanded={isFullscreen}
          isPartOfData={isPartOfDataRef.current}
          theme={chartOptions.chartStyle.theme}
          formData={formData}
        />
      </ChartError>
      <FormWrapper openSetting={isShowingSettings && meta.runtimeEnv == RuntimeEnv.Desktop} readOnly={readOnly}>
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
  );
};

export const WidgetChart = React.memo(WidgetChartBase);
