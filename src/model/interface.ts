export enum ChartType {
  Column = 'EchartsPie', // 柱状图
  Line = 'EchartsColumn', // 折线图
  Bar = 'EchartsBar', // 条形图
  Pie = 'EchartsLine', // 饼状图
  Scatter = 'EchartsScatter', // 散点图

  EchartsPie = 'EchartsPie', // echarts 饼图
  EchartsColumn = 'EchartsColumn', // echarts 柱状图
  EchartsBar = 'EchartsBar', // echarts 条形图
  EchartsLine = 'EchartsLine', // echarts 折线图
  EchartsScatter = 'EchartsScatter', // echarts 散点图
}

export enum FormChatType {
  Line = 'EchartsLine', // 折线图
  StackLine = 'EchartsStackLine', // 堆叠折线图
  PercentStackLine = 'EchartsPercentStackLine',
  Column = 'EchartsColumn', // 柱状图
  StackColumn = 'EchartsStackColumn', // 堆叠柱状图
  PercentStackColumn = 'EchartsPercentColumn', // 百分比堆叠柱状图
  Bar = 'EchartsBar', // 条形图
  StackBar = 'EchartsStackBar', // 堆叠条形图
  PercentStackBar = 'EchartsPercentStackBar', // 百分比堆叠条形图
  Pie = 'EchartsPie', // 饼状图
  Donut = 'EchartsDonut', // 环状图图
  Scatter = 'EchartsScatter', // 散点图

  // echarts
  EchartsPie = 'EchartsPie', // 饼图
  EchartsDonut = 'EchartsDonut', // 环形饼图
  EchartsLine = 'EchartsLine', // 折线图
  EchartsStackLine = 'EchartsStackLine', // 堆叠折线图
  EchartsColumn = 'EchartsColumn', // 柱状图
  EchartsStackColumn = 'EchartsStackColumn', // 堆叠柱状图
  EchartsPercentColumn = 'EchartsPercentColumn', // 百分比堆叠柱状图
  EchartsBar = 'EchartsBar', // 条形图
  EchartsStackBar = 'EchartsStackBar', // 堆叠条形图
  EchartsPercentStackBar = 'EchartsPercentStackBar', // 百分比堆叠条形图
  EchartsScatter = 'EchartsScatter', // 散点图
}

export enum AggregationType {
  VALUE = 'VALUE',
  COUNT = 'COUNT',
  SUM = 'SUM',
  MIN = 'MIN',
  MAX = 'MAX',
  AVERAGE = 'AVERAGE',
}

export enum StackType {
  None = 'None', // 不堆叠
  Stack = 'Stack', // 正常堆叠
  Percent = 'Percent', // 百分比堆叠
}
export interface IXField {
  id: string;
  label: string;
}
export interface IYField {
  id: string;
  label: string;
  aggregationType: AggregationType;
}

export interface IDimensionMetricsMap {
  dimension: {
    title: string;
    key: string;
  },
  metrics: {
    title: string;
    key: string;
  },
}

export interface IFormProperties {
  [propsname: string]: {
    title: string;
    type: string;
    description?: string;
    enum?: string[];
  }
}

export interface IFormConfig {
  title: string;
  type: string;
  description?: string;
  properties: IFormProperties;
}
