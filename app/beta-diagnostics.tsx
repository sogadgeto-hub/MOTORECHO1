import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Copy } from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { GlassCard } from '@/components/GlassCard';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import {
  getAppVersionLabel,
  getBuildLabel,
  isBetaDiagnosticsEnabled,
  probeNetworkReachability,
} from '@/lib/beta-diagnostics';
import { buildTechnicalReport, getBetaLogEntries, getLastBetaLogEntry } from '@/lib/beta-logger';
import { getBetaSessionSnapshot } from '@/lib/beta-session-snapshot';
import { getMicPermissionStatus } from '@/lib/recording-permissions';
import { getPrimaryVehicle } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { formatPlanLabel } from '@/lib/plan-access';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  );
}

export default function BetaDiagnosticsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plan, loading: planLoading, subscription } = useSubscriptionAccess(user?.id);
  const [micStatus, setMicStatus] = useState<string>('…');
  const [networkStatus, setNetworkStatus] = useState<string>('…');
  const [vehicleId, setVehicleId] = useState<string>('…');
  const [refreshKey, setRefreshKey] = useState(0);

  const enabled = isBetaDiagnosticsEnabled();
  const session = getBetaSessionSnapshot();
  const lastError = getLastBetaLogEntry();

  useEffect(() => {
    if (!enabled) return;

    void getMicPermissionStatus().then((status) => setMicStatus(status));
    void getPrimaryVehicle()
      .then((vehicle) => setVehicleId(vehicle?.id ?? 'none'))
      .catch(() => setVehicleId('error'));
    void probeNetworkReachability(process.env.EXPO_PUBLIC_SUPABASE_URL).then((status) =>
      setNetworkStatus(status)
    );
  }, [enabled, refreshKey]);

  const copyReport = useCallback(async () => {
    const report = buildTechnicalReport({
      appVersion: getAppVersionLabel(),
      build: getBuildLabel(),
      platform: Platform.OS,
      osVersion: String(Platform.Version),
      micPermission: micStatus,
      network: networkStatus,
      subscriptionPlan: planLoading ? 'loading' : formatPlanLabel(plan),
      subscriptionActive: subscription.status,
      vehicleId,
      recordingPhase: session.recordingPhase,
      audioDurationMs: session.durationMs,
      qualityScore: session.qualityScore,
      lastErrorCategory: lastError?.category ?? 'none',
      lastErrorMessage: lastError?.message ?? 'none',
    });

    try {
      await Share.share({ message: report, title: 'MotorEcho Technical Report' });
    } catch {
      Alert.alert('Share failed', 'Unable to open the share sheet.');
    }
  }, [lastError, micStatus, networkStatus, plan, planLoading, session, subscription.status, vehicleId]);

  if (!enabled) {
    return (
      <AppBackground>
        <View style={styles.blocked}>
          <Text style={styles.blockedTitle}>Beta diagnostics unavailable</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </AppBackground>
    );
  }

  const logPreview = getBetaLogEntries()
    .slice(0, 8)
    .map((entry) => `[${entry.category}] ${entry.message}`)
    .join('\n');

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Beta diagnostics</Text>
          <TouchableOpacity onPress={() => setRefreshKey((k) => k + 1)} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Environment</Text>
          <InfoRow label="App version" value={getAppVersionLabel()} />
          <InfoRow label="Build" value={getBuildLabel()} />
          <InfoRow label="Platform" value={Platform.OS} />
          <InfoRow label="OS version" value={String(Platform.Version)} />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Runtime</Text>
          <InfoRow label="Microphone" value={micStatus} />
          <InfoRow label="Network" value={networkStatus} />
          <InfoRow
            label="Subscription"
            value={planLoading ? 'loading…' : `${formatPlanLabel(plan)} (${subscription.status})`}
          />
          <InfoRow label="Vehicle ID" value={vehicleId} />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Recording session</Text>
          <InfoRow label="Phase" value={session.recordingPhase} />
          <InfoRow label="Duration (ms)" value={session.durationMs != null ? String(session.durationMs) : 'n/a'} />
          <InfoRow
            label="Quality score"
            value={session.qualityScore != null ? String(session.qualityScore) : 'n/a'}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Last error</Text>
          {lastError ? (
            <>
              <InfoRow label="Category" value={lastError.category} />
              <InfoRow label="Message" value={lastError.message} />
              {lastError.technicalCode ? (
                <InfoRow label="Code" value={lastError.technicalCode} />
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyText}>No errors logged in this session.</Text>
          )}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Recent events</Text>
          <Text style={styles.logPreview}>{logPreview || '(empty)'}</Text>
        </GlassCard>

        <TouchableOpacity style={styles.copyBtn} onPress={() => void copyReport()} activeOpacity={0.85}>
          <Copy size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
          <Text style={styles.copyBtnText}>Copy technical report</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerBack: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: MD3Colors.onSurface,
  },
  refreshBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  refreshText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: MD3Colors.primaryFixedDim,
  },
  card: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
    marginBottom: Spacing.xs,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
  },
  rowValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: MD3Colors.onSurface,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
  },
  logPreview: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: MD3Colors.primaryFixedDim,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  copyBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
  blocked: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  blockedTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: MD3Colors.onSurface,
    textAlign: 'center',
  },
  backBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  backBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
});
