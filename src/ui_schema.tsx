import React from 'react';
import { ChartSelect, FieldSelect, ThemeSelect, FilterSelect } from './custom_form_components';
import { ViewPicker } from '@apitable/widget-sdk';
import { Strings, t } from './i18n';
import settings from '../settings.json';


export const getUiSchema = (viewId: string) => {
  return {
    'ui:options': {
      help: {
        text: t(Strings.chart_widget_setting_help_tips),
        url: settings.chart_widget_setting_help_url,
      },
    },
    dataSource: {
      view: {
        'ui:widget': (props) => {
          return <ViewPicker controlJump viewId={props.value} onChange={option => props.onChange(option.value)} />;
        },
      },
      filter: {
        'ui:options': {
          showTitle: false,
        },
        'ui:widget': (props) => {
          return <FilterSelect value={props.value} onChange={filter => props.onChange(filter)}/>;
        },
      },
    },
    chartStructure: {
      'ui:order': ['chartType', 'dimension', 'isSplitMultipleValue', 'isFormatDatetime', 'datetimeFormatter', 'metricsType', 'metrics', 'seriesField'],
      'ui:options': {
        showTitle: false,
      },
      isFormatDatetime: {
        'ui:options': {
          showTitle: false,
        },
      },
      isSplitMultipleValue: {
        'ui:options': {
          showTitle: false,
        },
      },
      datetimeFormatter: {
        'ui:options': {
          showTitle: false,
        },
      },
      chartType: {
        'ui:emptyValue': '',
        'ui:widget': (props) => {
          return <ChartSelect value={props.value} onChange={props.onChange} />;
        },
      },
      dimension: {
        'ui:widget': props => <FieldSelect {...props} viewId={viewId} />,
      },
      seriesField: {
        'ui:widget': props => <FieldSelect {...props} viewId={viewId}/>,
      },
      metricsType: {
        'ui:widget': 'toggleButtonWidget',
      },
      metrics: {
        'ui:options': {
          inline: true,
          showTitle: false,
          layout: [['openAggregation'], ['fieldId', 'aggregationType']],
        },
        openAggregation: {
          'ui:options': {
            showTitle: false,
          },
        },
        fieldId: {
          'ui:emptyValue': '',
          'ui:options': {
            showTitle: false,
          },
          'ui:widget': props => <FieldSelect {...props} viewId={viewId}/>,
        },
        aggregationType: {
          'ui:options': {
            showTitle: false,
          },
        },
      },
    },
    chartStyle: {
      'ui:options': {
        collapse: true,
      },
      isCountNullValue: {
        'ui:options': {
          showTitle: false,
        },
      },
      smooth: {
        'ui:options': {
          showTitle: false,
        },
      },
      showDataTips: {
        'ui:options': {
          showTitle: false,
        },
      },
      excludeZeroPoint: {
        'ui:options': {
          showTitle: false,
        },
      },
      theme: {
        'ui:widget': (props) => {
          return <ThemeSelect value={props.value} onChange={props.onChange} />;
        },
      },
      annotations: [{
        color: {
          'ui:widget': 'color',
        },
      }],
      axisSortType: {
        'ui:options': {
          showTitle: false,
        },
        axis: {
          'ui:widget': 'toggleButtonWidget',
        },
        sortType: {
          'ui:widget': 'toggleButtonWidget',
        },
      },
    },
  };
};
