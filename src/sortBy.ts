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
 * 判断是否为合法排序对象
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
 * 比较方法
 * @param {String | Number | Object} a 第一个参数
 * @param {String | Number | Object} b 第二个参数
 * @param {String} k 键 - 比较参数为对象时传入
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
 * 分组
 * @param {Array} data
 * @param {String | Function} conditions 
 */
const compareToGroup = (data, condition) => {
  const tempArr: IInnerSortArrayItem[] = [];

  // 获取要比较的值
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let value = item; // 默认为数字，字符串

    // 获取有效的排序值
    if (isString(condition) && validSortObject(condition, item)) {
      // k - v
      value = item[condition];
    } else if (isFunction(condition)) {
      // 获取返回值
      const res = condition(item);
      // k - v
      if (validSortObject(res, item)) {
        value = res;
      }
    }

    tempArr.push({ index: i, source: item, value });
  }

  // 排序
  tempArr.sort((a, b) => compare(a, b, 'value'));

  // 分组
  const hashArr = new Map();
  for (let i = 0; i < tempArr.length; i++) {
    const item = tempArr[i];
    const k = item.value; // 作为分组的 id 标识
    const res = hashArr.get(k);
    hashArr.set(k, res ? [...res, item.source] : [item.source]);
  }

  // 转数组
  return [...hashArr.values()];
}

/**
 * 深度遍历排序
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
 * 排序
 * @param {Array} arr 
 * @param {String | String[] | Function | Function[]} conditions 
 */
export const sortBy = (arr, conditions, flat = true) => {
  if (!isArray(arr)) {
    return arr;
  }
  // 没有条件 / 或者条件为数字时，进行自然排序
  if (
    !conditions ||
    isNumber(conditions) ||
    (isArray(conditions) && conditions.findIndex(c => isNumber(c)) > -1)
  ) {
    // 非数字或者字符串无法比较，直接抛出错误
    const firstItem = arr[0];
    if (!isNumber(firstItem) && !isString(firstItem)) {
      throw TypeError('array item type must be string or number if not have conditions');
    }
    return [...arr].sort(compare);
  }

  // 条件为字符串
  if (isString(conditions)) {
    return [...arr].sort((a, b) => compare(a, b, conditions));
  }

  // 条件为函数
  if (isFunction(conditions)) {
    return [...arr].sort((a, b) => compare(conditions(a), conditions(b)));
  }

  // 条件为对象，直接抛出错误
  if (isObject(conditions)) {
    throw TypeError('conditions type cannot be object');
  }

  const result = dfs([...arr], conditions, 0);

  if (flat) {
    return result.flat(conditions.length);
  }
  return result;
}

// const options = [1, 2];

// const result = sortBy(
//   [
//     { name: '我', pinyin: 'wo', age: 12, level: 1, option: 3 },
//     { name: '你', pinyin: 'ni', age: 11, level: 2, option: 1 },
//     { name: '他', pinyin: 'ta', age: 10, level: 3, option: 1 },
//     { name: '我时谁', pinyin: 'woshishui', age: 1, level: 1, option: 3 },
//     { name: '他时', pinyin: 'tashi', age: 9, level: 2, option: 1 },
//     { name: '怎么', pinyin: 'zenme', age: 4, level: 3, option: 1 },
//     { name: '哈哈', pinyin: 'haha', age: 22, level: 1, option: 2 },
//     { name: '哦耶', pinyin: 'ohye', age: 17, level: 2, option: 1 },
//   ],
//   [(item) => options.findIndex((o) => o === item.option), (item) => item.level, (item) => item.age]
// );
// console.log(result);