import {
  BasicValueType,
  Field,
  FieldType,
  ICurrencyFormat,
  INumberBaseFormatType,
  IPercentFormat,
  Record
} from '@apitable/widget-sdk';
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
import {safeParseNumberOrText} from "./utils";

dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);

const NEED_FORMAT_DATE_TIME_TYPES = new Set([
  FieldType.DateTime,
  FieldType.CreatedTime,
  FieldType.LastModifiedTime,
]);

const numberFormatTypes = ['number', 'currency', 'percent'];

/**
 * Determine if the value is null or string null.
 * @param arg Judgment Value
 */
const isNull = (arg) => arg == null || arg === t(Strings.null);

/**
 * Check the DateTime type.
 * @param field Field Properties
 */
const checkDateTimeType = (field: Field) => {
  const { entityType, basicValueType } = field || {};
  return NEED_FORMAT_DATE_TIME_TYPES.has(entityType) || basicValueType === BasicValueType.DateTime;
};

type SeriesValueType = string | number | { title?: string; name?: string };

/**
 * Get processed values based on stacked fields
 *  - There are performance problems in distinguishing 23 types based on field types, so we do a brute force distinction and summarize the values as arrays, objects, and basic types.
 *  - Then enumerate the possible keys in the object according to the document, directly.
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
    };
    dfs(value);
    // There is [price, null], you can consider whether to filter null.
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
};

/**
 * Handles special symbols in strings and multiple choice values, returning numbers.
 * @param value Processing value
 * @param symbol Special Symbols
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
};

/**
 * Returns a value based on whether it is a date field or not.
 */
const getDimenssionValue = (
  dimension,
  { toNumber, datetimeFormatter, shouldFormatDatetime, defaultTimeFormatter }
) => {
  const formatterStr = shouldFormatDatetime ? datetimeFormatter : defaultTimeFormatter;
  return toNumber ? formatDatetime(Number(dimension), formatterStr) : dimension;
};

/**
 * Get dimensional values for different categories.
 */
export const groupByDimensionValue = ({
  shouldFormatDatetime, datetimeFormatter, dimension, toNumber
}): string | number => {
  if (!dimension || dimension == t(Strings.null)) {
    return t(Strings.null);
  }
  const defaultTimeFormatter = 'YYYY-MM-DD';
  const config = { toNumber, datetimeFormatter, shouldFormatDatetime, defaultTimeFormatter };
  if (shouldFormatDatetime) {
    if (dimension.includes(',')) {
      return dimension.split(',').map((v) => getDimenssionValue(v, config)).join(',');
    }
    return getDimenssionValue(dimension, config);
  }
  if (Array.isArray(dimension)) {
    return dimension.map((v) => getDimenssionValue(v, config)).join(',');
  }
  return getDimenssionValue(dimension, config);
};

/**
 * Formatting Date Time.
 */
export const formatDatetime = (cv: number | number[], format: string) => {
  return [cv].flat().map(value => {
    const datetime = dayjs(value);
    return datetime.isValid() ? datetime.format(format) : null;
  }).join(',');
};

/**
 * - Only fields whose output is of numeric type can be used as statistical indicators.
 * The precision of the original value of the percentage field needs to be handled here.
 * - The Numeric field returns the original value. That is, the percentage 10.12% returns 0.1012.
 * - If the precision of the percentage field is 2, the precision of the actual original value should be 4.
 * - Percentage fields, calculated fields are formatted as percentage fields. All need to add 2 bits of precision.
 * @param field 
 * @returns
 */
export const getNumberBaseFieldPrecision = (field?: Field) => {

  let precision = 2;
  if (!field) return precision;
  // When there is precision in the property of the entity field itself.
  if (field.property?.precision != null) {
    precision = field.property?.precision;
    return field.type === FieldType.Percent ? precision + 2 : precision;
  }
  // When formatting accuracy exists.
  if (field.formatType?.type && numberFormatTypes.includes(field.formatType?.type)) {
    const _precision = (field.formatType.formatting as INumberBaseFormatType).precision;
    return field.formatType.type === FieldType.Percent.toLocaleLowerCase() ? _precision + 2 : _precision;
  }
  return precision;
};

