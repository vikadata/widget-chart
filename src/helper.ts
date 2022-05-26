import { BasicValueType, Field, FieldType, ICurrencyFormat, INumberBaseFormatType, IPercentFormat, Record } from '@vikadata/widget-sdk';
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
import { Strings, t } from './i18n';
import { sortBy } from './sortBy';
import { IOutputChartData, IOutputRecordData } from '../interface';

dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);

const numberFormatTypes = ['number', 'currency', 'percent'];

/**
 * 判断值是否为空或者字符串空
 * @param arg 判断值
 */
const isNull = (arg) => arg == null || arg === t(Strings.null);

// const getReferenceValue = (value, field) => {
//   const { basicValueType, property } = field;
//   if (isNull(value)) {
//     return t(Strings.null);
//   }
//   switch(basicValueType) {
//     case BasicValueType.Number:
//     case BasicValueType.String:
//     case BasicValueType.Boolean:
//       return value.toString();
//     case BasicValueType.Array:
//       return value.map((v) => {
//         if (isNull(v)) {
//           return t(Strings.null);
//         }
//         return property?.entityField?.field ? getValueByType(v, property.entityField.field) : v;
//       }).join(',');
//     case BasicValueType.DateTime:
//       if (typeof value === 'number') {
//         const { dateFormat, timeFormat } = property.format.format;
//         return formatDatetime(value, `${dateFormat} ${timeFormat}`);
//       }
//       return value;
//     default:
//       return value;
//   }
// }

// /**
//  * 获取处理图表分类后的 label
//  * @param value 原始值
//  * @param field 字段
//  */
// export const getValueByType = (value, field: Field) => {
//   const { type, property } = field;
//   switch(type) {
//     case FieldType.Formula:
//     case FieldType.MagicLookUp:
//       return getReferenceValue(value, field);
//     case FieldType.MagicLink:
//       if (value == t(Strings.null)) {
//         return value;
//       }
//       return value.map((v) => v.title).join(',');
//     case FieldType.Text:
//     case FieldType.SingleText:
//     case FieldType.Rating:
//     case FieldType.URL:
//     case FieldType.Phone:
//     case FieldType.Email:
//     case FieldType.AutoNumber:
//         return value.toString() || t(Strings.null);
//     case FieldType.Percent:
//       return `${value} %`;
//     case FieldType.Number:
//       if (property.symbol) {
//         return `${value} ${property.symbol}`;
//       }
//       return value;
//     case FieldType.Currency:
//       if (property.symbol) {
//         return `${property.symbol} ${value}`;
//       }
//       return value || t(Strings.null);
//     case FieldType.MultiSelect:
//     case FieldType.Member:
//       if (value == t(Strings.null)) {
//         return value;
//       }
//       return value.map((v) => v.name).join(',');
//     case FieldType.DateTime:
//     case FieldType.CreatedTime:
//     case FieldType.LastModifiedTime:
//       const { dateFormat, timeFormat } = property;
//       if (typeof value === 'number') {
//         return formatDatetime(value, `${dateFormat} ${timeFormat}`);
//       }
//       return formatDatetime(value, dateFormat);;
//     case FieldType.Checkbox:
//       return value.toString();
//     case FieldType.SingleSelect:
//     case FieldType.CreatedBy:
//     case FieldType.LastModifiedBy:
//       if (value === t(Strings.null)) {
//         return value;
//       }
//       return value.name;
//     default:
//       return t(Strings.null);
//   }
// }

type SeriesValueType = string | number | { title?: string; name?: string };

/**
 * 根据堆叠字段获取处理后的值
 *  - 根据字段类型区分 23 种类型存在性能问题，所以做暴力区分，将 value 总结为 数组，对象，基本类型
 *  - 然后按照文档罗列对象中可能出现的 key，直接枚举
 * @param value 
 * @param field 
 * @returns 
 */
