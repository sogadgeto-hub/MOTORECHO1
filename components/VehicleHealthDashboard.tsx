import { type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Mic,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react-native';
import { FadeInView } from '@/components/FadeInView';
import { GlassCard } from '@/components/GlassCard';
import { HealthScoreGauge } from '@/components/HealthScoreGauge';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import type { Vehicle } from '@/lib/db';
import type { VehicleHealthDashboardData, TimelineEntry } from '@/lib/vehicle-health';
import { useI18n } from '@/lib/i18n';

type VehicleHealthDashboardProps = {
  vehicle: Vehicle;
  dashboard: VehicleHealthDashboardData;
  loading?: boolean;
  onRefresh?: () => void;
  onAnalyze?: () => void;
  onBack?: () => void;
  compact?: boolean;
};

export function VehicleHealthDashboard({
  vehicle,
  dashboard,
  loading = false,
  onRefresh,
  onAnalyze,
  onBack,
  compact = false,
}: VehicleHealthDashboardProps) {
  const { t, language } = useI18n();
  const copy = t.vehicleHealth;
  const { score, evolution, timeline, stats, showAnalysisReminder } = dashboard;
  const levelCopy = copy.levels[score.level.id];

  function formatDate(iso: string | null, relative = false): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (relative) {
      const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
      if (days <= 0) return copy.today;
      if (days === 1) return copy.yesterday;
      return copy.daysAgo.replace('{{count}}', String(days));
    }
    return date.toLocaleDateString(
      language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US',
      { day: 'numeric', month: 'long', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }
    );
  }

  function issueLabel(entry: TimelineEntry): string {
    if (entry.isNormal) return copy.allClear;
    if (!entry.issue_type) return copy.anomalyDetected;
    const key = entry.issue_type as keyof typeof t.result.issues;
    return t.result.issues[key] ?? entry.issue_type;
  }

  function lastAnomalyLabel(): string {
    const lastWithIssue = timeline.find((entry) => !entry.isNormal);
    if (!lastWithIssue) return copy.allClear;
    return issueLabel(lastWithIssue);
  }

  function evolutionLabel(): string {
    switch (evolution.evolution) {
      case 'improving':
        return copy.evolution.improving;
      case 'declining':
        return copy.evolution.declining;
      case 'stable':
        return copy.evolution.stable;
      default:
        return copy.evolution.unknown;
    }
  }

  function EvolutionIcon() {
    const size = 18;
    const stroke = 2;
    if (evolution.evolution === 'improving') {
      return <TrendingUp size={size} color={MD3Colors.primaryFixedDim} strokeWidth={stroke} />;
    }
    if (evolution.evolution === 'declining') {
      return <TrendingDown size={size} color={MD3Colors.error} strokeWidth={stroke} />;
    }
    return <Minus size={size} color={MD3Colors.onSurfaceVariant} strokeWidth={stroke} />;
  }

  function frequentAnomalyLabel(): string {
    if (!stats.mostFrequentAnomaly) return '—';
    const key = stats.mostFrequentAnomaly as keyof typeof t.result.issues;
    return t.result.issues[key] ?? stats.mostFrequentAnomaly;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, compact && styles.scrollCompact]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={MD3Colors.primaryFixedDim} />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      {!compact && onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={24} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
        </TouchableOpacity>
      )}

      <FadeInView delay={50}>
        <Text style={styles.vehicleTitle}>
          {vehicle.brand} {vehicle.model}
        </Text>
        <Text style={styles.vehicleMeta}>
          {vehicle.year} · {vehicle.fuel_type}
          {vehicle.engine_type ? ` · ${vehicle.engine_type}` : ''}
        </Text>
      </FadeInView>

      {showAnalysisReminder && (
        <FadeInView delay={80} style={styles.reminderWrap}>
          <GlassCard style={styles.reminderCard}>
            <AlertTriangle size={18} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />
            <Text style={styles.reminderText}>{copy.analysisReminder}</Text>
          </GlassCard>
        </FadeInView>
      )}

      <FadeInView delay={100}>
        <GlassCard style={styles.heroCard}>
          <Text style={styles.estimationBadge}>{copy.estimationLabel}</Text>
          <View style={styles.heroRow}>
            <HealthScoreGauge
              score={score.score}
              size={compact ? 140 : 180}
              strokeWidth={12}
              label={`${score.score} / 100`}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.healthSectionTitle}>{copy.vehicleHealthTitle}</Text>
              <View style={styles.levelRow}>
                <Text style={styles.levelEmoji}>{score.level.emoji}</Text>
                <Text style={[styles.levelTitle, { color: score.level.color }]}>{levelCopy.title}</Text>
              </View>
              <Text style={styles.levelDescription}>{levelCopy.description}</Text>
            </View>
          </View>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={150} style={styles.quickGrid}>
        <QuickFact label={copy.lastAnalysis} value={formatDate(stats.lastAnalysisDate, true)} />
        <QuickFact label={copy.totalAnalyses} value={String(stats.totalAnalyses)} />
        <QuickFact label={copy.lastAnomaly} value={lastAnomalyLabel()} />
        <QuickFact label={copy.evolutionTitle} value={evolutionLabel()} icon={<EvolutionIcon />} />
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={styles.sectionTitle}>{copy.statsTitle}</Text>
        <View style={styles.statsGrid}>
          <StatCard icon={BarChart3} label={copy.totalAnalyses} value={String(stats.totalAnalyses)} />
          <StatCard
            icon={Calendar}
            label={copy.firstAnalysis}
            value={formatDate(stats.firstAnalysisDate)}
          />
          <StatCard
            icon={Clock}
            label={copy.lastAnalysisDate}
            value={formatDate(stats.lastAnalysisDate)}
          />
          <StatCard icon={Activity} label={copy.mostFrequentAnomaly} value={frequentAnomalyLabel()} />
          <StatCard
            icon={Clock}
            label={copy.daysSinceLastAnalysis}
            value={
              stats.daysSinceLastAnalysis !== null
                ? copy.daysAgo.replace('{{count}}', String(stats.daysSinceLastAnalysis))
                : '—'
            }
          />
        </View>
      </FadeInView>

      <FadeInView delay={250}>
        <Text style={styles.sectionTitle}>{copy.timelineTitle}</Text>
        <GlassCard style={styles.timelineCard}>
          {timeline.length === 0 ? (
            <View style={styles.emptyTimeline}>
              <Text style={styles.emptyTimelineText}>{copy.noAnalysesYet}</Text>
              {onAnalyze && (
                <TouchableOpacity style={styles.analyzeLink} onPress={onAnalyze} activeOpacity={0.8}>
                  <Mic size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                  <Text style={styles.analyzeLinkText}>{copy.runFirstAnalysis}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            timeline.map((entry, index) => (
              <View
                key={entry.id}
                style={[styles.timelineRow, index < timeline.length - 1 && styles.timelineRowBorder]}
              >
                <View style={styles.timelineLeft}>
                  <Text style={styles.timelineDate}>{formatDate(entry.createdAt, index === 0)}</Text>
                  <Text style={styles.timelineIssue}>{issueLabel(entry)}</Text>
                </View>
                <View style={styles.timelineScoreWrap}>
                  <Text style={[styles.timelineScore, { color: entry.level.color }]}>{entry.score}</Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>
      </FadeInView>

      {onAnalyze && !compact && (
        <FadeInView delay={300} style={styles.analyzeWrap}>
          <TouchableOpacity style={styles.analyzeButton} onPress={onAnalyze} activeOpacity={0.85}>
            <Mic size={18} color={MD3Colors.onPrimary} strokeWidth={2} />
            <Text style={styles.analyzeButtonText}>{copy.newAnalysis}</Text>
          </TouchableOpacity>
        </FadeInView>
      )}

      <View style={styles.footerSpacer} />
    </ScrollView>
  );
}

function QuickFact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <GlassCard style={styles.quickFact}>
      <Text style={styles.quickFactLabel}>{label}</Text>
      <View style={styles.quickFactValueRow}>
        {icon}
        <Text style={styles.quickFactValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </GlassCard>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <GlassCard style={styles.statCard}>
      <Icon size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 56, paddingBottom: 48, paddingHorizontal: Spacing.lg },
  scrollCompact: { paddingTop: Spacing.md, paddingHorizontal: 0 },
  backBtn: { marginBottom: Spacing.md, alignSelf: 'flex-start' },
  vehicleTitle: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 26,
    color: MD3Colors.onSurface,
    marginBottom: 4,
  },
  vehicleMeta: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },
  reminderWrap: { marginBottom: Spacing.md },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: 'rgba(232,196,35,0.06)',
    borderColor: 'rgba(232,196,35,0.15)',
  },
  reminderText: {
    flex: 1,
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  heroCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  estimationBadge: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 11,
    color: MD3Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  heroInfo: { flex: 1 },
  healthSectionTitle: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  levelEmoji: { fontSize: 22 },
  levelTitle: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 20,
  },
  levelDescription: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickFact: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    padding: Spacing.md,
    gap: 6,
  },
  quickFactLabel: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
  },
  quickFactValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  quickFactValue: {
    flex: 1,
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: MD3Colors.onSurface,
  },
  sectionTitle: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 17,
    color: MD3Colors.onSurface,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    padding: Spacing.md,
    gap: 6,
  },
  statLabel: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
  },
  statValue: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 14,
    color: MD3Colors.onSurface,
  },
  timelineCard: { padding: Spacing.md, marginBottom: Spacing.lg },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  timelineRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  timelineLeft: { flex: 1, paddingRight: Spacing.md },
  timelineDate: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 14,
    color: MD3Colors.onSurface,
    marginBottom: 2,
  },
  timelineIssue: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
  },
  timelineScoreWrap: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  timelineScore: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 22,
  },
  emptyTimeline: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  emptyTimelineText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  analyzeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzeLinkText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
  analyzeWrap: { marginTop: Spacing.sm },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: MD3Colors.primaryFixedDim,
    borderRadius: Radii.md,
    paddingVertical: 16,
  },
  analyzeButtonText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: MD3Colors.onPrimary,
  },
  footerSpacer: { height: 24 },
});