/**
 * Get the length values of different statistical dimensions.
 * Support - Total length, summation, minimum, maximum, average.
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
    // console.warn('Non-numeric field summary error');
    return isNumber(res) ? Number(res.toFixed(precision)) : 0;
  }

  return res;
};

/**
 * Get the enumerated values of the number table columns.
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

// Processing of horizontal and vertical axes, data labeling text presentation.
export const getFormatter = (field?: Field, times = 1) => {
  const defaultFormatter = (val) => `${typeof val === 'string' ? val.split('\n').join(' ') : val}`;
  if (!field) return defaultFormatter;
  if (field.formatType?.type === 'datetime') return false;
  // Currency/percentage needs to be signed.
  if (field.formatType?.type === 'currency') {
    const formatting = field.formatType.formatting as ICurrencyFormat;
    return (val) => `${formatting.symbol} ${safeParseNumberOrText(val, formatting.precision)}`;
  }
  if (field.formatType?.type === 'percent') {
    const formatting = field.formatType.formatting as IPercentFormat;
    return (val) => `${ safeParseNumberOrText((parseFloat(val) * times), formatting.precision)} %`;
  }
  // val is converted to a space when it contains '\n'.
  return defaultFormatter;
};

/**
 * Formatted Values.
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
  const isNumberType = validType(FieldType.Number) || property.valueType === FieldType.Number;
  const precision = property?.precision ?? property?.format?.format?.precision ?? 1;
  if (isCurrency) {
    try {
      const textValue = isNumber(value) ? safeParseNumberOrText(value, precision) : safeParseNumberOrText(value, precision);
      return `${fieldSymbol} ${textValue}`;
    }catch (e) {
      console.error('parse currency' , e);
      return `${fieldSymbol} ${String(value)}`;
    }
  }

  // Percentages, numbers with units.
  if (isPercent || isNumberType) {
    const suffixSymbol = isPercent ? '%' : fieldSymbol;
    return `${safeParseNumberOrText(value, precision)} ${suffixSymbol}`;
  }

  // Smart Formula Date, value is timestamp.
  if (isFomula && isDate) {
    const { dateFormat, timeFormat, includeTime } = property.format.format;
    const formatterDateStr = `${dateFormat} ` + (includeTime ? timeFormat : '');
    return formatDatetime(Number(value), formatterDateStr);
  }

  return value;
};

// This method is dropped only when the classification dimension is numerical.
export const getRightDimensionValue = (value: string, field?: Field): string | number => {
  const dimension: string | number = value;
  if (typeof value === 'number') return value;
  // Non-computed fields all have string to cv conversion methods.
  // lookup can be converted by an entity field, which formula does not have, and lookup does not have for formula.
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
    console.error('parseFloat Failed');
    return value;
  }
  return value;
};

/**
 * Whether the information related to the current statistical word list is reasonable.
 */
export const checkMetrics = (metricsType: string, metricsField?: Field) => {
  if (metricsType === 'COUNT_RECORDS') return true;
  return Boolean(metricsField);
};

