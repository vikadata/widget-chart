import { Strings } from './i18n';
import { BasicValueType, Field, FieldType, ICurrencyFormat, INumberBaseFormatType, IPercentFormat, Record, t } from '@vikadata/widget-sdk';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import groupBy from 'lodash/groupBy';
import isNumber from 'lodash/isNumber'; 
import max from 'lodash/max'; 
import mean from 'lodash/mean'; 
import min from 'lodash/min'; 
import sum from 'lodash/sum';
import sumBy from 'lodash/sumBy';
import { IDimensionMetricsMap, StackType } from './model/interface';

// 中文敏感字符串比较的 collators 构造函数。
const zhIntlCollator = typeof Intl !== 'undefined' ? new Intl.Collator('zh-CN') : undefined;

const _sort = (data: any[], iteratee: string | Function) => {
  return data.sort((a, b) => {
    let str1 = a;
    let str2 = b;
    if (typeof iteratee === 'function') {
      str1 = iteratee(str1);
      str2 = iteratee(str2);
    }
    if (typeof iteratee === 'string') {
      str1 = str1[iteratee];
      str2 = str2[iteratee];
    }
    if (str1 === str2) {
      return 0;
    }
    if (str1 == null) {
      return -1;
    }
    if (str2 == null) {
      return 1;
    }
    return str1 === str2 ? 0 :
      zhIntlCollator ? zhIntlCollator.compare(str1, str2) : (str1.localeCompare(str2, 'zh-CN') > 0 ? 1 : -1);
  })
}

/** lodash 上 sortBy 对于中文排序和目前维格表里面不一致，这里重写一下，保持一致 */
export const sortBy = (collection: Array<any>, iteratees: Function[] | Function | string | string[]) => {
  let _iteratees: any[] = Array.isArray(iteratees) ? iteratees : [iteratees];
  let res: any[] = collection;
  _iteratees.forEach(iteratee => {{
    res = _sort(res, iteratee)
  }})
  return res;
}

dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);

export const formatDatetime = (cv: number | number[], format: string) => {
  return [cv].flat().map(value => {
    const datetime = dayjs(value);
    if (datetime.isValid()) {
      return datetime.format(format);
    }
    return null;
  }).join(',');
};

const numberFormatTypes = ['number', 'currency', 'percent'];
/**
 * - 只有输出为数值类型的字段才能做统计指标。这里需要处理百分比字段原始值的精度。
 * - 数值字段返回原始值。即百分比 10.12% 返回的是 0.1012
 * - 百分比字段的精度如果是 2，则实际原始值的精度应该是 4
 * - 百分比字段、计算字段格式化为百分比字段。都需要加 2 位精度。
 * @param field 
 * @returns 
 */
export const getNumberBaseFieldPrecision = (field?: Field) => {
  let precision = 2;
  if (!field) return precision;
  // 实体字段本身的 property 里面有精度时
  if (field.property?.precision != null) {
    precision = field.property?.precision;
    if (field.type === FieldType.Percent) {
      precision += 2;
    }
    return precision;
  }
  // 存在格式化精度时
  if (field.formatType?.type && numberFormatTypes.includes(field.formatType?.type)) {
    const _precision = (field.formatType.formatting as INumberBaseFormatType).precision;
    if (field.formatType.type === 'percent') return _precision + 2;
    return _precision;
  }
  return precision;
};

export const getAggregationValue = (dataList: number[], type: string, precision = 2) => {
  let res: number | undefined = dataList.length;
  switch (type) {
    case 'COUNT':
      res = dataList.length;
      break;
    case 'SUM':
      res = sum(dataList);
      break;
    case 'MIN':
      res = min(dataList);
      break;
    case 'MAX':
      res = max(dataList);
      break;
    case 'AVERAGE':
      res = mean(dataList);
      break;
  }
  if (res != null) {
    if (isNumber(res)) {
      return parseFloat(res.toFixed(precision));
    }
    // console.warn('非数值字段汇总错误');
    return 0;
  }
  return res;
};

