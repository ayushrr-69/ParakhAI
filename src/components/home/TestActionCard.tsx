import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { theme } from '@/theme';

type TestActionCardProps = {
  title: string;
  backgroundColor: string;
};

export function TestActionCard({ title, backgroundColor }: TestActionCardProps) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <AppText variant='title' weight='semibold' color={theme.colors.textDark}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 110,
    flex: 1,
    borderRadius: theme.radii.card,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
});
