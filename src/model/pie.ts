import { sortBy } from 'lodash';
import { getNumberBaseFieldPrecision } from './../helper';
import { Strings, t } from '../i18n';
import { Field, Record } from '@vikadata/widget-sdk';
import sum from 'lodash/sum';
import { processChartData, processRecords, guessNumberFieldPrecision } from '../helper';
import { Chart } from './base';
import { ChartType, StackType } from './interface';

export class PieChart extends Chart {
  type = ChartType.Pie;
  constructor(stackType: StackType) {
    super(stackType);
  }

  getFormDimensionMetricsMap() {
    return {
      dimension: {
        title: t(Strings.select_chart_category),
        key: 'colorField',
      },
      metrics: {
        title: t(Strings.select_chart_values),
        key: 'angleField',
      },
    };
  }

  getChartStyleFormJSON(fields: any[]) {
    return {
      title: t(Strings.design_chart_style),
      type: 'object',
      properties: {
        ...this.commonFormStyleConfig,
      },
    };
  }

  getChartStyleOptions(chartStructure: any, chartStyle: any) {
    const { showDataTips } = chartStyle;
    let res: any = super.getChartStyleOptions(chartStructure, chartStyle);
    if (this.stackType === StackType.Stack) {
      res.innerRadius = 0.6;
      res.statistic = {
        title: {
          content: t(Strings.total)
        },
        content: {
          style: { display: 'unset' },
          customHtml: (container: HTMLElement, view, datum: object, data: object[]) => {
            const precision = guessNumberFieldPrecision(data.map(item => (item as any).angleField).filter(Boolean));
            const totalValue = sum(data.map(item => (item as any).angleField)).toFixed(precision);
            const totalContent = totalValue + '';
            // const containerWidth = parseInt(container.style.width);
            // const fontSize = containerWidth / totalContent.length * 0.7;
            // return `<span style="font-size: ${fontSize}px">${totalContent}</span>`;
            const textLength = totalContent.length > 9 ? '90%' : '';
            return `
            <svg viewBox="0 0 200 100">
              <text fill="#636363" textLength="${textLength}" x="100" y="33" style="text-anchor: middle;">${totalContent}</text>
            </svg>
            `;
          },
        },
      };
    }
    if (showDataTips) {
      // ????????????
      if (this.stackType !== StackType.None) {
        res = {
          ...res, label: {
            type: 'spider',
            content: '{name} ({percentage})',
            labelHeight: 28,
            layout: [{ type: 'limit-in-plot' }],
          },
        };
        // ?????? label
      } else {
        res.label = {
          type: 'spider',
          labelHeight: 28,
          content: '{name} ({percentage})',
          layout: [{ type: 'limit-in-plot' }],
        };
      }

    } else {
      res.label = null;
    }
    // res.interactions = [{ type: 'pie-legend-active' }, { type: 'element-active' }];
    return res;
  }

  /**
 * ??????????????????????????????????????????
 */
  getChartOptions({ records, fields, chartStructure, chartStyle }: {
    records: Record[];
    fields: Field[];
    chartStructure: any,
    chartStyle: any,
  }) {
    const moreOptions = this.getChartStyleOptions(chartStructure, chartStyle);
    const { dimension, metrics, metricsType, isSplitMultipleValue, isFormatDatetime: _isFormatDatetime, datetimeFormatter } = chartStructure;
    const { isCountNullValue } = chartStyle;
    const dimensionMetricsMap = this.getFormDimensionMetricsMap();
    const dimensionName = fields.find(field => field.id === dimension)?.name || 'dimensionName';
    const dimensionField = fields.find(field => field.id === dimension);
    const metricsField = fields.find(field => field.id === metrics.fieldId);
    let metricsName = metricsField?.name || 'metricsName';
    const isCountRecords = metricsType === 'COUNT_RECORDS';
    if (isCountRecords) {
      metricsName = t(Strings.cout_records);
    }
    const isFormatDatetime = _isFormatDatetime && dimensionField?.formatType?.type === 'datetime';

    // ?????????????????????
    const rows = processRecords({
      records,
      dimensionField,
      metricsField,
      metricsType,
      isSplitMultiValue: isSplitMultipleValue,
    });

    // console.debug(rows);
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
    }).filter(v => v.angleField > 0);

    // ???????????????????????????????????????????????????????????????
    data = sortBy(data, (item) => {
      const angleValue = item[dimensionMetricsMap.metrics.key];
      if (angleValue == null) return 0; // FIXME: ???????????????????????????????????????
      return angleValue;
    });
    /**
     * ??????????????????????????????????????????????????? 12 ?????????????????????????????????????????????????????????
     * ????????????????????????????????? 12 ???????????????????????????????????????????????????
     * [0,1,2,20,30,100] => [100,0,1,2,20,30]
     */
    data = data.slice(-1).concat(data.slice(0, -1));
    // const totalMetrics = metricsType === 'COUNT_RECORDS' ? data.length : sum(data.map(item => item[dimensionMetricsMap.metrics.key]));
    // options
    const options: any = {
      // ??????
      data,
      [dimensionMetricsMap.dimension.key]: dimensionMetricsMap.dimension.key,
      [dimensionMetricsMap.metrics.key]: dimensionMetricsMap.metrics.key,
      // ??????
      marginRatio: 0,
      padding: 'auto',
      appendPadding: 20,
      meta: {
        [dimensionMetricsMap.dimension.key]: {
          alias: dimensionName,
        },
        [dimensionMetricsMap.metrics.key]: {
          alias: metricsName,
          formatter: v => {
            return v?.toFixed(isCountRecords ? 0 : getNumberBaseFieldPrecision(metricsField))
          },
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
      // TODO: ??????????????? https://integration.vika.ltd/space/spczdmQDfBAn5/workbench/dstagJqfo1u1NtrGpd/viwPP5RLhvf2E/reccBKA0zSQHP
      // tooltip: {
      //   formatter: (datum: Datum) => {
      //     const dimensionValue = datum[dimensionMetricsMap.dimension.key];
      //     const metricsValue = datum[dimensionMetricsMap.metrics.key];
      //     const percentage = metricsType === 'COUNT_RECORDS' ?
      //       groupRows[datum[dimensionMetricsMap.dimension.key]].length / totalMetrics :
      //       (metricsValue || 0) / totalMetrics;
      //     return { name: dimensionValue, value: `${metricsValue} (${(percentage * 100)?.toFixed(2) + '%'})` };
      //   },
      // },
      // ????????????
      ...moreOptions,
    };
    return options;
  }

}