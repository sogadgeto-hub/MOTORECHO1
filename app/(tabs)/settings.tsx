import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Car, Plus, Gauge, ScanLine, Trash2, CheckCircle,
  Crown, Wrench, User, Users, Mic, Brain,
} from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { GlassCard } from '@/components/GlassCard';
import { HealthScoreGauge } from '@/components/HealthScoreGauge';
import { FadeInView } from '@/components/FadeInView';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { getVehicles, deleteVehicle, setPrimaryVehicle } from '@/lib/db';
import { getDiagnosticsForVehicle, getHealthScore, getCommunityStats, CommunityStats } from '@/lib/analyzer';
import { Vehicle as VehicleType } from '@/lib/db';
import { DiagnosticRecord } from '@/lib/analyzer';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function SettingsTabScreen() {
  const router = useRouter();
  const { profile, planDetails } = useAuth();
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [selected, setSelected] = useState<VehicleType | null>(null);
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);

  const healthScore = getHealthScore(records);
  const scanCount = records.length;
  const isFreePlan = profile?.plan_type === 'free';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getVehicles();
      setVehicles(all);
      const primary = all.find(v => v.is_primary);
      if (primary) {
        setSelected(primary);
        const diags = await getDiagnosticsForVehicle(primary.id);
        setRecords(diags);
      } else if (all.length > 0) {
        setSelected(all[0]);
        const diags = await getDiagnosticsForVehicle(all[0].id);
        setRecords(diags);
      } else {
        setRecords([]);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    getCommunityStats().then(setCommunityStats).catch(() => {});
  }, []);

  async function selectVehicle(v: VehicleType) {
    await setPrimaryVehicle(v.id);
    setSelected(v);
    const diags = await getDiagnosticsForVehicle(v.id);
    setRecords(diags);
    load();
  }

  async function removeVehicle(v: VehicleType) {
    await deleteVehicle(v.id);
    if (selected?.id === v.id) {
      setSelected(null);
      setRecords([]);
    }
    load();
  }

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={MD3Colors.primaryFixedDim} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
              <Wrench size={24} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t.garage.title}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarSmall}>
              <User size={16} color={MD3Colors.onPrimary} strokeWidth={2} />
            </View>
            <Text style={styles.userName}>{profile?.first_name ?? 'User'}</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Card */}
        <FadeInView delay={50} style={styles.planCard}>
          <TouchableOpacity onPress={() => router.push('/premium')} activeOpacity={0.85}>
            <GlassCard style={[styles.planCardInner, !isFreePlan && styles.planCardPremium]}>
              <View style={styles.planContent}>
                <View style={styles.planLeft}>
                  <Crown size={20} color={isFreePlan ? MD3Colors.onSurfaceVariant : MD3Colors.primaryFixedDim} strokeWidth={2} />
                  <View>
                    <Text style={styles.planLabel}>{t.garage.currentPlan}</Text>
                    <Text style={[styles.planNameText, !isFreePlan && styles.planNamePremium]}>
                      {profile?.plan_type?.charAt(0).toUpperCase()}{profile?.plan_type?.slice(1)}
                    </Text>
                  </View>
                </View>
                {isFreePlan && (
                  <View style={styles.upgradeChip}>
                    <Text style={styles.upgradeChipText}>{t.garage.upgrade}</Text>
                  </View>
                )}
              </View>
              {isFreePlan && planDetails && (
                <View style={styles.planLimits}>
                  <Text style={styles.planLimitText}>{planDetails.monthly_analyses}/3 {t.garage.analysesThisMonth}</Text>
                </View>
              )}
            </GlassCard>
          </TouchableOpacity>
        </FadeInView>

        {selected && (
          <FadeInView delay={100} style={styles.heroSection}>
            <HealthScoreGauge score={healthScore} size={160} strokeWidth={10} />
            <Text style={styles.heroVehicle}>{selected.brand} {selected.model}</Text>
            <Text style={styles.heroMeta}>{selected.year} · {selected.fuel_type} · {selected.engine_type}</Text>
          </FadeInView>
        )}

        {selected && (
          <FadeInView delay={200} style={styles.statsRow}>
            <StatCard value={String(scanCount)} label={t.garage.scans} icon={ScanLine} />
            <StatCard value={healthScore} label={t.garage.health} icon={Gauge} />
            <StatCard value={scanCount > 0 ? String(Math.round(100 / scanCount)) + 'd' : '—'} label={t.garage.avgInterval} icon={CheckCircle} />
          </FadeInView>
        )}

        <FadeInView delay={300} style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.garage.yourVehicles}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-vehicle')} activeOpacity={0.7}>
            <Plus size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
            <Text style={styles.addText}>{t.garage.add}</Text>
          </TouchableOpacity>
        </FadeInView>

        {vehicles.length === 0 ? (
          <FadeInView delay={400}>
            <GlassCard style={styles.emptyCard}>
              <Car size={40} color={MD3Colors.onSurfaceVariant} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>{t.garage.noVehicles}</Text>
              <Text style={styles.emptySubtitle}>{t.garage.noVehiclesSubtitle}</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/add-vehicle')} activeOpacity={0.85}>
                <View style={styles.emptyGradient}>
                  <Text style={styles.emptyButtonText}>{t.garage.addVehicle}</Text>
                </View>
              </TouchableOpacity>
            </GlassCard>
          </FadeInView>
        ) : (
          <FadeInView delay={400} style={styles.vehicleList}>
            {vehicles.map((v) => (
              <TouchableOpacity key={v.id} onPress={() => selectVehicle(v)} activeOpacity={0.7} style={styles.vehicleCard}>
                <GlassCard style={selected?.id === v.id ? styles.vehicleCardActive : styles.vehicleCardInner}>
                  <View style={styles.vehicleRow}>
                    <View style={[styles.vehicleIcon, { backgroundColor: 'rgba(0,219,231,0.08)' }]}>
                      <Car size={20} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleBrand}>{v.brand} {v.model}</Text>
                      <Text style={styles.vehicleDetail}>{v.year} · {v.fuel_type} · {v.engine_type}</Text>
                    </View>
                    <View style={styles.vehicleActions}>
                      {selected?.id === v.id && (
                        <View style={styles.selectedBadge}>
                          <CheckCircle size={14} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                        </View>
                      )}
                      <TouchableOpacity onPress={() => removeVehicle(v)} style={styles.trashButton} activeOpacity={0.7}>
                        <Trash2 size={16} color={MD3Colors.error} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </FadeInView>
        )}

        <FadeInView delay={500} style={styles.communitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.garage.community}</Text>
          </View>
          <GlassCard style={styles.communityCard}>
            <View style={styles.communityTagline}>
              <Brain size={16} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
              <Text style={styles.communityTaglineText}>
                {t.garage.communityTagline}
              </Text>
            </View>
            <View style={styles.communityStats}>
              <CommunityStatItem
                icon={Mic}
                value={communityStats?.total_analyses ?? 0}
                label={t.garage.soundsCollected}
              />
              <View style={styles.communityDivider} />
              <CommunityStatItem
                icon={Users}
                value={communityStats?.total_users ?? 0}
                label={t.garage.contributors}
              />
              <View style={styles.communityDivider} />
              <CommunityStatItem
                icon={CheckCircle}
                value={communityStats?.confirmed_diagnoses ?? 0}
                label={t.garage.confirmed}
              />
            </View>
          </GlassCard>
        </FadeInView>

        <View style={styles.spacer} />
      </ScrollView>
    </AppBackground>
  );
}

