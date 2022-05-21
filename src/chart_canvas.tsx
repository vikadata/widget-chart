import { Bar, Column, G2, Line, Pie, Scatter } from '@antv/g2plot';
import { ColumnOptions, LineOptions, PieOptions, ScatterOptions } from '@antv/g2plot/lib';
import { useUpdateEffect } from '@vikadata/components';
import React, { useCallback, useEffect, useRef } from 'react';
import { ChartType } from './model/interface';
import { WarningAlert } from './sc';
import { themesMap } from './theme';
import { t } from '@vikadata/widget-sdk';
import { Strings } from './i18n';

type ChartOptions = LineOptions | PieOptions | ColumnOptions | ScatterOptions;

interface IWidgetChartCanvas {
  chartType: ChartType;
  options: ChartOptions;
  isExpanded?: boolean;
  isPartOfData?: boolean;
}

const chartTypeMap = {
  [ChartType.Line]: Line,
  [ChartType.Column]: Column,
  [ChartType.Pie]: Pie,
  [ChartType.Scatter]: Scatter,
  [ChartType.Bar]: Bar,
};

Object.keys(themesMap).forEach(key => {
  G2.registerTheme(key, {
    ...themesMap[key],
    // styleSheet: {
    //   fontFamily: "BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';"
    // }
  });
});

export const WidgetChartCanvas: React.FC<IWidgetChartCanvas> = ({ chartType, options, isPartOfData, isExpanded }) => {
  const plotRef = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // 初始化渲染图表
  useEffect(() => {
    const PlotClass = chartTypeMap[chartType];
    if (PlotClass) {
      const plot = new PlotClass(chartContainerRef.current!, options as any);
      plot.render();
      plotRef.current = plot;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reRender = useCallback(() => {
    const PlotClass = chartTypeMap[chartType];
    if (plotRef.current) {
      plotRef.current.destroy();
    }
    if (PlotClass) {
      const nextPlot = new PlotClass(chartContainerRef.current!, options as any);
      nextPlot.render();
      plotRef.current = nextPlot;
    } else {
      throw Error(`Not Support ${chartType}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, options]);

  useUpdateEffect(() => {
    console.log('rerender');
    reRender();
    // 显示数据 tip，应该是 g2plot 的bug，update option 不会刷新，这里强制重新渲染。
  },
    [
      chartType,
      options.label,
      (options as any).innerRadius,
      (options as any).isGroup,
      (options as any).isStack,
      (options as any).isPercent,
    ]);

  // useWhyDidYouUpdate('Chart', { ...options });
  // 数据源变化或者图表配置变化。更新图表。
  useEffect(() => {
    if (plotRef.current) {
      plotRef.current.update(options);
    }
  }, [options]);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }} >
      {isPartOfData && isExpanded && <WarningAlert >{t(Strings.limit_chart_values)}</WarningAlert>}
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%', padding: isExpanded ? 24 : 8, overflow: 'hidden' }} />
    </div>
  );
};
