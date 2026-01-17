import React from 'react';
import { View, Text, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ChartDataPoint } from '../services/api';
import Svg, { Rect, Line as SvgLine } from 'react-native-svg';

interface CandlestickChartWrapperProps {
  data: ChartDataPoint[];
}

export default function CandlestickChartWrapper({ data }: CandlestickChartWrapperProps) {
  const { width } = Dimensions.get('window');

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>No data available</Text>
      </View>
    );
  }

  // Transform data for the line chart - close prices
  const prices = data.map(d => d.c);
  const labels = data.map(d => new Date(d.unixTime * 1000).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }));

  // Find min and max for y-axis labels
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const midPrice = (minPrice + maxPrice) / 2;

  // Format price for display
  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toFixed(10);
    if (price < 0.001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    return price.toFixed(4);
  };

  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={{
          labels: labels.filter((_, i) => i % Math.ceil(data.length / 6) === 0), // Show ~6 labels
          datasets: [
            {
              data: prices,
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        }}
        width={width - 32}
        height={220}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: 'transparent',
          backgroundGradientTo: 'transparent',
          decimalPlaces: 8,
          color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '0',
          },
        }}
        bezier
        style={styles.chart}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={false}
        withShadow={false}
      />

      {/* Y-axis price labels overlay */}
      <View style={styles.priceLabels}>
        <Text style={styles.priceLabel}>{formatPrice(maxPrice)}</Text>
        <Text style={styles.priceLabel}>{formatPrice(midPrice)}</Text>
        <Text style={styles.priceLabel}>{formatPrice(minPrice)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
  },
  chart: {
    borderRadius: 16,
  },
  priceLabels: {
    position: 'absolute',
    right: 0,
    top: 30,
    bottom: 30,
    justifyContent: 'space-between',
  },
  priceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontFamily: 'System',
  },
});
