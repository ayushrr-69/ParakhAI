import { Pressable, StyleSheet, View } from 'react-native';
import { TestActionCard } from '@/components/home/TestActionCard';
import { theme } from '@/theme';
import { TestAction } from '@/types/app';

type ActionBlockGridProps = {
  items: TestAction[];
  onPress: (key: TestAction['key']) => void;
  titleSuffix?: string;
};

export function ActionBlockGrid({ items, onPress, titleSuffix = '' }: ActionBlockGridProps) {
  const topRowItems = items.slice(0, 2);
  const bottomRowItems = items.slice(2);

  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        {topRowItems.map((item) => (
          <View key={item.key} style={styles.halfWidthCard}>
            <Pressable onPress={() => onPress(item.key)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <TestActionCard title={`${item.title}${titleSuffix}`} backgroundColor={item.backgroundColor} />
            </Pressable>
          </View>
        ))}
      </View>
      {bottomRowItems.map((item) => (
        <View key={item.key} style={styles.fullWidthCard}>
          <Pressable onPress={() => onPress(item.key)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <TestActionCard title={`${item.title}${titleSuffix}`} backgroundColor={item.backgroundColor} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'stretch',
  },
  halfWidthCard: {
    flex: 1,
    minWidth: 0,
  },
  fullWidthCard: {
    width: '100%',
    minWidth: 0,
  },
});
