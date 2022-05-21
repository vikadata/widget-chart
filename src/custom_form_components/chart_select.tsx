import { Select, Tooltip } from '@vikadata/components';
import {
  ChartBarNormalFilled,
  ChartBarPercentFilled,
  ChartBarStackFilled,
  ChartColumnNormalFilled,
  ChartColumnPercentFilled,
  ChartColumnStackFilled,
  ChartDountFilled,
  ChartLineNormalFilled,
  // ChartLinePercentFilled,
  ChartLineStackFilled,
  ChartPieFilled,
  ChartScatterplotNormalFilled
} from '@vikadata/icons';
import { Strings, t } from '../i18n';

import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import { CHART_TYPES } from '../const';
import { FormChatType } from '../model/interface';

const ChartSelectWrapper = styled.div`
  box-shadow: 0px 8px 24px 0px rgba(38,38,38,0.16);
  width: 276px;
  height: 400px;
  overflow: scroll;
  padding: 24px;
  border-radius: 4px;
`;
// overflow: hidden; 会影响滚动，圆角被遮蔽的问题还是要从 select rc 入手 @sujian

const ChartIconWrapper = styled.div<{ isActive: boolean }>`
  border-radius: 4px;
  width: 56px;
  height: 56px;
  cursor: pointer;
  border: 1px solid ${props => props.isActive ? '#7B67EE' : '#F0F0F6'};
  &:first-child {
    margin-left: 0!important;
  }
`;

const ChartGroupWrapper = styled.div`
  display: flex;
  justify-content: start;
  margin-top: 8px;
  margin-bottom: 24px;
  &> ${ChartIconWrapper} {
    margin-left: 24px;
  }
`;