function CommunityStatItem({ icon: Icon, value, label }: { icon: typeof Car; value: number; label: string }) {
  const display = value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);
  return (
    <View style={styles.communityStatItem}>
      <Icon size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
      <Text style={styles.communityStatValue}>{display}</Text>
      <Text style={styles.communityStatLabel}>{label}</Text>
    </View>
  );
}

function StatCard({ value, label, icon: Icon }: { value: string | number; label: string; icon: typeof Car }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon size={16} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 0, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMobile,
    height: 64,
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
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 24,
    lineHeight: 28,
    color: MD3Colors.primaryFixedDim,
    letterSpacing: -0.02,
    textShadowColor: 'rgba(0,219,231,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: MD3Colors.primaryFixedDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 14,
    color: MD3Colors.onSurface,
  },
  planCard: { paddingHorizontal: Spacing.containerMobile, marginTop: Spacing.lg },
  planCardInner: { padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  planCardPremium: { borderColor: MD3Colors.primaryFixedDim },
  planContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planLabel: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant },
  planNameText: { fontFamily: 'HankenGrotesk-Bold', fontSize: 16, color: MD3Colors.onSurface },
  planNamePremium: { color: MD3Colors.primaryFixedDim },
  upgradeChip: {
    backgroundColor: MD3Colors.primaryFixedDim,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upgradeChipText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 12, color: '#FFFFFF' },
  planLimits: { marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  planLimitText: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant },
  heroSection: { alignItems: 'center', marginBottom: 24, marginTop: Spacing.lg },
  heroVehicle: { fontFamily: 'HankenGrotesk-Bold', fontSize: 22, color: MD3Colors.onSurface, marginTop: 16 },
  heroMeta: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.containerMobile, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, alignItems: 'center' },
  statIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,219,231,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontFamily: 'HankenGrotesk-Bold', fontSize: 20, color: MD3Colors.onSurface },
  statLabel: { fontFamily: 'HankenGrotesk-Regular', fontSize: 11, color: MD3Colors.onSurfaceVariant, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.containerMobile, marginBottom: 12, marginTop: 24 },
  sectionTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: MD3Colors.onSurface },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontFamily: 'HankenGrotesk-Medium', fontSize: 14, color: MD3Colors.primaryFixedDim },
  emptyCard: { padding: 24, alignItems: 'center', marginHorizontal: Spacing.containerMobile },
  emptyTitle: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 16, color: MD3Colors.onSurface, marginTop: 16 },
  emptySubtitle: { fontFamily: 'HankenGrotesk-Regular', fontSize: 13, color: MD3Colors.onSurfaceVariant, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  emptyButton: { borderRadius: 12, overflow: 'hidden' },
  emptyGradient: { paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: MD3Colors.primaryFixedDim },
  emptyButtonText: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 15, color: MD3Colors.onPrimary },
  vehicleList: { paddingHorizontal: Spacing.containerMobile, gap: 8 },
  vehicleCard: {},
  vehicleCardInner: { padding: 14 },
  vehicleCardActive: { padding: 14, borderColor: MD3Colors.primaryFixedDim, borderWidth: 1.5 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  vehicleInfo: { flex: 1 },
  vehicleBrand: { fontFamily: 'HankenGrotesk-SemiBold', fontSize: 15, color: MD3Colors.onSurface },
  vehicleDetail: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant, marginTop: 1 },
  vehicleActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectedBadge: { marginRight: 4 },
  trashButton: { padding: 4 },
  communitySection: { paddingHorizontal: Spacing.containerMobile, marginTop: 24 },
  communityCard: { padding: Spacing.md },
  communityTagline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  communityTaglineText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  communityStatValue: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 20,
    color: MD3Colors.onSurface,
    marginTop: 4,
  },
  communityStatLabel: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 11,
    color: MD3Colors.onSurfaceVariant,
  },
  communityDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  spacer: { height: 24 },
});
