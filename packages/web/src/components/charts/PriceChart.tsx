"use client";

import React, { useEffect, useRef } from 'react';
import { IChartApi, createChart, ColorType, ISeriesApi } from 'lightweight-charts';

export const PriceChart = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#080C14' },
        textColor: '#8892A4',
      },
      grid: {
        vertLines: { color: '#111827' },
        horzLines: { color: '#111827' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        borderColor: '#111827',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const lineSeries = chart.addLineSeries({
      color: '#1E6FFF',
      lineWidth: 2,
    });

    // Initial dummy data
    const data = [
      { time: '2026-04-24 10:00', value: 2980.5 },
      { time: '2026-04-24 10:05', value: 2985.2 },
      { time: '2026-04-24 10:10', value: 2982.1 },
      { time: '2026-04-24 10:15', value: 2988.7 },
      { time: '2026-04-24 10:20', value: 2992.3 },
      { time: '2026-04-24 10:25', value: 2989.4 },
      { time: '2026-04-24 10:30', value: 2995.0 },
    ].map(d => ({ ...d, time: new Date(d.time).getTime() / 1000 }));

    lineSeries.setData(data);
    
    chartRef.current = chart;
    lineSeriesRef.current = lineSeries;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="w-full h-full glass-panel p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">WETH / USDC</h2>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-text-tertiary">PRICE: <span className="text-text-primary">$2,995.00</span></span>
          <span className="text-status-success">+1.24%</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-1 w-full" />
    </div>
  );
};
