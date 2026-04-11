import { useState, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Dimensions, LayoutChangeEvent } from 'react-native';
import { Svg, Circle, Line, Path, G } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';
import { AnalysisRange } from '@/types/app';

type PerformanceChartProps = {
  type: AnalysisRange;
  userSeries?: number[];
  labels?: string[];
};

const CHART_HEIGHT = 180;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 24;
const PADDING_LEFT = 15; // Inner margin for points
const PADDING_RIGHT = 30; // Safety margin for last point
const MIN_SCORE = 50;
const MAX_SCORE = 100;
const IDEAL_SPACING = 75;

export function PerformanceChart({ userSeries, labels }: PerformanceChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const data = userSeries || [];
  const chartLabels = labels || [];

  const nationalAthleteScores = useMemo(() => {
    return data.map(val => {
      // Logic: Elite is always 10+ points higher, capped at 99, floor at 92
      return Math.max(92, Math.min(99, val + 10 + (Math.random() * 5)));
    });
  }, [data]);

  // Calculations based on measured layout
  const { contentWidth, isScrollable, totalChartWidth } = useMemo(() => {
    if (containerWidth === 0) return { contentWidth: 0, isScrollable: false, totalChartWidth: 0 };

    const yAxisWidth = 40;
    const availableArea = containerWidth - yAxisWidth;
    
    // Determine if we need to scroll
    const totalNeeded = Math.max(0, (data.length - 1) * IDEAL_SPACING);
    const scrollRequired = totalNeeded > (availableArea - PADDING_LEFT - PADDING_RIGHT);
    
    // contentWidth is the drawable area for the points
    const width = scrollRequired 
      ? totalNeeded + PADDING_LEFT + PADDING_RIGHT
      : availableArea;

    return { 
      contentWidth: width, 
      isScrollable: scrollRequired, 
      totalChartWidth: width 
    };
  }, [containerWidth, data.length]);

  const drawableHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const getCoordinates = (values: number[]) => {
    if (contentWidth === 0) return [];
    
    const hasMultiple = values.length > 1;
    let step = 0;
    
    if (hasMultiple) {
      if (isScrollable) {
        step = IDEAL_SPACING;
      } else {
        // Space them across the available contentWidth minus our paddings
        step = (contentWidth - PADDING_LEFT - PADDING_RIGHT) / (values.length - 1);
      }
    }

    return values.map((val, i) => {
      const normalizedVal = Math.max(val, MIN_SCORE);
      const yp = (normalizedVal - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
      
      const x = hasMultiple 
        ? (PADDING_LEFT + i * step) 
        : (contentWidth / 2);
        
      return {
        x,
        y: PADDING_TOP + drawableHeight * (1 - yp),
      };
    });
  };

  const userCoords = getCoordinates(data);
  const nationalCoords = getCoordinates(nationalAthleteScores);

  const buildPath = (coords: {x: number, y: number}[]) => {
    if (coords.length === 0) return '';
    return coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const ticks = [100, 90, 80, 70, 60, 50];

  return (
    <View style={styles.outerContainer} onLayout={onLayout}>
      <View style={styles.container}>
        {/* Y Axis Column */}
        <View style={styles.yAxisColumn}>
          {ticks.map(tick => {
            const yp = (tick - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
            const yPos = PADDING_TOP + drawableHeight * (1 - yp);
            return (
              <View key={tick} style={[styles.tickLabel, { top: yPos - 8 }]}>
                 <AppText variant="tiny" color={theme.colors.nearBlack} weight="medium">{tick}</AppText>
              </View>
            );
          })}
        </View>
  
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          scrollEnabled={isScrollable}
          showsHorizontalScrollIndicator={false} 
          style={styles.scrollView}
          contentContainerStyle={{ width: totalChartWidth }}
          onContentSizeChange={() => {
            if (isScrollable) {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }}
        >
          <Pressable onPress={() => setSelectedIdx(null)} style={{ flex: 1 }}>
            {containerWidth > 0 && (
              <View>
                <Svg width={totalChartWidth} height={CHART_HEIGHT}>
                  {/* Grid Lines */}
                  {ticks.map(tick => {
                    const yp = (tick - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);
                    const y = PADDING_TOP + drawableHeight * (1 - yp);
                    return (
                      <Line 
                        key={tick} 
                        x1={0} 
                        y1={y} 
                        x2={totalChartWidth} 
                        y2={y} 
                        stroke={theme.colors.chartGrid} 
                        strokeWidth={1} 
                        opacity={tick === 50 ? 0.3 : 0.1}
                      />
                    );
                  })}
    
                  {/* National Path */}
                  <Path 
                    d={buildPath(nationalCoords)} 
                    stroke={theme.colors.accentOrange} 
                    strokeWidth={2} 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    opacity={0.4}
                  />
    
                  {/* User Path */}
                  <Path 
                    d={buildPath(userCoords)} 
                    stroke={theme.colors.nearBlack} 
                    strokeWidth={3} 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
    
                  {/* Points */}
                  {userCoords.map((c, i) => (
                    <G key={i}>
                      <Circle 
                        cx={c.x} 
                        cy={c.y} 
                        r={selectedIdx === i ? 7 : 5} 
                        fill={theme.colors.nearBlack} 
                      />
                      {selectedIdx === i && (
                        <Circle cx={c.x} cy={c.y} r={12} fill="rgba(0,0,0,0.1)" />
                      )}
                    </G>
                  ))}
                </Svg>
    
                {/* Interaction Overlay */}
                {userCoords.map((c, i) => (
                  <Pressable
                    key={`hitbox-${i}`}
                    onPress={() => setSelectedIdx(selectedIdx === i ? null : i)}
                    style={{
                      position: 'absolute',
                      left: c.x - 25,
                      top: c.y - 25,
                      width: 50,
                      height: 50,
                    }}
                  />
                ))}
    
                {/* X Axis Labels */}
                <View style={styles.xAxisContainer}>
                  {userCoords.map((c, i) => {
                    const label = chartLabels[i] || '';
                    return (
                      <View key={i} style={[styles.labelWrapper, { left: c.x - 20 }]}>
                        <AppText variant="tiny" color={theme.colors.nearBlack} style={{ textAlign: 'center', opacity: 0.6 }}>
                          {label}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </Pressable>
  
          {/* Tooltip */}
          {selectedIdx !== null && userCoords[selectedIdx] && (() => {
            const point = userCoords[selectedIdx];
            const showBelow = point.y < 50; 
            return (
              <View pointerEvents="none" style={[
                styles.tooltip, 
                { 
                  left: point.x - 35, 
                  top: showBelow ? point.y + 15 : point.y - 45 
                }
              ]}>
                <AppText variant="tiny" weight="bold" color="#FFF">
                  Score: {data[selectedIdx]}%
                </AppText>
              </View>
            );
          })()}
        </ScrollView>
      </View>
  
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.accentOrange, opacity: 0.5 }]} />
          <AppText variant='tiny' color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>Elite Standard</AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.nearBlack }]} />
          <AppText variant='tiny' color={theme.colors.nearBlack} style={{ opacity: 0.7 }}>Your Sessions</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    marginTop: theme.spacing.md,
  },
  container: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
  },
  yAxisColumn: {
    width: 40,
    justifyContent: 'space-between',
  },
  tickLabel: {
    position: 'absolute',
    right: 10,
  },
  scrollView: {
    flex: 1,
  },
  xAxisContainer: {
    height: PADDING_BOTTOM,
    position: 'relative',
    marginTop: 8,
  },
  labelWrapper: {
    position: 'absolute',
    width: 40,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1000,
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
    paddingLeft: 40,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