const getValueByType = (value, field) => {
  if (Array.isArray(value)) {
    const res: SeriesValueType[] = [];
    const dfs = (source) => {
      for (let i = 0; i < source.length; i++) {
        const item = source[i];
        if (Array.isArray(item)) {
          dfs(item);
        } else {
          res.push(item);
        }
      }
    }
    dfs(value);
    // 存在 [price, null]，可以考虑是否过滤 null
    return res.map((v) => {
      if (v != null && typeof v === 'object') {
        return formatterValue(field, v.name || v.title || t(Strings.null), false);
      }
      return formatterValue(field, v || t(Strings.null), false);
    }).join(',');
  }
  if (typeof value === 'object') {
    return formatterValue(field, value.name || value.title || t(Strings.null), false);
  }
  return formatterValue(field, value.toString(), false);
}

/**
 * 处理字符串中的特殊符号以及多选值，返回数字
 * @param value 处理值
 * @param symbol 特殊符号
 */
export const getNumberValueByReplaceSymbol = (value: string, symbol: string) => {
  if (isNull(value)) {
    return -1;
  }
  if (!symbol) {
    if (value.includes(',')) {
      return Number(value.split(',')[0]);
    }
    return Number(value);
  }
  const result = value.trim()
    .split(symbol)
    .filter((v) => (v.trim() !== '' && v.trim() !== t(Strings.null)))
    .map((v) => v.replaceAll(/\,/g, '').trim())[0];
  return Number(result);
}

/**
 * 获取不同分类的维度值
 */
export const groupByDimensionValue = ({ shouldFormatDatetime, datetimeFormatter, dimension }): string | number => {
  if (!dimension || dimension == t(Strings.null)) {
    return t(Strings.null);
  }
  if (shouldFormatDatetime) {
    if (dimension.includes(',')) {
      return dimension;
    }
    return formatDatetime(dimension, datetimeFormatter);
  }
  if (Array.isArray(dimension)) {
    return dimension.join(',');
  }
  return dimension;
}

/**
 * 格式化日期时间
 */
export const formatDatetime = (cv: number | number[], format: string) => {
  return [cv].flat().map(value => {
    const datetime = dayjs(value);
    return datetime.isValid() ? datetime.format(format) : null;
  }).join(',');
};

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
    return field.type === FieldType.Percent ? precision + 2 : precision;
  }
  // 存在格式化精度时
  if (field.formatType?.type && numberFormatTypes.includes(field.formatType?.type)) {
    const _precision = (field.formatType.formatting as INumberBaseFormatType).precision;
    return field.formatType.type === FieldType.Percent.toLocaleLowerCase() ? _precision + 2 : _precision;
  }
  return precision;
};

/**
 * 获取不同统计维度的长度值
 * 支持 - 总长度，求和，最小值，最大值，平均值
 */
export const getAggregationValue = (dataList: number[], type: string, precision = 2) => {
  let res: number = dataList.length;
  switch (type) {
    case 'COUNT':
      res = dataList.length;
      break;
    case 'SUM':
      res = sum(dataList);
      break;
    case 'MIN':
      res = min(dataList) as number;
      break;
    case 'MAX':
      res = max(dataList) as number;
      break;
    case 'AVERAGE':
      res = mean(dataList);
      break;
  }
  if (res != null) {
    // console.warn('非数值字段汇总错误');
    return isNumber(res) ? parseFloat(res.toFixed(precision)) : 0;
  }
  return res;
};

/**
 * 获取数表列的枚举值
 */
