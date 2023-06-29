import React, { memo, useEffect, useRef, useState } from 'react';
import { lightColors, darkColors } from '@apitable/components';
// import { useViewport } from '@apitable/widget-sdk';
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
// Automatic label layout, global transition animation and other features.
import { LabelLayout, UniversalTransition } from 'echarts/features';
// Introduce the Canvas renderer, note that introducing the CanvasRenderer or SVGRenderer is a required step.
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
    // Determine whether the form configuration has been changed, inconsistent need to clear the last drawing.
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
    // Register required components.
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
