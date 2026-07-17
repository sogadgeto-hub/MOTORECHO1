import { type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';

type ReportSectionProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  delay?: number;
};

export function ReportSection({ title, subtitle, icon, children }: ReportSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <GlassCard style={styles.card}>{children}</GlassCard>
    </View>
  );
}

export function ReportBodyText({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function ReportBulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={`${index}-${item.slice(0, 12)}`} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function ReportHighlight({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.highlight}>
      <Text style={styles.highlightLabel}>{label}</Text>
      <Text style={styles.highlightValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,219,231,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 17,
    color: MD3Colors.onSurface,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radii.lg,
  },
  body: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 23,
  },
  list: { gap: 10 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 15,
    color: MD3Colors.primaryFixedDim,
    lineHeight: 22,
  },
  listText: {
    flex: 1,
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 22,
  },
  highlight: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  highlightLabel: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  highlightValue: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 42,
    color: MD3Colors.primaryFixedDim,
    letterSpacing: -1,
  },
});
