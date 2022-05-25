import { /* ColumnChart, BarChart, LineChart, PieChart, ScatterChart, */
  EchartsPie, EchartsLine, EchartsColumn, EchartsBar, EchartsScatter} from './model';
import { FormChatType, StackType } from './model/interface';
import { Strings, t } from './i18n';

// 指标统计类型
export const METRICS_TYPES = ['COUNT_RECORDS', 'AGGREGATION_BY_FIELD'];
export const METRICS_TYPES_NAMES = [t(Strings.count_records), t(Strings.select_y_axis_field)];
export const AGGREGATION_TYPES = ['SUM', 'MIN', 'MAX', 'AVERAGE'];
export const AGGREGATION_TYPES_NAMES = [
  t(Strings.y_axis_field_sum),
  t(Strings.y_axis_field_min),
  t(Strings.y_axis_field_max),
  t(Strings.y_axis_field_average),
];

// 日期格式化类型
export const DATETIME_FORMATTER_TYPES = [
  'YYYY-MM-DD',
  'YYYY-[W]ww',
  'YYYY-MM',
  'YYYY-[Q]Q',
  'YYYY',
];
export const DATETIME_FORMATTER_TYPES_NAMES = [
  t(Strings.year_month_day_hyphen), // '年-月-日',
  t(Strings.year_week_hyphen), // '年-周',
  t(Strings.label_format_year_and_month_split_by_dash), // '年-月',
  t(Strings.year_season_hyphen), // '年-季度',
  t(Strings.year), // '年',
];

// 图表类型
export const CHART_TYPES = [
  // {
  //   name: t(Strings.column_chart), // '柱状图',
  //   id: FormChatType.Column,
  //   class: ColumnChart,
  //   stackType: StackType.None,
  // },
  // {
  //   name: t(Strings.stacked_column_chart), // '堆叠柱状图',
  //   id: FormChatType.StackColumn,
  //   class: ColumnChart,
  //   stackType: StackType.Stack,
  // },
  // {
  //   name: t(Strings.percent_column_chart), // '百分比堆叠柱状图',
  //   id: FormChatType.PercentStackColumn,
  //   class: ColumnChart,
  //   stackType: StackType.Percent,
  // },
  // {
  //   name: t(Strings.bar_chart), // '条形图',
  //   id: FormChatType.Bar,
  //   class: BarChart,
  //   stackType: StackType.None,
  // },
  // {
  //   name: t(Strings.stacked_bar_chart),// '堆叠条形图',
  //   id: FormChatType.StackBar,
  //   class: BarChart,
  //   stackType: StackType.Stack,
  // },
  // {
  //   name: t(Strings.percent_bar_chart), // '百分比堆叠条形图',
  //   id: FormChatType.PercentStackBar,
  //   class: BarChart,
  //   stackType: StackType.Percent,
  // },
  // {
  //   name: t(Strings.line_chart), // '折线图',
  //   id: FormChatType.Line,
  //   class: LineChart,
  //   stackType: StackType.None,
  // },
  // {
  //   name: t(Strings.stacked_line_chart), // '堆叠折线图',
  //   id: FormChatType.StackLine,
  //   class: LineChart,
  //   stackType: StackType.Stack,
  // },
  // {
  //   name: t(Strings.percent_line_chart), // '百分比折线图',
  //   id: FormChatType.PercentStackLine,
  //   class: LineChart,
  //   stackType: StackType.Percent,
  // },
  // {
  //   name: t(Strings.pie_chart), // '饼状图',
  //   id: FormChatType.Pie,
  //   class: PieChart,
  //   stackType: StackType.None,
  // },
  // {
  //   name: t(Strings.donut_chart), // '环状图',
  //   id: FormChatType.Donut,
  //   class: PieChart,
  //   stackType: StackType.Stack, // 这里的 Stack 用于区分环状图。
  // },
  // {
  //   name: t(Strings.scatter_chart), // '散点图',
  //   id: FormChatType.Scatter,
  //   class: ScatterChart,
  //   stackType: StackType.None,
  // },
  {
    name: t(Strings.echarts_pie_chart), // 'echarts 饼状图',
    id: FormChatType.EchartsPie,
    class: EchartsPie,
    stackType: StackType.None,
  },
  {
    name: t(Strings.echarts_donut_chart), // 'echarts 饼状图',
    id: FormChatType.EchartsDonut,
    class: EchartsPie,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.echarts_line_chart), // 'echarts 折线图',
    id: FormChatType.EchartsLine,
    class: EchartsLine,
    stackType: StackType.None,
  },
  {
    name: t(Strings.echarts_stack_line_chart), // 'echarts 堆叠折线图',
    id: FormChatType.EchartsStackLine,
    class: EchartsLine,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.echarts_column_chart), // 'echarts 柱状图',
    id: FormChatType.EchartsColumn,
    class: EchartsColumn,
    stackType: StackType.None,
  },
  {
    name: t(Strings.echarts_stack_column_chart), // 'echarts 堆叠柱状图',
    id: FormChatType.EchartsStackColumn,
    class: EchartsColumn,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.echarts_percent_column_chart), // 'echarts 百分比柱状图',
    id: FormChatType.EchartsPercentColumn,
    class: EchartsColumn,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.echarts_bar_chart), // 'echarts 柱状图',
    id: FormChatType.EchartsBar,
    class: EchartsBar,
    stackType: StackType.None,
  },
  {
    name: t(Strings.echarts_stack_bar_chart), // 'echarts 堆叠柱状图',
    id: FormChatType.EchartsStackBar,
    class: EchartsBar,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.echarts_percent_bar_chart), // 'echarts 百分比柱状图',
    id: FormChatType.EchartsPercentStackBar,
    class: EchartsBar,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.echarts_scatter_chart), // 'echarts 饼状图',
    id: FormChatType.EchartsScatter,
    class: EchartsScatter,
    stackType: StackType.None,
  },
];

export const SELECT_OPEN_SEARCH_COUNT = 7;