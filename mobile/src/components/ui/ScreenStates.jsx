import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AlertTriangle, Inbox } from 'lucide-react-native';
import { colors, fonts, spacing } from '../../theme.js';
import Button from './Button.jsx';

export function LoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.indigo900} />
    </View>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <View style={styles.center}>
      <Icon size={32} color={colors.muted} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <View style={styles.center}>
      <AlertTriangle size={32} color={colors.error} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {onRetry ? (
        <Button variant="outline" onPress={onRetry} style={{ marginTop: spacing.lg }}>
          Try again
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.indigo900,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
});
