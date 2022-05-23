import React, { memo, useEffect, useRef, useState } from 'react';
import { lightColors, darkColors } from '@vikadata/components';
// import { useViewport } from '@vikadata/widget-sdk';
import * as echarts from 'echarts/core';
import { EChartsOption } from 'echarts';
import { BarChart, PieChart, LineChart, ScatterChart } from 'echarts/charts';
import { ChartType } from './model/interface';
import { WarningAlert } from './sc';
import { themesMap } from './theme';
import { Strings, t } from './i18n';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  // DataZoomComponent,
} from 'echarts/components';
// 标签自动布局，全局过渡动画等特性
import { LabelLayout, UniversalTransition } from 'echarts/features';
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import { CanvasRenderer } from 'echarts/renderers';
import { listenDOMSize } from './utils';
import { EchartsBase } from 'model/echarts_base';

interface IWidgetChartCanvas {
  chartInstance: EchartsBase,
  chartType: ChartType;
  options: EChartsOption;
  isExpanded?: boolean;
  isPartOfData?: boolean;
  theme: string;
  formRefreshFlag: boolean;
  formData: any;
}

Object.keys(themesMap).forEach(key => {
  const theme = themesMap[key];
  echarts.registerTheme(key, {
    color: theme.colors20,
  });
});

const WidgetChart: React.FC<IWidgetChartCanvas> = ({
  chartType, chartInstance, options, isPartOfData, isExpanded, theme, formRefreshFlag, formData
}) => {
  const [clear, setClear] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { addListen, removeListen } = listenDOMSize(chartContainerRef);

  useEffect(() => {
    if (chartContainerRef.current) {
      echarts.dispose(chartContainerRef.current);
    }
  }, [options, formData, chartContainerRef.current]);

  const renderEcharts = React.useCallback(({ width, height }) => {
    // 判断表单配置是否已经更改，不一致需要清除上一次的绘制
    if (clear !== formRefreshFlag) {
      echarts.dispose(chartContainerRef.current!);
      setClear(formRefreshFlag);
    }
    const myChart = echarts.init(chartContainerRef.current!, theme);
    const mergeOptions = chartInstance.getMergeOption(
      { chartInstance, options: { ...options }, lightColors, darkColors, width, height }
    );

    myChart.setOption(mergeOptions);
    myChart.resize();
  }, [options, formData, theme, chartInstance.stackType, chartType, formRefreshFlag, clear]);

  useEffect(() => {
    // 注册必须的组件
    echarts.use([
      TitleComponent,
      TooltipComponent,
      GridComponent,
      DatasetComponent,
      TransformComponent,
      LegendComponent,
      // DataZoomComponent,
      BarChart,
      PieChart,
      LineChart,
      ScatterChart,
      LabelLayout,
      UniversalTransition,
      CanvasRenderer
    ]);
  }, []);

  useEffect(() => {
    if (chartContainerRef.current) {
      addListen(renderEcharts);
    }
    return removeListen;
  }, [chartContainerRef.current, clear, formData, chartInstance.stackType, chartType, options, theme]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }} >
      {isPartOfData && isExpanded && <WarningAlert >{t(Strings.limit_chart_values)}</WarningAlert>}
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%', padding: isExpanded ? 24 : 8, overflow: 'hidden' }} />
    </div>
  );
};

export const WidgetChartCanvas = memo(WidgetChart);
