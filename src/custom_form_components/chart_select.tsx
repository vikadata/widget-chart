import { DropdownSelect as Select, Tooltip } from '@apitable/components';
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
} from '@apitable/icons';
import { Strings, t } from '../i18n';

import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import { CHART_TYPES } from '../const';
import { FormChatType } from '../model/interface';

const ChartSelectWrapper = styled.div`
  box-shadow: 0px 8px 24px 0px rgba(38,38,38,0.16);
  width: 276px;
  height: 400px;
  overflow: auto;
  padding: 24px;
  border-radius: 4px;
`;

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
      title: t(Strings.echarts_column_chart), // 'Histogram',
      icons: [
        {
          name: t(Strings.echarts_column_chart), // 'normal',
          id: FormChatType.EchartsColumn,
          Icon: ChartColumnNormalFilled,
        },
        {
          name: t(Strings.echarts_stack_column_chart), // 'Stacked Bar Chart',
          id: FormChatType.EchartsStackColumn,
          Icon: ChartColumnStackFilled,

        },
        {
          name: t(Strings.echarts_percent_column_chart), // 'Percentage stacked bar chart',
          id: FormChatType.EchartsPercentColumn,
          Icon: ChartColumnPercentFilled,
        },
      ],
    },
    {
      title: t(Strings.echarts_bar_chart), // 'Bar Chart',
      icons: [
        {
          name: t(Strings.echarts_bar_chart), // 'Bar Chart',
          id: FormChatType.EchartsBar,
          Icon: ChartBarNormalFilled,
        },
        {
          name: t(Strings.echarts_stack_bar_chart), // 'Stacked Bars',
          id: FormChatType.EchartsStackBar,
          Icon: ChartBarStackFilled,
        },
        {
          name: t(Strings.echarts_percent_bar_chart), //'Percentage Stacked Bar Chart',
          id: FormChatType.EchartsPercentStackBar,
          Icon: ChartBarPercentFilled,
        },
      ],
    },
    {
      title: t(Strings.echarts_pie_chart), // 'Pie Chart',
      icons: [
        {
          name: t(Strings.echarts_pie_chart), // 'Pie Chart',
          id: FormChatType.EchartsPie,
          Icon: ChartPieFilled,
        },
        {
          name: t(Strings.echarts_donut_chart), // 'Donut Chart',
          id: FormChatType.EchartsDonut,
          Icon: ChartDountFilled,
        },
      ],
    },
    {
      title: t(Strings.echarts_line_chart), // 'Folding Line Chart',
      icons: [
        {
          name: t(Strings.echarts_line_chart), // 'Folding Line Chart',
          id: FormChatType.EchartsLine,
          Icon: ChartLineNormalFilled,
        },
        {
          name: t(Strings.echarts_stack_line_chart), // 'Stacked Line Chart',
          id: FormChatType.EchartsStackLine,
          Icon: ChartLineStackFilled,
        },
      ],
    },
    {
      title: t(Strings.echarts_scatter_chart), // 'Scatter Chart',
      icons: [
        {
          name: t(Strings.echarts_scatter_chart), // 'echarts Scatter Chart',
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
                      {/* FIXME: tooltip will override the onclick event of the child element, putting the onClick inside first */}
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
