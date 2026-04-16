import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';
import { CalendarDay } from '@/types/app';

type CalendarStripProps = {
  days: CalendarDay[];
  onSelectDay: (dayKey: string) => void;
};

export function CalendarStrip({ days, onSelectDay }: CalendarStripProps) {
  return (
    <View style={styles.container}>
      {days.map((item) => (
        <Pressable key={item.key} onPress={() => onSelectDay(item.key)} style={[styles.dayItem, item.isSelected && styles.selectedDay]}>
          <AppText variant='bodySmall' color={theme.colors.textDark} weight={item.isSelected ? 'semibold' : 'medium'}>
            {item.day}
          </AppText>
          <View style={[styles.dateBubble, item.isSelected && styles.selectedDateBubble]}>
            <AppText variant='body' color={item.isSelected ? theme.colors.surface : theme.colors.textDark} weight='semibold'>
              {item.date}
            </AppText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.largeCard,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
  },
  selectedDay: {
    backgroundColor: theme.colors.lavender,
  },
  dateBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateBubble: {
    backgroundColor: theme.colors.nearBlack,
    borderRadius: 17,
    overflow: 'hidden',
  },
});
