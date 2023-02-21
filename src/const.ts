import { /* ColumnChart, BarChart, LineChart, PieChart, ScatterChart, */
  EchartsPie, EchartsLine, EchartsColumn, EchartsBar, EchartsScatter} from './model';
import { FormChatType, StackType } from './model/interface';
import { Strings, t } from './i18n';

// Type of Indicator Statistics.
export const METRICS_TYPES = ['COUNT_RECORDS', 'AGGREGATION_BY_FIELD'];
export const METRICS_TYPES_NAMES = [t(Strings.count_records), t(Strings.select_y_axis_field)];
export const AGGREGATION_TYPES = ['SUM', 'MIN', 'MAX', 'AVERAGE'];
export const AGGREGATION_TYPES_NAMES = [
  t(Strings.y_axis_field_sum),
  t(Strings.y_axis_field_min),
  t(Strings.y_axis_field_max),
  t(Strings.y_axis_field_average),
];

// Date formatting type.
export const DATETIME_FORMATTER_TYPES = [
  'YYYY-MM-DD',
  'YYYY-[W]ww',
  'YYYY-MM',
  'YYYY-[Q]Q',
  'YYYY',
];
export const DATETIME_FORMATTER_TYPES_NAMES = [
  t(Strings.year_month_day_hyphen), // 'Year-Month-Day',
  t(Strings.year_week_hyphen), // 'Year-Week',
  t(Strings.label_format_year_and_month_split_by_dash), // 'Year-Month',
  t(Strings.year_season_hyphen), // 'Year-Quarter',
  t(Strings.year), // 'Year',
];

// Chart Type
export const CHART_TYPES = [
  {
    name: t(Strings.column_chart), // 'Histogram',
    id: FormChatType.Column,
    class: EchartsColumn,
    stackType: StackType.None,
  },
  {
    name: t(Strings.stacked_column_chart), // 'Stacked Bar Chart',
    id: FormChatType.StackColumn,
    class: EchartsColumn,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.percent_column_chart), // 'Percentage stacked bar chart',
    id: FormChatType.PercentStackColumn,
    class: EchartsColumn,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.bar_chart), // 'Bar Chart',
    id: FormChatType.Bar,
    class: EchartsBar,
    stackType: StackType.None,
  },
  {
    name: t(Strings.stacked_bar_chart),// 'Stacked Bars',
    id: FormChatType.StackBar,
    class: EchartsBar,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.percent_bar_chart), // 'Percentage Stacked Bar Chart',
    id: FormChatType.PercentStackBar,
    class: EchartsBar,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.line_chart), // 'Folding Line Chart',
    id: FormChatType.Line,
    class: EchartsLine,
    stackType: StackType.None,
  },
  {
    name: t(Strings.stacked_line_chart), // 'Stacked Line Chart',
    id: FormChatType.StackLine,
    class: EchartsLine,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.percent_line_chart), // 'Percentage Line Chart',
    id: FormChatType.PercentStackLine,
    class: EchartsLine,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.pie_chart), // 'Pie Chart',
    id: FormChatType.Pie,
    class: EchartsPie,
    stackType: StackType.None,
  },
  {
    name: t(Strings.donut_chart), // 'Ring Chart',
    id: FormChatType.Donut,
    class: EchartsPie,
    stackType: StackType.Stack, // The Stack here is used to distinguish the ring diagram.
  },
  {
    name: t(Strings.scatter_chart), // 'Scatter Chart',
    id: FormChatType.Scatter,
    class: EchartsScatter,
    stackType: StackType.None,
  },

  {
    name: t(Strings.echarts_pie_chart), // 'echarts Pie Chart',
    id: FormChatType.EchartsPie,
    class: EchartsPie,
    stackType: StackType.None,
  },
  {
    name: t(Strings.echarts_donut_chart), // 'echarts Ring Chart',
    id: FormChatType.EchartsDonut,
    class: EchartsPie,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.echarts_line_chart), // 'echarts Folding Line Chart',
    id: FormChatType.EchartsLine,
    class: EchartsLine,
    stackType: StackType.None,
  },
  {
    name: t(Strings.echarts_stack_line_chart), // 'echarts Stacked Line Chart',
    id: FormChatType.EchartsStackLine,
    class: EchartsLine,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.echarts_column_chart), // 'echarts Histogram',
    id: FormChatType.EchartsColumn,
    class: EchartsColumn,
    stackType: StackType.None,
  },
  {
    name: t(Strings.echarts_stack_column_chart), // 'echarts Stacked Bar Chart',
    id: FormChatType.EchartsStackColumn,
    class: EchartsColumn,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.echarts_percent_column_chart), // 'echarts Percentage histogram',
    id: FormChatType.EchartsPercentColumn,
    class: EchartsColumn,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.echarts_bar_chart), // 'echarts Histogram',
    id: FormChatType.EchartsBar,
    class: EchartsBar,
    stackType: StackType.None,
  },
  {
    name: t(Strings.echarts_stack_bar_chart), // 'echarts Stacked Bar Chart',
    id: FormChatType.EchartsStackBar,
    class: EchartsBar,
    stackType: StackType.Stack,
  },
  {
    name: t(Strings.echarts_percent_bar_chart), // 'echarts Percentage histogram',
    id: FormChatType.EchartsPercentStackBar,
    class: EchartsBar,
    stackType: StackType.Percent,
  },
  {
    name: t(Strings.echarts_scatter_chart), // 'echarts Pie Chart',
    id: FormChatType.EchartsScatter,
    class: EchartsScatter,
    stackType: StackType.None,
  },
];

export const SELECT_OPEN_SEARCH_COUNT = 7;