import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppBackground } from '@/components/AppBackground';
import { VehicleHealthDashboard } from '@/components/VehicleHealthDashboard';
import { MD3Colors, Spacing } from '@/lib/theme';
import { getVehicle, Vehicle } from '@/lib/db';
import { getDiagnosticsForVehicle } from '@/lib/analyzer';
import {
  buildVehicleHealthDashboard,
  mapDiagnosticsToHealthInputs,
  upsertHealthSnapshot,
  type VehicleHealthDashboardData,
} from '@/lib/vehicle-health';
import { useI18n } from '@/lib/i18n';

export default function VehicleHealthScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { vehicleId } = useLocalSearchParams<{ vehicleId?: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [dashboard, setDashboard] = useState<VehicleHealthDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!vehicleId) {
      setError(t.vehicleHealth.vehicleNotFound);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [vehicleData, records] = await Promise.all([
        getVehicle(vehicleId),
        getDiagnosticsForVehicle(vehicleId),
      ]);

      if (!vehicleData) {
        setError(t.vehicleHealth.vehicleNotFound);
        setVehicle(null);
        setDashboard(null);
        return;
      }

      const inputs = mapDiagnosticsToHealthInputs(records);
      const dashboardData = buildVehicleHealthDashboard(inputs);

      setVehicle(vehicleData);
      setDashboard(dashboardData);

      if (records.length > 0) {
        upsertHealthSnapshot({
          vehicleId: vehicleData.id,
          analysisId: records[0]?.id ?? null,
          score: dashboardData.score.score,
          healthLevel: dashboardData.score.level.id,
        }).catch(() => {});
      }
    } catch {
      setError(t.vehicleHealth.loadError);
      setVehicle(null);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, t.vehicleHealth.loadError, t.vehicleHealth.vehicleNotFound]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={MD3Colors.primaryFixedDim} />
        </View>
      </AppBackground>
    );
  }

  if (error || !vehicle || !dashboard) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error ?? t.vehicleHealth.vehicleNotFound}</Text>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <VehicleHealthDashboard
        vehicle={vehicle}
        dashboard={dashboard}
        loading={loading}
        onRefresh={load}
        onBack={() => router.back()}
        onAnalyze={() => router.push('/recording')}
      />
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 16,
    color: MD3Colors.error,
    textAlign: 'center',
  },
});