export const ChartSelectBase = ({
  onChange,
  defaultValue,
}: {
  defaultValue: any,
  onChange?: (value: any) => void;
}) => {
  const [value, setValue] = useState(defaultValue || FormChatType.Column);
  const handleIconClick = (value) => {
    setValue(value);
    onChange && onChange(value);
  };

  const chartList = [
    {
      title: t(Strings.echarts_column_chart), // '柱状图',
      icons: [
        // {
        //   name: t(Strings.column_chart), // '柱状图',
        //   id: FormChatType.Column,
        //   Icon: ChartColumnNormalFilled,
        // },
        // {
        //   name: t(Strings.stacked_column_chart), // '堆叠柱状图',
        //   id: FormChatType.StackColumn,
        //   Icon: ChartColumnStackFilled,

        // },
        // {
        //   name: t(Strings.percent_stacked_column_chart), // '百分比堆叠柱状图',
        //   id: FormChatType.PercentStackColumn,
        //   Icon: ChartColumnPercentFilled,
        // },

        {
          name: t(Strings.echarts_column_chart), // '柱状图',
          id: FormChatType.EchartsColumn,
          Icon: ChartColumnNormalFilled,
        },
        {
          name: t(Strings.echarts_stack_column_chart), // '堆叠柱状图',
          id: FormChatType.EchartsStackColumn,
          Icon: ChartColumnStackFilled,

        },
        {
          name: t(Strings.echarts_percent_column_chart), // '百分比堆叠柱状图',
          id: FormChatType.EchartsPercentColumn,
          Icon: ChartColumnPercentFilled,
        },
      ],
    },
    {
      title: t(Strings.echarts_bar_chart), // '条形图',
      icons: [
        // {
        //   name: t(Strings.bar_chart), // '条形图',
        //   id: FormChatType.Bar,
        //   Icon: ChartBarNormalFilled,
        // },
        // {
        //   name: t(Strings.stacked_bar_chart), // '堆叠条形图',
        //   id: FormChatType.StackBar,
        //   Icon: ChartBarStackFilled,
        // },
        // {
        //   name: t(Strings.percent_stacked_bar_chart), //'百分比堆叠条形图',
        //   id: FormChatType.PercentStackBar,
        //   Icon: ChartBarPercentFilled,
        // },
        {
          name: t(Strings.echarts_bar_chart), // '条形图',
          id: FormChatType.EchartsBar,
          Icon: ChartBarNormalFilled,
        },
        {
          name: t(Strings.echarts_stack_bar_chart), // '堆叠条形图',
          id: FormChatType.EchartsStackBar,
          Icon: ChartBarStackFilled,
        },
        {
          name: t(Strings.echarts_percent_bar_chart), //'百分比堆叠条形图',
          id: FormChatType.EchartsPercentStackBar,
          Icon: ChartBarPercentFilled,
        },
      ],
    },
    {
      title: t(Strings.echarts_pie_chart), // '饼状图',
      icons: [
        // {
        //   name: t(Strings.pie_chart), // '饼状图',
        //   id: FormChatType.Pie,
        //   Icon: ChartPieFilled,
        // },
        // {
        //   name: t(Strings.donut_chart), // '环状图',
        //   id: FormChatType.Donut,
        //   Icon: ChartDountFilled,
        // },
        {
          name: t(Strings.echarts_pie_chart), // '柱状图',
          id: FormChatType.EchartsPie,
          Icon: ChartPieFilled,
        },
        {
          name: t(Strings.echarts_donut_chart), // '柱状图',
          id: FormChatType.EchartsDonut,
          Icon: ChartDountFilled,
        },
      ],
    },
    {
      title: t(Strings.echarts_line_chart), // '折线图',
      icons: [
        // {
        //   name: t(Strings.line_chart), // '折线图',
        //   id: FormChatType.Line,
        //   Icon: ChartLineNormalFilled,
        // },
        // {
        //   name: t(Strings.stacked_line_chart), // '堆叠折线图',
        //   id: FormChatType.StackLine,
        //   Icon: ChartLineStackFilled,
        // },
        {
          name: t(Strings.echarts_line_chart), // '折线图',
          id: FormChatType.EchartsLine,
          Icon: ChartLineNormalFilled,
        },
        {
          name: t(Strings.echarts_stack_line_chart), // '堆叠折线图',
          id: FormChatType.EchartsStackLine,
          Icon: ChartLineStackFilled,
        },
        // {
        //   name: '百分比折线图',
        //   id: FormChatType.PercentStackLine,
        //   Icon: ChartLinePercentFilled,
        // },
      ],
    },
    {
      title: t(Strings.echarts_scatter_chart), // '散点图',
      icons: [
        // {
        //   name: t(Strings.scatter_chart), // '散点图',
        //   id: FormChatType.Scatter,
        //   Icon: ChartScatterplotNormalFilled,
        // },
        {
          name: t(Strings.echarts_scatter_chart), // 'echarts 散点图',
          id: FormChatType.EchartsScatter,
          Icon: ChartScatterplotNormalFilled,
        },
      ],
    },
  ];

  return <ChartSelectWrapper >
    {
      chartList.map(chartTypeObj => {
        return (
          <Fragment key={chartTypeObj.title}>
            <div>
              {chartTypeObj.title}
            </div>
            <ChartGroupWrapper>
              {
                chartTypeObj.icons.map(chart => {
                  return (
                    <Tooltip content={chart.name} key={chart.id}>
                      {/* FIXME: tooltip 会覆盖子元素的 onclick 事件，先把 onClick 放在内部。等 @dongdong 修复 */}
                      <ChartIconWrapper isActive={value == chart.id} key={chart.id}>
                        <chart.Icon size={56} onClick={() => handleIconClick(chart.id)} />
                      </ChartIconWrapper>
                    </Tooltip>
                  );
                })
              }
            </ChartGroupWrapper>
          </Fragment>
        );
      })
    }

  </ChartSelectWrapper>;
};

type ChartSelectProps = {
  value: FormChatType,
  onChange: (value: any) => void;
};

export const ChartSelect = ({ value, onChange }: ChartSelectProps) => {
  const options = CHART_TYPES.map(item => ({ value: item.id, label: item.name }));

  return (
    <Select
      placeholder={t(Strings.pick_one_option)}
      options={options}
      value={value}
      onSelected={(option) => {
        onChange(option.value as any);
      }}
      dropdownMatchSelectWidth
      triggerStyle={{ width: '100%' }}
      dropdownRender={<ChartSelectBase onChange={onChange} defaultValue={value} />}
      noDataTip={t(Strings.empty_data)}
    />
  );
};