/**
 * Table data pre-processed by x-axis classification.
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
  const seriesIsPercent = seriesField?.type === FieldType.Percent || seriesField?.formatType?.type === 'percent';
  const isDateTime = checkDateTimeType(dimensionField);
  const res = records.map(record => {
    const shouldSplitDimensionValue = isSplitMultiValue && dimensionField?.basicValueType === BasicValueType.Array;
    const recordData: IOutputRecordData = {};
    if (metricsField) {
      const val = record.getCellValue(metricsField?.id);
      recordData.metrics = val ? val * scaleMetricsNum : val;
    }
    if (seriesField) {
      let val = record.getCellValue(seriesField.id);

      if (seriesIsPercent) {
        val *= 100;
      }
      recordData.series = val;
    }
    let dimensionValue = (isDateTime ? record._getCellValue(dimensionField.id)
      : record.getCellValueString(dimensionField.id)
    ) || t(Strings.null);
    dimensionValue = dimensionValue.toString();
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
 * Grouping, null values, date formatting.
 * @param {Object} data 
 * @property {IOutputRecordData[]} data.rows - Records of statistics.
 * @property {dimensionMetricsMap[]} data.dimensionMetricsMap - Dimensional fields for form statistics{key, value}.
 * @property {Field} data.dimensionField - Properties of the statistical dimension.
 * @property {string} data.metricsType - Type of statistical value (total/specified field).
 * @property {Field} data.metricsField - Properties of statistical values.
 * @property {Field} data.seriesFieldInstance
 * @property {Boolean} data.isCountNullValue - Whether to count null values.
 * @property {Boolean} data.isFormatDatetime - Whether to format the date and time.
 * @property {String} data.datetimeFormatter - Date and time formatted format string.
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
  const transformDateStr2Number = checkDateTimeType(dimensionField);
  const shouldFormatDatetime = isFormatDatetime && datetimeFormatter;
  // Grouping Process - Group table data by categorical dimensions.
  if (seriesFieldInstance) {
    // Categorical dimensions [grouping dimensions] Statistical indicators.
    const groupData = groupBy(rows, row => {
      return (
        JSON.stringify([
          groupByDimensionValue({
            dimension: row.dimension,
            shouldFormatDatetime,
            datetimeFormatter,
            toNumber: transformDateStr2Number,
          }) || t(Strings.null),
          row.series || t(Strings.null)
        ])
      );
    });
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
    // Data under ungrouped, aggregated by x-axis dimension.
    const groupRows = groupBy(rows, row => {
      return groupByDimensionValue({
        dimension: row.dimension,
        shouldFormatDatetime,
        datetimeFormatter,
        toNumber: transformDateStr2Number,
      });
    });
    // Delete when no empty dimension value is displayed.
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
 * Magical reference fields for handling stacked groups.
 * @param value Original value
 * @param field The final referenced field
 */