export const getFieldFormEnum = (fields: Field[]) => {
  const _enum = fields.map(field => field.id);
  const enumNames = fields.map(field => field.name);
  return { enum: _enum, enumNames };
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

  const groupOrStackConfig = {
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
};

/**
 * 格式化数值
 */
export const formatterValue = (field, value, notFormatter = true): string | number => {
  if (value === t(Strings.null)) {
    return value;
  }

  if (notFormatter) {
    return value;
  }
  const { property, type } = field;
  if (!property || type === FieldType.AutoNumber) {
    return value;
  }
  const validType = (condition) => {
    return Boolean(type === condition || (property?.format?.type === condition) || '');
  };
  const fieldSymbol = property.symbol || (property?.format?.format?.symbol) || '';
  const isCurrency = validType(FieldType.Currency);
  const isPercent = validType(FieldType.Percent);
  const isDate = validType(FieldType.DateTime);
  const isFomula = validType(FieldType.Formula);
  const isNumber = validType(FieldType.Number) && fieldSymbol;
  // 货币
  if (isCurrency) {
    return `${fieldSymbol} ${value}`;
  }
  // 百分比，带单位的数字
  if (isPercent || isNumber) {
    const suffixSymbol = isPercent ? '%' : fieldSymbol;
    return `${Number(value).toFixed(1)} ${suffixSymbol}`;
  }

  // 智能公式日期 - value 为时间戳
  if (isFomula && isDate) {
    const { dateFormat, timeFormat } = property.format.format;
    return formatDatetime(Number(value), `${dateFormat} ${timeFormat}`);
  }
  return value;
}

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

/**
 * 表数据按 x 轴进行分类预处理
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
  // const start = Date.now();
  const metricsIsPercent = metricsField?.type === FieldType.Percent ||
    metricsField?.property?.format?.type === FieldType.Percent;
  const scaleMetricsNum = metricsIsPercent ? 100 : 1;
  const seriesIsPercent = seriesField?.type === FieldType.Percent;
  const res = records.map(record => {
    const shouldSplitDimensionValue = isSplitMultiValue && dimensionField?.basicValueType === BasicValueType.Array;
    const recordData: IOutputRecordData = {};
    if (metricsField) {
      recordData.metrics = record.getCellValue(metricsField?.id) * scaleMetricsNum;
    }
    if (seriesField) {
      let val = record.getCellValue(seriesField.id);
      if (seriesIsPercent) {
        val *= 100;
      }
      recordData.series = val;
    }
    let dimensionValue = record.getCellValueString(dimensionField.id) || t(Strings.null);
    if (shouldSplitDimensionValue) {
      if (dimensionValue.includes(',')) {
        return dimensionValue.split(',').filter(item => item != null).map(item => ({
          ...recordData,
          dimension: item.trim().split('\n').join(' ')
        }));
      }
      return { ...recordData, dimension: dimensionValue };
    }
    recordData.dimension = dimensionValue.trim().split('\n').join(' ');
    return [recordData];
  }).flat();
  // console.log('takes time: ', Date.now() - start);
  return res;
};

/**
 * 分组、空值、日期格式化
 * @param {Object} data 
 * @property {IOutputRecordData[]} data.rows - 统计的记录
 * @property {dimensionMetricsMap[]} data.dimensionMetricsMap - 表单统计的维度字段{key, value}
 * @property {Field} data.dimensionField - 统计维度的属性
 * @property {string} data.metricsType - 统计数值的类型（总计/指定字段）
 * @property {Field} data.metricsField - 统计数值的属性
 * @property {Field} data.seriesFieldInstance
 * @property {Boolean} data.isCountNullValue - 是否统计空值
 * @property {Boolean} data.isFormatDatetime - 是否格式化日期时间
 * @property {String} data.datetimeFormatter - 日期时间格式化的格式字符串
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
}): IOutputChartData[] => {
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
  let res: IOutputChartData[] = [];
  const shouldFormatDatetime = isFormatDatetime && datetimeFormatter;
  // 分组处理 - 按分类维度，将表格数据分组。
  if (seriesFieldInstance) {
    // 分类维度[分组维度] 统计指标
    const groupData = groupBy(rows, row => (
      JSON.stringify([
        groupByDimensionValue({
          dimension: row.dimension,
          shouldFormatDatetime,
          datetimeFormatter
        }) || t(Strings.null),
        row.series || t(Strings.null)
      ])
    ));
    res = Object.keys(groupData).map(key => {
      const [dimension, series] = JSON.parse(key);
      return {
        [dimensionMetricsMap.metrics.key]: metricsType === 'COUNT_RECORDS' ?
          groupData[key].length :
          getAggregationValue(
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
    // 未分组下的数据，按 x 轴维度聚合。
    const groupRows = groupBy(rows, row => {
      return groupByDimensionValue({
        dimension: row.dimension,
        shouldFormatDatetime,
        datetimeFormatter
      });
    });
    // 未显示空维度值时，删除
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
          groupRows[key].length :
          getAggregationValue(y, metrics.aggregationType, getNumberBaseFieldPrecision(metricsField)),
      };
    });
  }
  return res;
};

/**
 * 处理堆叠分组的神奇引用字段
 * @param value 原始值
 * @param field 最终引用的字段
 */
const getReferenceSeriesValue = (value, field: Field) => {
  const { type, property } = field;
  // console.log(value.flat(), property, field.type);
  let deep = 2;
  if ([FieldType.SingleSelect, FieldType.CreatedBy, FieldType.LastModifiedBy].includes(type)) {
    deep = 1;
  }
  switch(type) {
    case FieldType.Member:
    case FieldType.CreatedBy:
    case FieldType.LastModifiedBy:
      return value.flat(deep).filter((v) => v != null).map((v) => v.name)[0];
    case FieldType.Formula:
      return value.flat()[0];
    case FieldType.MultiSelect:
    case FieldType.SingleSelect:
      const name = value.flat(deep).filter((v) => v != null).map((v) => v.name)[0];
      return property.options.findIndex((v) => v.name === name);
    case FieldType.MagicLink:
      return value.flat(2).map((v) => v.title)[0];
    case FieldType.DateTime:
      const day = value.flat()[0];
      return new Date(day).valueOf();
    default:
      return value[0] || t(Strings.null);
  }
}

/**
 * 返回分类维度字段、分组/堆叠字段对应的排序函数
 * @param key xField、yField、fldxxxxxx(分组/堆叠字段的id)
 * @param field 
 */
export const getSortFuncByField = (key: string, field?: Field, isAxis = true) => {
  if (!field) {
    return null;
  }
  const { type, property } = field;
  if (!isAxis) {
    // 处理堆叠字段的排序
    // console.log(type, property);
    switch(type) {
      case FieldType.MagicLink:
        return (item) => {
          const value = item[key];
          if (isNull(value)) {
            return t(Strings.null);
          }
          return value.map((v) => v.title).join(',')
        };
      case FieldType.SingleSelect:
        return (item) => property.options.findIndex((v) => v.name === item[key].name);
      case FieldType.MultiSelect:
        return (item) => property.options.findIndex((v) => v.name === item[key][0].name);
      case FieldType.Member:
        return (item) => item[key][0].name;
      case FieldType.CreatedBy:
      case FieldType.LastModifiedBy:
        return (item) => item[key].name;
      case FieldType.MagicLookUp:
        const referenceField = property.entityField.field;
        return (item) => getReferenceSeriesValue([item[key]], referenceField);
      default:
        return (item) => {
          const value = item[key];
          return typeof value === 'string' ? value.trim() : value;
        };
    }
  }
  // 处理轴维度的排序 - 字符串
  switch(type) {
    case FieldType.MultiSelect:
    case FieldType.SingleSelect:
      return (item) => property.options.findIndex((v) => v.name === item[key]);
    case FieldType.Currency:
    case FieldType.Number:
      return (item) => getNumberValueByReplaceSymbol(item[key], property.symbol || '');
    case FieldType.Percent:
      return (item) => getNumberValueByReplaceSymbol(item[key], '%');
    case FieldType.Formula:
      if (property.format) {
        const { type: formulaType, format: formulaFormat } = property.format;
        if (formulaType !== FieldType.DateTime) {
          const symbol = formulaType === FieldType.Percent ? '%' : formulaFormat.symbol;
          return (item) => getNumberValueByReplaceSymbol(item[key], symbol);
        }
      }
      return (item) => item[key];
    case FieldType.AutoNumber:
      return (item) => Number(item[key]);
    case FieldType.MagicLookUp:
      const referenceField = property.entityField.field;
      return getSortFuncByField(key, referenceField);
    default:
      return (item) => item[key];
  }
};

/**
 * 从一组数字中获取最大精度
 * @example guessNumberFieldPrecision([1.22, 1.23, 1, 2, 3.555]) => 3
 */
export const guessNumberFieldPrecision = (numbers: number[]) => {
  return Math.max(0, ...numbers.map(item => {
    const [, right] = item.toString().split('.');
    return (right || '').length;
  }));
};

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
          sortFuncs.push(getSortFuncByField(seriesField.id, seriesField, false));
        }
        break;
      case 'metrics':
        // 存在分组堆叠字段
        if (seriesField) {
          // 按分类维度分组
          const groupData = groupBy(data, dimensionMetricsMap.dimension.key);
          // 按每组的统计指标总值排序。
          const groupBySeries = Object.keys(groupData).map(dimension => ({
            key: dimension,
            value: sumBy(groupData[dimension], axisName)
          }));
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

  return data;
};

