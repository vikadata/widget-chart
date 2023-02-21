export enum ChartType {
  Column = 'Column',
  Line = 'Line',
  Bar = 'Bar',
  Pie = 'Pie',
  Scatter = 'Scatter',

  EchartsPie = 'EchartsPie',
  EchartsColumn = 'EchartsColumn',
  EchartsBar = 'EchartsBar',
  EchartsLine = 'EchartsLine',
  EchartsScatter = 'EchartsScatter',
}

export enum FormChatType {
  Line = 'Line',
  StackLine = 'StackLine',
  PercentStackLine = 'PercentStackLine',
  Column = 'Column',
  StackColumn = 'StackColumn',
  PercentStackColumn = 'PercentStackColumn',
  Bar = 'Bar',
  StackBar = 'StackBar',
  PercentStackBar = 'PercentStackBar',
  Pie = 'Pie',
  Donut = 'Donut',
  Scatter = 'Scatter',

  // echarts
  EchartsPie = 'EchartsPie',
  EchartsDonut = 'EchartsDonut',
  EchartsLine = 'EchartsLine',
  EchartsStackLine = 'EchartsStackLine',
  EchartsColumn = 'EchartsColumn',
  EchartsStackColumn = 'EchartsStackColumn',
  EchartsPercentColumn = 'EchartsPercentColumn',
  EchartsBar = 'EchartsBar',
  EchartsStackBar = 'EchartsStackBar',
  EchartsPercentStackBar = 'EchartsPercentStackBar',
  EchartsScatter = 'EchartsScatter',
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
  None = 'None',
  Stack = 'Stack',
  Percent = 'Percent',
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
