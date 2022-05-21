import { ColumnChart, BarChart, LineChart, PieChart, ScatterChart } from './model';
import { FormChatType, StackType } from './model/interface';
import { t } from '@vikadata/widget-sdk';
import { Strings } from './i18n';

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
  {
    name: t(Strings.column_chart), // '柱状图',
    id: FormChatType.Column,
    class: ColumnChart,
    stackType: StackType.None,
  },
  {
    name: t(Strings.stacked_column_chart), // '堆叠柱状图',
    id: FormChatType.StackColumn,
    class: ColumnChart,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.percent_column_chart), // '百分比堆叠柱状图',
    id: FormChatType.PercentStackColumn,
    class: ColumnChart,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.bar_chart), // '条形图',
    id: FormChatType.Bar,
    class: BarChart,
    stackType: StackType.None,
  },
  {
    name: t(Strings.stacked_bar_chart),// '堆叠条形图',
    id: FormChatType.StackBar,
    class: BarChart,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.percent_bar_chart), // '百分比堆叠条形图',
    id: FormChatType.PercentStackBar,
    class: BarChart,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.line_chart), // '折线图',
    id: FormChatType.Line,
    class: LineChart,
    stackType: StackType.None,
  },
  {
    name: t(Strings.stacked_line_chart), // '堆叠折线图',
    id: FormChatType.StackLine,
    class: LineChart,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.percent_line_chart), // '百分比折线图',
    id: FormChatType.PercentStackLine,
    class: LineChart,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.pie_chart), // '饼状图',
    id: FormChatType.Pie,
    class: PieChart,
    stackType: StackType.None,
  },
  {
    name: t(Strings.donut_chart), // '环状图',
    id: FormChatType.Donut,
    class: PieChart,
    stackType: StackType.Stack, // 这里的 Stack 用于区分环状图。
  },
  {
    name: t(Strings.scatter_chart), // '散点图',
    id: FormChatType.Scatter,
    class: ScatterChart,
    stackType: StackType.None,
  },
];

export const SELECT_OPEN_SEARCH_COUNT = 7;