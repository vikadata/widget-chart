const isString = (params) => typeof params === 'string';
const isNumber = (params) => typeof params === 'number';
const isFunction = (params) => typeof params === 'function';
const isObject = (params) => typeof params === 'object' && !Array.isArray(params);
const isArray = (params) => Array.isArray(params);

let lang = 'zh';

interface IInnerSortArrayItem {
  index: number;
  source: string | number | object;
  value: string | number;
}

/**
 * Determine if it is a legal sorting object.
 * @param {any} condition 
 * @param {any} obj 
 */
const validSortObject = (condition, obj) => {
  if (isString(condition) && !isObject(obj)) {
    throw TypeError('object item must be object');
  }
  return true;
}

/**
 * Comparison Method.
 * @param {String | Number | Object} a
 * @param {String | Number | Object} b
 * @param {String} k Key - passed in when the comparison parameter is an object.
 */
const compare = (a, b, k = '') => {
  if (!isString(a) && !isNumber(a) && !isObject(a)) {
    throw TypeError('array item type only support string, number, Object');
  }
  if (isObject(a) && !k) {
    throw Error('object item of Array need key, like sortBy([{ name: "name" }, "name"])');
  }
  let _a = a, _b = b;
  if (isObject(a)) {
    _a = a[k];
    _b = b[k];
  }

  if (isString(_a)) {
    return _a.localeCompare(_b, lang);
  }
  return _a - _b;
}

/**
 * Grouping.
 * @param {Array} data
 * @param {String | Function} conditions 
 */
const compareToGroup = (data, condition) => {
  const tempArr: IInnerSortArrayItem[] = [];

  // Get the value to compare.
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let value = item; // Default is number, string.

    // Get a valid sort value.
    if (isString(condition) && validSortObject(condition, item)) {
      // k - v
      value = item[condition];
    } else if (isFunction(condition)) {
      // Get return value.
      const res = condition(item);
      // k - v
      if (validSortObject(res, item)) {
        value = res;
      }
    }

    tempArr.push({ index: i, source: item, value });
  }

  // Sort by
  tempArr.sort((a, b) => compare(a, b, 'value'));

  // Grouping
  const hashArr = new Map();
  for (let i = 0; i < tempArr.length; i++) {
    const item = tempArr[i];
    const k = item.value; // Identified as the id of the group.
    const res = hashArr.get(k);
    hashArr.set(k, res ? [...res, item.source] : [item.source]);
  }

  // Turning arrays
  return [...hashArr.values()];
}

/**
 * Deep traversal sorting.
 * @param {Array} params 
 * @param {Array} conditions 
 * @param {Number} index 
 * @returns 
 */
const dfs = (params, conditions, index) => {
  const isEndDfs = index === conditions.length - 1;

  if (!isArray(params[0])) {
    const res = compareToGroup(params, conditions[index]);
    if (isEndDfs) {
      return res;
    }
    return dfs(res, conditions, index + 1);
  }
  for (let i = 0; i < params.length; i++) {
    const res = compareToGroup(params[i], conditions[index]);
    params[i] = isEndDfs ? res : dfs(res, conditions, index + 1);
  }
  return params;
}

/**
 * Sort.
 * @param {Array} arr 
 * @param {String | String[] | Function | Function[]} conditions 
 */
export const sortBy = (arr, conditions, flat = true) => {
  if (!isArray(arr)) {
    return arr;
  }
  // No condition / or if condition is numeric, natural sorting.
  if (
    !conditions ||
    isNumber(conditions) ||
    (isArray(conditions) && conditions.findIndex(c => isNumber(c)) > -1)
  ) {
    // Non-numeric or string cannot be compared and an error is thrown directly.
    const firstItem = arr[0];
    if (!isNumber(firstItem) && !isString(firstItem)) {
      throw TypeError('array item type must be string or number if not have conditions');
    }
    return [...arr].sort(compare);
  }

  // The condition is a string.
  if (isString(conditions)) {
    return [...arr].sort((a, b) => compare(a, b, conditions));
  }

  // The condition is the function.
  if (isFunction(conditions)) {
    return [...arr].sort((a, b) => compare(conditions(a), conditions(b)));
  }

  // The condition is an object and throws an error directly.
  if (isObject(conditions)) {
    throw TypeError('conditions type cannot be object');
  }

  const result = dfs([...arr], conditions, 0);

  if (flat) {
    return result.flat(conditions.length);
  }
  return result;
}