export const getFieldFormEnum = (fields: Field[]) => {
  const _enum = fields.map(field => field.id);
  const enumNames = fields.map(field => field.name);
  return {
    enum: _enum, enumNames,
  };
};

export const transformAnnotation: any = (annotation: {
  title: string;
  color: string;
  value: number;
}) => {
  const { title, value, color } = annotation;
  return [
    {
      type: 'text',
      position: ['min', value],
      content: title,
      offsetY: -4,
      style: {
        textBaseline: 'bottom',
      },
    },
    {
      type: 'line',
      start: ['min', value],
      end: ['max', value],
      style: {
        stroke: color,
        lineDash: [2, 2],
      },
    },
  ];
};

export const getGroupOrStackFormJSON = (fields: Field[], stackType: StackType) => {
  const fieldEnum = fields.map(field => field.id);
  const fieldEnumNames = fields.map(field => field.name);

  const groupOrStackConfig: any = {
    seriesField: {
      title: t(Strings.group_by_field),
      type: 'string',
      enum: ['', ...fieldEnum],
      enumNames: [t(Strings.group_blank), ...fieldEnumNames],
    },
  };
  switch (stackType) {
    case StackType.Stack:
      groupOrStackConfig.seriesField.title = t(Strings.stacked_by_field);
      break;
    case StackType.Percent:
      groupOrStackConfig.seriesField.title = t(Strings.percent_stacked_by_field);
      break;
  }
  return groupOrStackConfig;
};

// 处理横纵坐标轴、数据标签文案展示，
export const getFormatter = (field?: Field, times = 1) => {
  const defaultFormatter = (val) => `${typeof val === 'string' ? val.split('\n').join(' ') : val}`;
  if (!field) return defaultFormatter;
  if (field.formatType?.type === 'datetime') return false;
  // 货币/百分比需要加上符号
  if (field.formatType?.type === 'currency') {
    const formatting = field.formatType.formatting as ICurrencyFormat;
    return (val) => `${formatting.symbol} ${parseFloat(val).toFixed(formatting.precision)}`;
  }
  if (field.formatType?.type === 'percent') {
    const formatting = field.formatType.formatting as IPercentFormat;
    return (val) => `${(parseFloat(val) * times).toFixed(formatting.precision)}%`;
  }
  // val 中包含 \n 时候转化为空格。
  return defaultFormatter;
  // return false;
};

// 分类维度是数值的时候才会掉这个方法
export const getRightDimensionValue = (value: string, field?: Field): string | number => {
  const dimension: string | number = value;
  if (typeof value === 'number') return value;
  // 非计算字段都有 string 转化为 cv 的方法， 
  // lookup 可以通过实体字段转换，formula 没有这种操作，lookup 了 formula 也没有这种操作。
  if (field?.entityType !== FieldType.Formula) {
    return field?.convertStringToCellValue(value);
  }
  try {
    if (field && field.formatType?.type === 'currency') {
      return Number(value?.replace(/[^0-9.-]+/g, ''));
    }
    if (field && field.basicValueType === BasicValueType.Number) {
      return parseFloat(dimension);
    }
  } catch (error) {
    console.error('parseFloat Failed');
    return value;
  }
  return value;
};

/**
 * 当前统计字表相关信息是否合理
 */
export const checkMetrics = (metricsType: string, metricsField?: Field) => {
  if (metricsType === 'COUNT_RECORDS') return true;
  return Boolean(metricsField);
};

type IOutputRecordData = {
  dimension: any;
  metrics: any;
  series?: any;
};
/**
 * 预处理数表数据
 */
