import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  Car,
  Mic,
  ChevronRight,
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  BarChart3,
  Crown,
  LogOut,
} from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { GlassCard } from '@/components/GlassCard';
import { HealthScoreGauge } from '@/components/HealthScoreGauge';
import { FadeInView } from '@/components/FadeInView';
import { SkeletonDashboard } from '@/components/Skeleton';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { getDiagnostics, getDiagnosticsForVehicle, getHealthScore, getStatusFromHealthScore, DiagnosticRecord } from '@/lib/analyzer';
import { fetchVehicles, Vehicle } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { formatPlanLabel } from '@/lib/plan-access';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useI18n } from '@/lib/i18n';
import { stripRecordingQualityMarker } from '@/lib/audio-quality/recommendation';
import { navigateToVehicleHealth } from '@/lib/navigation';

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { plan, snapshot, loading: planLoading, isFreePlan } = useSubscriptionAccess(user?.id);
  const { t, language } = useI18n();
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const healthScore = getHealthScore(records);
  const status = getStatusFromHealthScore(healthScore);
  const recent = records.slice(0, 3);
  const totalAnalyses = records.length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const allVehicles = await fetchVehicles();
      setVehicles(allVehicles);
      const primary = allVehicles.find((v) => v.is_primary) ?? allVehicles[0] ?? null;
      if (primary) {
        setRecords(await getDiagnosticsForVehicle(primary.id));
      } else {
        setRecords(await getDiagnostics());
      }
    } catch (error) {
      if (__DEV__) {
        console.log('[Garage] dashboard load failed', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const remainingVehicles =
    snapshot.maxVehicles === -1
      ? -1
      : Math.max(0, snapshot.maxVehicles - snapshot.vehicleCount);
  const maxAnalysesDisplay = snapshot.maxAnalyses === -1 ? '∞' : String(snapshot.maxAnalyses);
  const maxVehiclesDisplay = snapshot.maxVehicles === -1 ? '∞' : String(snapshot.maxVehicles);

  function getResultLabel(result: string) {
    const m: Record<string, string> = {
      normal_engine: t.result.healthy.title,
      suspicious_noise: t.result.monitor.title,
      anomaly_detected: t.result.critical.title,
    };
    return m[result] ?? result;
  }

  function getIssueLabel(type: string) {
    const m: Record<string, string> = {
      turbo_issue: t.result.issues.turbo,
      injector_noise: t.result.issues.injector,
      timing_chain_noise: t.result.issues.timingChain,
      engine_knocking: t.result.issues.engineKnock,
      idle_instability: t.result.issues.idle,
    };
    return m[type] ?? type;
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' });
  }

  const showInitialSkeleton = loading && records.length === 0 && vehicles.length === 0;

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading && !showInitialSkeleton} onRefresh={load} tintColor={MD3Colors.primaryFixedDim} />}
        showsVerticalScrollIndicator={false}
      >
        {showInitialSkeleton ? (
          <SkeletonDashboard />
        ) : (
          <>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
            >
              {user?.user_metadata?.avatar_url ? (
                <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{profile?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>{t.dashboard.hello.replace('{{name}}', profile?.first_name ?? 'User')}</Text>
              <TouchableOpacity style={styles.planBadge} onPress={() => router.push('/premium')} activeOpacity={0.7}>
                <Crown size={12} color={isFreePlan ? MD3Colors.onSurfaceVariant : MD3Colors.primaryFixedDim} strokeWidth={2} />
                <Text style={[styles.planText, !isFreePlan && styles.planTextPremium]}>
                  {planLoading ? '…' : formatPlanLabel(plan)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.7}>
            <LogOut size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Health Score Section */}
        <FadeInView delay={100} style={styles.heroSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              const primary = vehicles.find((v) => v.is_primary) ?? vehicles[0];
              if (primary) {
                navigateToVehicleHealth(router, primary.id);
              }
            }}
            disabled={vehicles.length === 0}
          >
            <GlassCard style={styles.heroCard}>
              <View style={styles.heroContent}>
                <HealthScoreGauge score={healthScore} size={180} strokeWidth={12} label={`${healthScore} / 100`} />
                <View style={styles.statusRow}>
                  <View style={[styles.statusPill, { borderColor: status.color, backgroundColor: `${status.color}12` }]}>
                    {status.status === 'Healthy' ? <CheckCircle size={14} color={status.color} strokeWidth={2} /> :
                     status.status === 'Monitor' ? <AlertTriangle size={14} color={status.color} strokeWidth={2} /> :
                     <AlertOctagon size={14} color={status.color} strokeWidth={2} />}
                    <Text style={[styles.statusText, { color: status.color }]}>{getResultLabel(status.status.toLowerCase().replace(' ', '_') === 'healthy' ? 'normal_engine' : status.status === 'Monitor' ? 'suspicious_noise' : 'anomaly_detected')}</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </FadeInView>

        {/* Usage Stats for Free Users */}
        {isFreePlan && !planLoading && (
          <FadeInView delay={150} style={styles.usageCard}>
            <GlassCard>
              <View style={styles.usageContent}>
                <View style={styles.usageStat}>
                  <Text style={styles.usageLabel}>{t.dashboard.analysesThisMonth}</Text>
                  <View style={styles.usageBar}>
                    <View style={styles.usageTrack}>
                      <View style={[styles.usageFill, {
                        flex: snapshot.maxAnalyses > 0
                          ? snapshot.monthlyAnalyses / snapshot.maxAnalyses
                          : 0,
                      }]} />
                    </View>
                    <Text style={styles.usageText}>{snapshot.monthlyAnalyses}/{maxAnalysesDisplay}</Text>
                  </View>
                </View>
                <View style={styles.usageDivider} />
                <View style={styles.usageStat}>
                  <Text style={styles.usageLabel}>{t.dashboard.vehicles}</Text>
                  <View style={styles.usageBar}>
                    <Text style={styles.usageText}>{snapshot.vehicleCount}/{maxVehiclesDisplay}</Text>
                    {remainingVehicles === 0 && (
                      <TouchableOpacity style={styles.upgradeChip} onPress={() => router.push('/premium')} activeOpacity={0.7}>
                        <Crown size={12} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                        <Text style={styles.upgradeChipText}>{t.dashboard.upgrade}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </GlassCard>
          </FadeInView>
        )}

        {/* Quick Stats */}
        <FadeInView delay={200} style={styles.statsRow}>
          <QuickStatCard
            icon={BarChart3}
            label={t.dashboard.healthScore}
            value={String(healthScore)}
            color={status.color}
          />
          <QuickStatCard
            icon={Activity}
            label={t.dashboard.totalAnalyses}
            value={String(totalAnalyses)}
            color={MD3Colors.primaryFixedDim}
          />
          <QuickStatCard
            icon={CheckCircle}
            label={t.dashboard.lastStatus}
            value={recent[0] ? getResultLabel(recent[0].result) : '—'}
            color={recent[0] ? getStatusColor(recent[0].result) : MD3Colors.onSurfaceVariant}
          />
        </FadeInView>

        {/* Action Buttons */}
        <FadeInView delay={300} style={styles.actionsSection}>
          <TouchableOpacity style={styles.analyzeButton} onPress={() => router.push('/recording')} activeOpacity={0.85}>
            <Mic size={22} color={MD3Colors.onPrimary} strokeWidth={2} />
            <Text style={styles.analyzeText}>{t.dashboard.analyzeEngine}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/(tabs)/history')} activeOpacity={0.7}>
            <Text style={styles.historyButtonText}>{t.dashboard.viewHistory}</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Vehicle Card */}
        {vehicles.length > 0 && (
          <FadeInView delay={400}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.dashboard.vehicle}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} activeOpacity={0.7}>
                <Text style={styles.seeAll}>{t.dashboard.manage}</Text>
              </TouchableOpacity>
            </View>
            {vehicles.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.vehicleCard}
                onPress={() => navigateToVehicleHealth(router, v.id)}
                activeOpacity={0.7}
              >
                <GlassCard>
                  <View style={styles.vehicleRow}>
                    <View style={styles.vehicleIcon}>
                      <Car size={28} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleBrand}>{v.brand} {v.model}</Text>
                      <Text style={styles.vehicleMeta}>
                        {v.year} · {v.fuel_type} · {v.engine_type}
                        {v.is_primary ? ' · ★' : ''}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </FadeInView>
        )}

        {/* Add Vehicle CTA if no vehicle */}
        {vehicles.length === 0 && (
          <FadeInView delay={400}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.dashboard.vehicle}</Text>
            </View>
            <TouchableOpacity style={styles.addVehicleCard} onPress={() => router.push('/add-vehicle')} activeOpacity={0.7}>
              <GlassCard>
                <View style={styles.addVehicleContent}>
                  <Car size={32} color={MD3Colors.onSurfaceVariant} strokeWidth={1.5} />
                  <Text style={styles.addVehicleText}>{t.dashboard.addFirstVehicle}</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* Recent Analyses */}
        <FadeInView delay={500}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.dashboard.recentAnalyses}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history')} activeOpacity={0.7}>
              <Text style={styles.seeAll}>{t.dashboard.seeAll}</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Activity size={36} color={MD3Colors.onSurfaceVariant} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>{t.dashboard.noAnalyses}</Text>
              <Text style={styles.emptySubtitle}>{t.dashboard.noAnalysesSubtitle}</Text>
            </GlassCard>
          ) : (
            recent.map((r, i) => (
              <FadeInView key={r.id} delay={600 + i * 100}>
                <TouchableOpacity
                  style={styles.historyCard}
                  onPress={() => router.push({
                    pathname: '/result',
                    params: { result: r.result, type: r.issue_type ?? '', confidence: String(r.confidence), severity: r.severity, recommendation: stripRecordingQualityMarker(r.recommendation ?? ''), recordId: r.id },
                  })}
                  activeOpacity={0.7}
                >
                  <GlassCard>
                    <View style={styles.historyRow}>
                      <View style={[styles.historyIcon, { backgroundColor: getStatusBg(r.result) }]}>
                        {r.result === 'normal_engine' ? <CheckCircle size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} /> :
                         r.result === 'anomaly_detected' ? <AlertOctagon size={20} color={MD3Colors.error} strokeWidth={2} /> :
                         <AlertTriangle size={20} color={MD3Colors.tertiaryFixedDim} strokeWidth={2} />}
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyResult}>{getResultLabel(r.result)}</Text>
                        <Text style={styles.historyMeta}>{formatDate(r.created_at)} {r.issue_type ? '· ' + getIssueLabel(r.issue_type) : ''}</Text>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={[styles.historyConfidence, { color: getStatusColor(r.result) }]}>
                          {Math.round(r.confidence * 100)}%
                        </Text>
                        <ChevronRight size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </FadeInView>
            ))
          )}
        </FadeInView>

        {/* Premium Upgrade Banner for Free Users */}
        {isFreePlan && (
          <FadeInView delay={700} style={styles.upgradeBanner}>
            <TouchableOpacity onPress={() => router.push('/premium')} activeOpacity={0.85}>
              <GlassCard style={styles.upgradeBannerCard}>
                <View style={styles.upgradeBannerContent}>
                  <Crown size={24} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                  <View style={styles.upgradeBannerText}>
                    <Text style={styles.upgradeBannerTitle}>{t.dashboard.upgradeBanner.title}</Text>
                    <Text style={styles.upgradeBannerSubtitle}>{t.dashboard.upgradeBanner.subtitle}</Text>
                  </View>
                  <ChevronRight size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </FadeInView>
        )}

        <View style={styles.spacer} />
          </>
        )}
      </ScrollView>
    </AppBackground>
  );
}

