import type { Href } from 'expo-router';
import type { Router } from 'expo-router';

export function navigateToVehicleHealth(router: Router, vehicleId: string): void {
  router.push(`/vehicle-health?vehicleId=${encodeURIComponent(vehicleId)}` as Href);
}