export const processRecords = (
  data: {
    records: Record[];
    dimensionField?: Field;
    metricsField?: Field;
    metricsType: string;
    seriesField?: Field;
    isSplitMultiValue?: boolean;
    isCountNullValue?: boolean;
  }
): IOutputRecordData[] => {
  const { records, dimensionField, metricsField, metricsType, seriesField, isSplitMultiValue } = data;
  if (!dimensionField || !checkMetrics(metricsType, metricsField)) return [];
  return records.map(record => {
    const shouldSplitDimensionValue = isSplitMultiValue && dimensionField?.basicValueType === BasicValueType.Array;
    const recordData: any = {};
    if (metricsField) {
      recordData.metrics = record._getCellValue(metricsField?.id);
    }
    if (seriesField) {
      recordData.series = record._getCellValue(seriesField.id);
    }
    const dimensionValue = record._getCellValue(dimensionField.id);
    if (shouldSplitDimensionValue && Array.isArray(dimensionValue)) {
      return dimensionValue.filter(item => item != null).map(item => {
        return {
          ...recordData,
          dimension: [item]
        };
      });
    }
    recordData.dimension = record._getCellValue(dimensionField.id);
    return [recordData];
  }).flat();
};

/**
 * 分组、空值、日期格式化
 * @param data 
 */
export const processChartData = (data: {
  rows: IOutputRecordData[];
  dimensionMetricsMap: IDimensionMetricsMap;
  dimensionField?: Field;
  metricsType: string;
  metrics: any;
  metricsField?: Field;
  seriesFieldInstance?: Field;
  isCountNullValue: boolean;
  isFormatDatetime?: boolean;
  datetimeFormatter?: string;
}) => {
  const {
    rows,
    dimensionMetricsMap,
    dimensionField,
    metricsType,
    metrics,
    metricsField,
    seriesFieldInstance,
    isCountNullValue,
    isFormatDatetime,
    datetimeFormatter,
  } = data;
  if (!dimensionField || !checkMetrics(metricsType, metricsField)) {
    return [];
  }
  let res: any[] = [];
  const shouldFormatDatetime = isFormatDatetime && datetimeFormatter;
  const _getDimensionValue = (dimension) => {
    const _dimension = shouldFormatDatetime ? formatDatetime(dimension, datetimeFormatter!)
      : dimensionField?.convertCellValueToString(dimension);
    return _dimension || t(Strings.null);
  };
  const _getSeriesFieldValue = (series) => {
    const _series = seriesFieldInstance?.convertCellValueToString(series);
    if (_series == null) {
      return t(Strings.null);
    }
    return _series;
  };
  // 处理分组
  // 按分类维度，将表格数据分组。
  if (seriesFieldInstance) {
    // 分类维度[分组维度] 统计指标
    const groupData = groupBy(rows, row => {
      return JSON.stringify([_getDimensionValue(row.dimension), _getSeriesFieldValue(row.series)]);
    });
    res = Object.keys(groupData).map(key => {
      const [dimension, series] = JSON.parse(key) as any[];
      return {
        [dimensionMetricsMap.metrics.key]: metricsType === 'COUNT_RECORDS' ?
          groupData[key].length : getAggregationValue(
            groupData[key].map(item => item.metrics),
            metrics.aggregationType,
            getNumberBaseFieldPrecision(metricsField)
          ),
        [dimensionMetricsMap.dimension.key]: dimension,
        [seriesFieldInstance.id]: series,
      };
    });
    if (!isCountNullValue) {
      res = res.filter(item => item[dimensionMetricsMap.dimension.key] !== t(Strings.null));
    }
  } else {
    // 未分组下的数据，按分类维度聚合。
    const groupRows = groupBy(rows, row => {
      try {
        return _getDimensionValue(row.dimension);
      } catch (error) {
        return null;
      }
    });
    if (!isCountNullValue) {
      delete groupRows['null'];
      delete groupRows[t(Strings.null)];
    }
    res = Object.keys(groupRows).map(key => {
      const x = key;
      const y = groupRows[key].map(row => row.metrics);
      return {
        [dimensionMetricsMap.dimension.key]: x,
        [dimensionMetricsMap.metrics.key]: metricsType === 'COUNT_RECORDS' ?
          groupRows[key].length : getAggregationValue(y, metrics.aggregationType, getNumberBaseFieldPrecision(metricsField)),
      };
    });
  }
  return res;
};

/**
 * 返回分类维度字段、分组/堆叠字段对应的排序函数
 * @param key xField、yField、fldxxxxxx(分组/堆叠字段的id)
 * @param field 
 */