export const maxRenderNum = 501;
export const sortSeries = (props: {
  axisSortType: { axis: string; sortType: string };
  dimensionMetricsMap: IDimensionMetricsMap;
  dimensionField: Field;
  seriesField?: Field;
  data;
  isColumn?: boolean;
  isPercent?: boolean;
}) => {
  const {
    axisSortType,
    dimensionMetricsMap,
    dimensionField,
    data,
    seriesField,
    isColumn,
    isPercent = false,
  } = props;

  const yKey = dimensionMetricsMap.metrics.key;

  const mainAxisName = dimensionMetricsMap.dimension.key;
  const axisNames: string[] = [];
  const legendNames = new Set<string>();
  let newData = [...data];

  if (axisSortType) {
    const { axis, sortType } = axisSortType;
    const axisItem = Object.entries(dimensionMetricsMap).find(item => item[1].key === axis)!;
    const axisType = axisItem[0];
    const axisName = axisType === 'dimension' ? dimensionMetricsMap.dimension.key : dimensionMetricsMap.metrics.key;
    const sortByXaxis = axisType === 'dimension';
    const isDESC = sortType === 'DESC';

    // x 轴排序
    const commonSortFunc = getSortFuncByField(mainAxisName, dimensionField);
    if (sortByXaxis) {
      newData = sortBy(newData, [commonSortFunc], false);
    } else {
      // y 轴排序
      // 按分类维度分组
      const groupData = groupBy(newData, mainAxisName);
      // 按每组的统计指标总值排序。
      const groupBySeries = Object.keys(groupData).map(dimension => ({
        key: dimension,
        value: sumBy(groupData[dimension], axisName)
      }));
      const groupSortKeys = sortBy(groupBySeries, 'value').map(item => item.key);
      newData = sortBy(
        newData,
        [
          (item) => groupSortKeys.findIndex(dimensionValue => dimensionValue === item[mainAxisName]),
          commonSortFunc
        ],
        false
      ).flat();
    }

    if (isDESC) {
      newData.reverse();
    }

    // 百分比处理
    if (isPercent) {
      const sums: number[] = [];
      // 求和
      for (let i = 0; i < newData.length; i++) {
        const sortList = newData[i];
        for (let j = 0; j < sortList.length; j++) {
          if (sums[i] == null) {
            sums[i] = 0;
          }
          sums[i] += sortList[j][yKey];
        }
      }
      // 百分比化处理
      for (let i = 0; i < newData.length; i++) {
        const sortList = newData[i];
        for (let j = 0; j < sortList.length; j++) {
          const val = sortList[j][yKey];
          sortList[j][yKey] = (val / sums[i] * 100).toFixed(2);
        }
      }
    }

    if (seriesField) {
      // 直接读取 seriesField 的属性存在问题，性能过低，每次链式调用一次 seriesField 的属性需要花费 20 - 40毫秒不等
      let paramField = seriesField;
      if (seriesField.type === FieldType.MagicLookUp) {
        paramField = paramField.property.entityField.field;
      }
      let property = paramField.property;
      let type = paramField.type;

      // const start = Date.now();
      const seriesArr: { sortKey: string; series: number[][] }[] = [];
      for (let i = 0; i < newData.length; i++) {
        const list = newData[i];
        for (let j = 0; j < list.length; j++) {
          const item = list[j];
          const mainAxisIndex = axisNames.findIndex((v) => v === item[mainAxisName]);
          let coordinateSaveIndex = mainAxisIndex;
          // 查询是否存在对应的主轴项，没有则新增
          if (mainAxisIndex < 0) {
            coordinateSaveIndex = axisNames.length;
            axisNames.push(item[mainAxisName]);
          }
          // const start = Date.now();
          const seriesValue = getValueByType(item[seriesField.id], { type, property });
          // console.log('cals series value need takes time ', Date.now() - start);
          const coordinate = isColumn ? [coordinateSaveIndex, item[yKey]] : [item[yKey], coordinateSaveIndex];
          const seriesItem = seriesArr.find((v) => v.sortKey === seriesValue);
          legendNames.add(seriesValue.toString());
          if (seriesItem) {
            // 合并同类项
            const lastItem = seriesItem.series[seriesItem.series.length - 1];
            const coordinateIndex = isColumn ? 0 : 1;
            const valueIndex = isColumn ? 1 : 0;
            const isEqualPrev =  coordinate[coordinateIndex] === lastItem[coordinateIndex];
            if (isEqualPrev) {
              lastItem[valueIndex] += coordinate[valueIndex];
            } else {
              seriesItem.series.push(coordinate);
            }
            seriesItem.series = [...seriesItem.series];
          } else {
            seriesArr.push({ sortKey: seriesValue.toString(), series: [coordinate] });
          }
        }
      }
      // console.log('cals series value need takes time ', Date.now() - start);
      const canReplaceSymbol = [FieldType.Currency, FieldType.Percent, FieldType.Number].includes(type);
      const result = sortBy(seriesArr, (item) => {
        // 应当按值排序？
        let key = item.sortKey;
        if (isNull(key)) {
          return t(Strings.null);
        }
        if (!canReplaceSymbol) {
          return key.toString().trim();
        }
        if (key.includes(',')) {
          key = key.split(',').filter((v) => v != null && v !== t(Strings.null))[0];
          if (key == null) {
            return -1;
          }
        }
        key = key.replace(property.symbol || '', '').trim();
        return Number(key);
      });
      // 给标签排个序
      const shouldReplaceSymbol = [FieldType.Percent, FieldType.Currency, FieldType.Number].includes(type);
      let fieldSymbol = property?.symbol || (property?.format?.format?.symbol) || '';
      if (type === FieldType.Percent) {
        fieldSymbol = '%';
      }
      const sortedLegendNames = [...legendNames].sort((a, b) => {
        if (shouldReplaceSymbol) {
          return Number(a.replace(fieldSymbol, '').trim()) -
            Number(b.replace(fieldSymbol, '').trim())
        }
        return a.trim().localeCompare(b.trim());
      }).slice(0, maxRenderNum);
      return {
        axisNames: [...axisNames].slice(0, maxRenderNum),
        legendNames: sortedLegendNames,
        sortedSeries: result.slice(0, maxRenderNum)
      };
    }
  }

  newData = newData.flat();
  for (let i = 0; i < newData.length; i++) {
    const itemName = newData[i][mainAxisName];
    if (axisNames.indexOf(itemName) < 0) {
      axisNames.push(itemName);
    }
  }

  return {
    axisNames: [...axisNames].slice(0, maxRenderNum),
    legendNames: [...legendNames].slice(0, maxRenderNum),
    sortedSeries: newData.slice(0, maxRenderNum)
  };
};