function QuickStatCard({ icon: Icon, label, value, color }: { icon: typeof BarChart3; label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} strokeWidth={2} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getStatusBg(result: string) {
  const m: Record<string, string> = { normal_engine: 'rgba(0,219,231,0.08)', suspicious_noise: 'rgba(232,196,35,0.08)', anomaly_detected: 'rgba(255,180,171,0.05)' };
  return m[result] ?? MD3Colors.surfaceContainer;
}
function getStatusColor(result: string) {
  const m: Record<string, string> = { normal_engine: MD3Colors.primaryFixedDim, suspicious_noise: MD3Colors.tertiaryFixedDim, anomaly_detected: MD3Colors.error };
  return m[result] ?? MD3Colors.onSurfaceVariant;
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 0, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMobile,
    height: 72,
    backgroundColor: 'rgba(13,21,21,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 4,
    borderRadius: 999,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MD3Colors.primaryFixedDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 16,
    color: MD3Colors.onPrimary,
  },
  greeting: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: MD3Colors.onSurface,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  planText: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
  },
  planTextPremium: {
    color: MD3Colors.primaryFixedDim,
  },
  logoutBtn: {
    padding: 8,
  },

  heroSection: { paddingHorizontal: Spacing.containerMobile, marginTop: Spacing.stackMd },
  heroCard: { padding: 0 },
  heroContent: { alignItems: 'center', paddingVertical: 24 },
  statusRow: { marginTop: 16 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  statusText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 14, letterSpacing: 0.5 },

  usageCard: { paddingHorizontal: Spacing.containerMobile, marginTop: Spacing.lg },
  usageContent: { padding: Spacing.md },
  usageStat: { flex: 1 },
  usageLabel: { fontFamily: 'HankenGrotesk-Medium', fontSize: 12, color: MD3Colors.onSurfaceVariant, marginBottom: 6 },
  usageBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  usageTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: MD3Colors.surfaceContainerHigh, overflow: 'hidden' },
  usageFill: { backgroundColor: MD3Colors.primaryFixedDim, height: '100%', borderRadius: 3 },
  usageText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 14, color: MD3Colors.onSurface },
  usageDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: Spacing.md },
  upgradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,219,231,0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  upgradeChipText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 11, color: MD3Colors.primaryFixedDim },

  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.containerMobile, gap: 12, marginTop: Spacing.stackMd },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 12, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontFamily: 'HankenGrotesk-Bold', fontSize: 22 },
  statLabel: { fontFamily: 'HankenGrotesk-Regular', fontSize: 11, color: MD3Colors.onSurfaceVariant, marginTop: 2 },

  actionsSection: { paddingHorizontal: Spacing.containerMobile, gap: 12, marginTop: Spacing.stackMd },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: MD3Colors.primaryFixedDim,
    borderRadius: 12,
    shadowColor: MD3Colors.primaryFixedDim,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  analyzeText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 15, color: MD3Colors.onPrimary },
  historyButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  historyButtonText: { fontFamily: 'HankenGrotesk-Medium', fontSize: 15, color: MD3Colors.onSurfaceVariant },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.containerMobile, marginBottom: 12, marginTop: Spacing.stackMd },
  sectionTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 18, color: MD3Colors.onSurface },
  seeAll: { fontFamily: 'HankenGrotesk-Medium', fontSize: 13, color: MD3Colors.primaryFixedDim },

  vehicleCard: { paddingHorizontal: Spacing.containerMobile },
  vehicleIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(0,219,231,0.08)', alignItems: 'center', justifyContent: 'center' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  vehicleInfo: { flex: 1 },
  vehicleBrand: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: MD3Colors.onSurface },
  vehicleMeta: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant, marginTop: 2 },

  addVehicleCard: { paddingHorizontal: Spacing.containerMobile },
  addVehicleContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', borderRadius: Radii.md },
  addVehicleText: { fontFamily: 'HankenGrotesk-Medium', fontSize: 15, color: MD3Colors.onSurfaceVariant },

  emptyCard: { padding: 24, alignItems: 'center', marginHorizontal: Spacing.containerMobile },
  emptyIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: MD3Colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: MD3Colors.onSurface },
  emptySubtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 },

  historyCard: { paddingHorizontal: Spacing.containerMobile, marginBottom: 10 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  historyInfo: { flex: 1 },
  historyResult: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 15, color: MD3Colors.onSurface },
  historyMeta: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant, marginTop: 2 },
  historyRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyConfidence: { fontFamily: 'HankenGrotesk-Bold', fontSize: 13 },

  upgradeBanner: { paddingHorizontal: Spacing.containerMobile, marginTop: Spacing.xl },
  upgradeBannerCard: { borderWidth: 1, borderColor: MD3Colors.primaryFixedDim, backgroundColor: 'rgba(0,219,231,0.04)' },
  upgradeBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  upgradeBannerText: { flex: 1 },
  upgradeBannerTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 15, color: MD3Colors.onSurface },
  upgradeBannerSubtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant, marginTop: 2 },

  spacer: { height: 40 },
});
