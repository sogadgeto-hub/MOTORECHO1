import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, AlertTriangle, CheckCircle, AlertOctagon, ChevronRight, Filter, X } from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { FadeInView } from '@/components/FadeInView';
import { SkeletonList } from '@/components/Skeleton';
import { MD3Colors, Colors, Spacing, Radii, IconStroke } from '@/lib/theme';
import { getDiagnostics, DiagnosticRecord } from '@/lib/analyzer';
import { stripRecordingQualityMarker } from '@/lib/audio-quality/recommendation';
import { useI18n } from '@/lib/i18n';

export default function HistoryScreen() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [filtered, setFiltered] = useState<DiagnosticRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'healthy' | 'monitor' | 'critical'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setError(null);
      const data = await getDiagnostics();
      setRecords(data);
      setFiltered(data);
    } catch {
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [t.common.error]);

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFiltered(records);
    } else {
      const map: Record<string, string> = { healthy: 'normal_engine', monitor: 'suspicious_noise', critical: 'anomaly_detected' };
      setFiltered(records.filter((r) => r.result === map[filter]));
    }
  }, [filter, records]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const locale = language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const locale = language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  function getIcon(result: string) {
    if (result === 'normal_engine') return <CheckCircle size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} />;
    if (result === 'anomaly_detected') return <AlertOctagon size={20} color={MD3Colors.error} strokeWidth={2} />;
    return <AlertTriangle size={20} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />;
  }

  function getBgColor(result: string) {
    const m: Record<string, string> = {
      normal_engine: Colors.successBg,
      suspicious_noise: Colors.warningBg,
      anomaly_detected: Colors.dangerBg,
    };
    return m[result] ?? MD3Colors.surfaceContainer;
  }

  function getLabel(result: string) {
    const m: Record<string, string> = {
      normal_engine: t.history.filter.healthy,
      suspicious_noise: t.history.filter.monitor,
      anomaly_detected: t.history.filter.critical
    };
    return m[result] ?? result;
  }

  function getIssueLabel(type: string) {
    const m: Record<string, string> = {
      turbo_issue: t.result.issues.turbo,
      injector_noise: t.result.issues.injector,
      timing_chain_noise: t.result.issues.timingChain,
      engine_knocking: t.result.issues.engineKnock,
      idle_instability: t.result.issues.idle
    };
    return m[type] ?? type;
  }

  function getSeverityColor(sev: string) {
    const m: Record<string, string> = { low: MD3Colors.primaryFixedDim, medium: MD3Colors.tertiaryFixedDim, high: MD3Colors.error };
    return m[sev] ?? MD3Colors.onSurfaceVariant;
  }

  function renderItem({ item, index }: { item: DiagnosticRecord; index: number }) {
    const sevColor = getSeverityColor(item.severity);
    return (
      <FadeInView delay={index * 60}>
        <TouchableOpacity
          style={styles.recordCard}
          onPress={() =>
            router.push({
              pathname: '/result',
              params: {
                result: item.result,
                type: item.issue_type ?? '',
                confidence: String(item.confidence),
                severity: item.severity,
                recommendation: stripRecordingQualityMarker(item.recommendation ?? ''),
                recordId: item.id,
              },
            })
          }
          activeOpacity={0.7}
        >
          <View style={[styles.severityStrip, { backgroundColor: sevColor }]} />
          <View style={styles.recordContent}>
            <View style={styles.recordHeader}>
              <View style={[styles.iconBg, { backgroundColor: getBgColor(item.result) }]}>
                {getIcon(item.result)}
              </View>
              <View style={styles.recordHeaderText}>
                <Text style={styles.recordResult}>{getLabel(item.result)}</Text>
                {item.issue_type && (
                  <Text style={styles.recordIssue}>{getIssueLabel(item.issue_type)}</Text>
                )}
              </View>
              <ChevronRight size={18} color={Colors.textMuted} strokeWidth={2} />
            </View>
            <View style={styles.recordMeta}>
              <Clock size={12} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.recordDate}>
                {formatDate(item.created_at)} {t.history.at} {formatTime(item.created_at)}
              </Text>
              <Text style={[styles.recordConfidence, { color: sevColor }]}>
                {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </FadeInView>
    );
  }

  const showInitialSkeleton = loading && records.length === 0;

  const filterOptions: { key: typeof filter; label: string }[] = [
    { key: 'all', label: t.history.filter.all },
    { key: 'healthy', label: t.history.filter.healthy },
    { key: 'monitor', label: t.history.filter.monitor },
    { key: 'critical', label: t.history.filter.critical },
  ];

  return (
    <AppBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.history.title}</Text>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)} activeOpacity={0.7}>
            {showFilters ? <X size={18} color={Colors.textMuted} strokeWidth={2} /> : <Filter size={18} color={Colors.textMuted} strokeWidth={2} />}
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          {filtered.length === 1
            ? t.history.analysisCount_one.replace('{{count}}', '1')
            : t.history.analysisCount_other.replace('{{count}}', String(filtered.length))}
        </Text>

        {showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {filterOptions.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {showInitialSkeleton ? (
          <View style={styles.listContent}>
            <SkeletonList count={5} />
          </View>
        ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchRecords} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Clock size={48} color={Colors.textMuted} strokeWidth={IconStroke.thin} />
                <Text style={styles.emptyTitle}>{t.history.noHistory}</Text>
                <Text style={styles.emptySubtitle}>
                  {t.history.noHistorySubtitle}
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/recording')}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.emptyButtonGradient}>
                    <Text style={styles.emptyButtonText}>{t.dashboard.analyzeEngine}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
        )}
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.text,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterBtn: {
    padding: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterContent: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  filterChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  errorContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.dangerBg,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    paddingRight: Spacing.md,
  },
  severityStrip: {
    width: 3,
    height: '100%',
    minHeight: 80,
  },
  recordContent: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: 4,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordHeaderText: {
    flex: 1,
  },
  recordResult: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  recordIssue: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 1,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  recordConfidence: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    marginLeft: 'auto',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
