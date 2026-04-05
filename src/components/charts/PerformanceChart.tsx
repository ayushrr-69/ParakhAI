import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { chartData } from '@/constants/content';
import { theme } from '@/theme';
import { AnalysisRange } from '@/types/app';

type PerformanceChartProps = {
  type: AnalysisRange;
};

const chartConfig = {
  width: 308,
  height: 180,
  paddingLeft: 22,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 24,
  maxValue: 400,
  ticks: [400, 300, 200, 100],
};

const buildPath = (values: number[], width: number, height: number) => {
  if (!values.length) {
    return '';
  }

  const drawableWidth = width - chartConfig.paddingLeft - chartConfig.paddingRight;
  const drawableHeight = height - chartConfig.paddingTop - chartConfig.paddingBottom;
  const step = values.length > 1 ? drawableWidth / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = chartConfig.paddingLeft + step * index;
      const y = chartConfig.paddingTop + drawableHeight - (value / chartConfig.maxValue) * drawableHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

export function PerformanceChart({ type }: PerformanceChartProps) {
  if (type === 'yearly') {
    return (
      <View style={styles.yearlyState}>
        <Svg width={48} height={48} viewBox='0 0 48 48' fill='none'>
          <Circle cx={24} cy={24} r={20} stroke={theme.colors.nearBlack} strokeWidth={2.4} />
          <Path d='M17 17 31 31M31 17 17 31' stroke={theme.colors.nearBlack} strokeWidth={2.4} strokeLinecap='round' />
        </Svg>
        <AppText variant='bodyLarge' weight='medium' color={theme.colors.nearBlack} style={styles.yearlyLabel}>
          Yearly Trends Not Recognised Yet
        </AppText>
      </View>
    );
  }

  const series = chartData[type];
  const nationalPath = buildPath(series.map((point) => point.national), chartConfig.width, chartConfig.height);
  const athletePath = buildPath(series.map((point) => point.athlete), chartConfig.width, chartConfig.height);

  return (
    <View>
      <View style={styles.chartRow}>
        <View style={styles.yAxis}>
          {chartConfig.ticks.map((tick) => (
            <AppText key={tick} variant='bodySmall' color={theme.colors.nearBlack}>
              {tick}
            </AppText>
          ))}
        </View>
        <View>
          <Svg width={chartConfig.width} height={chartConfig.height}>
            {chartConfig.ticks.map((tick) => {
              const y = chartConfig.paddingTop + ((chartConfig.maxValue - tick) / chartConfig.maxValue) * (chartConfig.height - chartConfig.paddingTop - chartConfig.paddingBottom);
              return <Line key={tick} x1={chartConfig.paddingLeft} y1={y} x2={chartConfig.width - chartConfig.paddingRight} y2={y} stroke={theme.colors.chartGrid} strokeWidth={1} />;
            })}
            <Path d={nationalPath} stroke={theme.colors.accentOrange} strokeWidth={3} fill='none' strokeLinecap='round' strokeLinejoin='round' />
            <Path d={athletePath} stroke={theme.colors.nearBlack} strokeWidth={3} fill='none' strokeLinecap='round' strokeLinejoin='round' />
          </Svg>
          <View style={styles.xAxis}>
            {series.map((point) => (
              <AppText key={point.label} variant='bodySmall' color={theme.colors.nearBlack}>
                {point.label}
              </AppText>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.accentOrange }]} />
          <AppText variant='bodySmall' color={theme.colors.nearBlack}>
            National Athlete
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.nearBlack }]} />
          <AppText variant='bodySmall' color={theme.colors.nearBlack}>
            Your Performance
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxis: {
    height: chartConfig.height - chartConfig.paddingBottom,
    justifyContent: 'space-between',
    paddingTop: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: chartConfig.paddingLeft,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radii.full,
  },
  yearlyState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  yearlyLabel: {
    textAlign: 'center',
  },
});