const getSortFuncByField = (key: string, field?: Field) => {
  let sortFunc: any = (item, b) => item[key];
  const isSortByFieldOptions = Boolean(field?.type && [FieldType.SingleSelect, FieldType.MultiSelect].includes(field?.type));
  // 按照单多选顺序排序
  if (isSortByFieldOptions) {
    sortFunc = (item) => field?.property.options.findIndex(opt => opt.name === item[key]);
  } else if (field?.basicValueType === BasicValueType.Number) {
    // 分类维度是数值的时候，需要按数值大小排序。
    sortFunc = (item) => getRightDimensionValue(item[key], field);
  }
  return sortFunc;
};

/**
 * [
 *  {
 *    xField: '¥120',
 *    yField: 456,
 *    fldxxxxxxxx: 'string',
 *  },
 *  {
 *    xField: '¥13',
 *    yField: 200,
 *    fldxxxxxxxx: 'string',
 *  },
 * ]
 * 对前置处理好的数据进行排序
 * 分组和堆叠相当于设置的第二个维度
 * 1、当图形以维度进行排序时
 * 组与组之间按照维度值进行排序，组内按照（分组和堆叠字段的值）进行排序（分组是从左到右排，堆叠是从上到下排）
 * 2、当图形以数值进行排序时
 * 组与组之间按照每组数值的求和值进行排序，组内按照数值大小进行排序
 * @param param0
 */
export const processChartDataSort = ({ axisSortType, dimensionMetricsMap, dimensionField, data, seriesField }: {
  axisSortType: any;
  dimensionMetricsMap: IDimensionMetricsMap;
  dimensionField?: Field;
  seriesField?: Field;
  data: any[];
}) => {
  if (!dimensionField) return [];
  const { axis, sortType } = axisSortType;
  const axisItem = Object.entries(dimensionMetricsMap).find(item => item[1].key === axis);
  if (axisItem) {
    // 按维度排序，还是按指标排序
    const axisType = axisItem[0];
    const axisName = axisType === 'dimension' ? dimensionMetricsMap.dimension.key : dimensionMetricsMap.metrics.key;
    const isDESC = sortType === 'DESC';
    const sortFuncs: any[] = [];

    switch (axisType) {
      case 'dimension':
        // 获取分类维度的排序函数。
        sortFuncs.push(getSortFuncByField(dimensionMetricsMap.dimension.key, dimensionField));
        // 如果存在分类/堆叠字段，获取二次分类维度的排序函数。
        if (seriesField) {
          sortFuncs.push(getSortFuncByField(seriesField.id, seriesField));
        }
        break;
      case 'metrics':
        // 存在分组堆叠字段
        if (seriesField) {
          // 按分类维度分组
          const groupData = groupBy(data, dimensionMetricsMap.dimension.key);
          // 按每组的统计指标总值排序。
          const groupBySeries = Object.keys(groupData).map(dimension => {
            return {
              key: dimension,
              value: sumBy(groupData[dimension], axisName)
            };
          });
          const groupSortKeys = sortBy(groupBySeries, 'value').map(item => item.key);
          sortFuncs.push((item) => groupSortKeys.findIndex(dimensionValue => dimensionValue === item[dimensionMetricsMap.dimension.key]));
        }
        sortFuncs.push((item) => item[dimensionMetricsMap.metrics.key]);
        break;
    }
    data = sortBy(data, sortFuncs);
    if (isDESC) {
      (data as []).reverse();
    }
  }
  // 排序完还得把分类维度转化为字符串。 参见：https://github.com/antvis/G2Plot/issues/2293
  if (dimensionField?.basicValueType === BasicValueType.Number) {
    data = data.map(item => ({ ...item, [dimensionMetricsMap.dimension.key]: item[dimensionMetricsMap.dimension.key] + '' }));
  }
  return data;
};

/**
 * 从一组数字中获取最大精度
 * 例如：[1.22,1.23,1,2,3.555] => 3
 */
 export const guessNumberFieldPrecision = (numbers: number[]) => {
  return Math.max(0, ...numbers.map(item => {
    const [, right] = item.toString().split('.');
    return (right || '').length;
  }));
};
