import { useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import * as Battery from 'expo-battery';
import Svg, { Path, Rect } from 'react-native-svg';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';

const getFormattedTime = () =>
  new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());

export function DeviceStatusBar() {
  const [timeLabel, setTimeLabel] = useState(getFormattedTime);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    const refreshTime = () => setTimeLabel(getFormattedTime());
    refreshTime();

    const timer = setInterval(refreshTime, 30000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshTime();
      }
    });

    return () => {
      clearInterval(timer);
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const syncBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        if (mounted && Number.isFinite(level)) {
          setBatteryLevel(level);
        }
      } catch {
        if (mounted) {
          setBatteryLevel(null);
        }
      }
    };

    syncBattery();

    const subscription = Battery.addBatteryLevelListener(({ batteryLevel: level }) => {
      if (mounted) {
        setBatteryLevel(level ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const batteryPercentage = useMemo(() => {
    if (batteryLevel == null) {
      return '--%';
    }

    return `${Math.round(batteryLevel * 100)}%`;
  }, [batteryLevel]);

  const batteryFillWidth = useMemo(() => {
    if (batteryLevel == null) {
      return 8;
    }

    return Math.max(3, Math.round(batteryLevel * 14));
  }, [batteryLevel]);

  return (
    <View style={styles.container}>
      <AppText variant='bodySmall' weight='semibold'>
        {timeLabel}
      </AppText>
      <View style={styles.icons}>
        <Svg width={18} height={12} viewBox='0 0 18 12' fill='none'>
          <Rect x={1} y={7} width={2} height={4} rx={1} fill={theme.colors.surface} />
          <Rect x={5} y={5} width={2} height={6} rx={1} fill={theme.colors.surface} />
          <Rect x={9} y={3} width={2} height={8} rx={1} fill={theme.colors.surface} />
          <Rect x={13} y={1} width={2} height={10} rx={1} fill={theme.colors.surface} />
        </Svg>
        <Svg width={16} height={12} viewBox='0 0 16 12' fill='none'>
          <Path
            d='M1 4.5C4.2 1.5 11.8 1.5 15 4.5M3 7C5.4 4.7 10.6 4.7 13 7M6 9.5C7.4 8.3 8.6 8.3 10 9.5'
            stroke={theme.colors.surface}
            strokeWidth={1.6}
            strokeLinecap='round'
          />
        </Svg>
        <View style={styles.batteryGroup}>
          <AppText variant='bodySmall' weight='medium'>
            {batteryPercentage}
          </AppText>
          <Svg width={26} height={12} viewBox='0 0 26 12' fill='none'>
            <Rect x={1} y={1} width={20} height={10} rx={3} stroke={theme.colors.surface} strokeWidth={1.3} />
            <Rect x={3} y={3} width={batteryFillWidth} height={6} rx={2} fill={theme.colors.surface} />
            <Rect x={22} y={4} width={3} height={4} rx={1} fill={theme.colors.surface} />
          </Svg>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  batteryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