const getReferenceSeriesValue = (value, field: Field) => {
  const { type, property } = field;
  let deep = 2;
  if ([FieldType.SingleSelect, FieldType.CreatedBy, FieldType.LastModifiedBy].includes(type)) {
    deep = 1;
  }
  switch (type) {
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
};

/**
 * Return the sort function corresponding to the sort dimension field, grouping/stacking field.
 * @param key xField、yField、fldxxxxxx(Grouping/stacking fields of id)
 * @param field
 */
export const getSortFuncByField = (key: string, field?: Field, isAxis = true) => {
  if (!field) {
    return null;
  }
  const { type, property } = field;
  if (!isAxis) {
    // Handling sorting of stacked fields.
    // console.log(type, property);
    switch (type) {
      case FieldType.MagicLink:
        return (item) => {
          const value = item[key];
          if (isNull(value)) {
            return t(Strings.null);
          }
          return value.map((v) => v.title).join(',');
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
      case FieldType.Rating:
        return (item) => {
          return Number(item[key]);
        };
      default:
        return (item) => {
          const value = item[key];
          return typeof value === 'string' ? value.trim() : value;
        };
    }
  }
  // Handling sorting of axis dimensions - strings.
  switch (type) {
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
    case FieldType.Rating:
      return (item) => {
        return Number(item[key]);
      };
    case FieldType.MagicLookUp:
      const referenceField = property.entityField.field;
      return getSortFuncByField(key, referenceField);
    default:
      return (item) => item[key];
  }
};

/**
 * Obtain maximum precision from a set of numbers.
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
    // Sort by dimension, or sort by metrics.
    const axisType = axisItem[0];
    const axisName = axisType === 'dimension' ? dimensionMetricsMap.dimension.key : dimensionMetricsMap.metrics.key;
    const isDESC = sortType === 'DESC';
    const sortFuncs: any[] = [];

    switch (axisType) {
      case 'dimension':
        // Get the sort function for the classification dimension.
        sortFuncs.push(getSortFuncByField(dimensionMetricsMap.dimension.key, dimensionField));
        // Get the sort function for the secondary sort dimension if a sort/stack field exists.
        if (seriesField) {
          sortFuncs.push(getSortFuncByField(seriesField.id, seriesField, false));
        }
        break;
      case 'metrics':
        // Grouping stacking fields exist.
        if (seriesField) {
          // Grouping by Category Dimension.
          const groupData = groupBy(data, dimensionMetricsMap.dimension.key);
          // Sorted by the total value of statistical indicators in each group.
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
    metricsField?: Field;
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
    metricsField,
    isPercent = false,
  } = props;

  const metricsFieldPrecision = getNumberBaseFieldPrecision(metricsField);

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

    // x-axis sorting
    const commonSortFunc = getSortFuncByField(mainAxisName, dimensionField);
    if (sortByXaxis) {
      newData = sortBy(newData, [commonSortFunc], false);
    } else {
      // y-axis sorting
      // Grouping by Category Dimension
      const groupData = groupBy(newData, mainAxisName);
      // Sorted by the total value of statistical indicators in each group.
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

    // Percentage processing
    if (isPercent) {
      const sums: number[] = [];
      // Summation
      for (let i = 0; i < newData.length; i++) {
        const sortList = newData[i];
        for (let j = 0; j < sortList.length; j++) {
          if (sums[i] == null) {
            sums[i] = 0;
          }
          sums[i] += sortList[j][yKey];
        }
      }
      // Percentage processing
      for (let i = 0; i < newData.length; i++) {
        const sortList = newData[i];
        for (let j = 0; j < sortList.length; j++) {
          const val = sortList[j][yKey];
          sortList[j][yKey] = safeParseNumberOrText(val / sums[i] * 100, 2);
        }
      }
    }

    if (seriesField) {
      // Direct reading of seriesField properties is problematic,
      // performance is too low, each chained call to a seriesField property takes between 20 - 40 milliseconds.
      let paramField = seriesField;
      if (seriesField.type === FieldType.MagicLookUp) {
        paramField = paramField.property.entityField.field;
      }
      const property = paramField.property;
      const type = paramField.type;

      // const start = Date.now();
      const seriesArr: { sortKey: string; series: number[][] }[] = [];
      const record = {};
      let max = 0;
      for (let i = 0; i < newData.length; i++) {
        const list = newData[i];
        for (let j = 0; j < list.length; j++) {
          const item = list[j];
          const mainAxisIndex = axisNames.findIndex((v) => v === item[mainAxisName]);
          let coordinateSaveIndex = mainAxisIndex;
          // Query whether the corresponding spindle item exists, and if not, add it.
          if (mainAxisIndex < 0) {
            coordinateSaveIndex = axisNames.length;
            axisNames.push(item[mainAxisName]);
          }
          if (record[coordinateSaveIndex]) {
            record[coordinateSaveIndex] += 1;
          } else {
            record[coordinateSaveIndex] = 1;
          }
          max = Math.max(max, record[coordinateSaveIndex]);
          // const start = Date.now();
          const seriesValue = getValueByType(item[seriesField.id], { type, property });
          // console.log('cals series value need takes time ', Date.now() - start);
          const coordinate = isColumn ? [coordinateSaveIndex, item[yKey]] : [item[yKey], coordinateSaveIndex];
          const seriesItem = seriesArr.find((v) => v.sortKey === seriesValue);
          legendNames.add(seriesValue.toString());
          if (seriesItem) {
            // Combining like items.
            const lastItem = seriesItem.series[seriesItem.series.length - 1];
            const coordinateIndex = isColumn ? 0 : 1;
            const valueIndex = isColumn ? 1 : 0;
            const isEqualPrev = coordinate[coordinateIndex] === lastItem[coordinateIndex];
            if (isEqualPrev) {
              lastItem[valueIndex] = parseFloat(safeParseNumberOrText(lastItem[valueIndex] + coordinate[valueIndex], metricsFieldPrecision));
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
        // Should be sorted by value?
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
      // Sorting the tags.
      const shouldReplaceSymbol = [FieldType.Percent, FieldType.Currency, FieldType.Number].includes(type);
      let fieldSymbol = property?.symbol || (property?.format?.format?.symbol) || '';
      if (type === FieldType.Percent) {
        fieldSymbol = '%';
      }
      const sortedLegendNames = [...legendNames].sort((a, b) => {
        if (shouldReplaceSymbol) {
          return Number(a.replace(fieldSymbol, '').trim()) -
                        Number(b.replace(fieldSymbol, '').trim());
        }
        return a.trim().localeCompare(b.trim());
      }).slice(0, maxRenderNum);

      return {
        axisNames: [...axisNames].slice(0, maxRenderNum),
        legendNames: sortedLegendNames,
        sortedSeries: result.slice(0, maxRenderNum),
        max,
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
    sortedSeries: newData.slice(0, maxRenderNum),
    max: 0,
  };
};
