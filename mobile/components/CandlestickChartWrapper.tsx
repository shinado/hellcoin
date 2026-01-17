import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { CandlestickChart } from 'react-native-wagmi-charts';
import { ChartDataPoint } from '../services/api';

interface CandlestickChartWrapperProps {
  data: ChartDataPoint[];
}

export default function CandlestickChartWrapper({ data }: CandlestickChartWrapperProps) {
  return (
    <View style={{ flex: 1 }}>
      <CandlestickChart
        data={data.map(d => ({
          timestamp: d.unixTime * 1000,
          open: d.o,
          high: d.h,
          low: d.l,
          close: d.c
        }))}
        style={{ flex: 1 }}
      >
        <CandlestickChart.Candles />
        <CandlestickChart.Crosshair>
          <CandlestickChart.Crosshair.Line />
          <CandlestickChart.Crosshair.Label />
        </CandlestickChart.Crosshair>
        <CandlestickChart.DatetimeLabel
          style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 10,
          }}
          format={(date) => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
      </CandlestickChart>
    </View>
  );
}
