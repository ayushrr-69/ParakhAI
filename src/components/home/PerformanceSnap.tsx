import React, { useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Svg, Path, Circle, Line } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';

interface PerformanceSnapProps {
  score: number;
  trend: number;
  history: number[];
  teamAverage?: number;
  loading?: boolean;
}

export function PerformanceSnap({ score, trend, history, teamAverage, loading }: PerformanceSnapProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const SPARK_WIDTH_PER_POINT = 20;
  const h = 40;
  
  const hasMultiple = history.length > 1;
  const CONTAINER_WIDTH = 140; // From styles.rightColumn.width
  const isScrollable = (history.length * SPARK_WIDTH_PER_POINT) > CONTAINER_WIDTH;
  const sparkWidth = isScrollable ? (history.length * SPARK_WIDTH_PER_POINT) : (CONTAINER_WIDTH - 20); // 20px padding for small graphs

  const points = history.map((val, i) => {
    // Non-linear mapping: scores 0-50 take up 20% height, 50-100 take up 80%
    // This focuses the graph on the high-performance range.
    let y_percent = 0;
    const normalizedVal = Math.min(Math.max(val, 0), 100);
    
    if (normalizedVal <= 50) {
      y_percent = (normalizedVal / 50) * 0.2;
    } else {
      y_percent = 0.2 + ((normalizedVal - 50) / 50) * 0.8;
    }

    const x = hasMultiple ? (i / (history.length - 1)) * sparkWidth : sparkWidth / 2;
    const y = h * (1 - y_percent); // SVG Y increases downwards
    return { x, y };
  });

  const buildSparkline = () => {
    if (!hasMultiple) return '';
    return `M ${points.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' L ')}`;
  };

  const isPositive = trend >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftColumn}>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.7)" weight="medium">
            WEEKLY PERFORMANCE
          </AppText>
          <View style={styles.scoreRow}>
            <AppText variant="hero" color={theme.colors.textPrimary} weight="bold">
              {score}%
            </AppText>
            <View style={[styles.trendBadge, { backgroundColor: isPositive ? 'rgba(69, 197, 136, 0.2)' : 'rgba(255, 82, 82, 0.2)' }]}>
              <AppText variant="bodySmall" weight="bold" color={isPositive ? theme.colors.success : theme.colors.error}>
                {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
              </AppText>
            </View>
          </View>
          {teamAverage !== undefined && (
            <View style={styles.teamRow}>
               <AppText variant="tiny" weight="bold" color="rgba(255,255,255,0.4)" style={{ letterSpacing: 1 }}>TEAM AVG: </AppText>
               <AppText variant="tiny" weight="bold" color={theme.colors.primary}>{teamAverage}%</AppText>
            </View>
          )}
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.sparkContainer}>
            <ScrollView 
              ref={scrollViewRef}
              horizontal 
              scrollEnabled={isScrollable}
              showsHorizontalScrollIndicator={false}
              onContentSizeChange={() => {
                if (isScrollable) {
                  scrollViewRef.current?.scrollToEnd({ animated: false });
                }
              }}
              style={styles.sparkScroll}
            >
              <View>
                <Svg width={sparkWidth} height={h}>
                  {/* Background Grid Lines for structure (0%, 50%, 100%) */}
                  {[0, 32, 40].map(yPos => (
                    <Line 
                      key={yPos}
                      x1={0}
                      y1={yPos}
                      x2={sparkWidth}
                      y2={yPos}
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth={1}
                    />
                  ))}
                  <Path
                    d={buildSparkline()}
                    fill="none"
                    stroke={isPositive ? theme.colors.success : theme.colors.accentOrange}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Show a single dot only if there's just one data point (since a line needs 2+ points) */}
                  {history.length === 1 && points.map((p, i) => (
                    <Circle 
                      key={i} 
                      cx={p.x} 
                      cy={p.y} 
                      r={3} 
                      fill={isPositive ? theme.colors.success : theme.colors.accentOrange} 
                    />
                  ))}
                </Svg>
                <View style={[styles.labelRow, { width: sparkWidth }]}>
                  <AppText variant="tiny" color="rgba(255,255,255,0.3)">Earlier</AppText>
                  <AppText variant="tiny" color="rgba(255,255,255,0.3)">Latest</AppText>
                </View>
              </View>
            </ScrollView>
          </View>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.5)" style={{ textAlign: 'right', marginTop: 4 }}>
            Session History
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.nearBlack,
    borderRadius: theme.radii.largeCard,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: 'flex-end',
    width: 140, // Fixed width for the scrollable area
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radii.pill,
  },
  sparkContainer: {
    height: 60,
    width: '100%',
    justifyContent: 'center',
  },
  sparkScroll: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  }
});
