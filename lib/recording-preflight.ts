import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { requestMicPermission } from './recording-permissions';

export type RecordingPreflightResult = {
  micGranted: boolean;
  micBlocked: boolean;
  batteryLow: boolean;
  bluetoothConnected: boolean;
  canProceed: boolean;
};

const LOW_BATTERY_THRESHOLD = 0.15;

export async function runRecordingPreflight(): Promise<RecordingPreflightResult> {
  const micStatus = await requestMicPermission();
  const micGranted = micStatus === 'granted';
  const micBlocked = micStatus === 'blocked';
  const batteryLow = await isBatteryLow();
  const bluetoothConnected = micGranted ? await detectExternalAudioInput() : false;

  return {
    micGranted,
    micBlocked,
    batteryLow,
    bluetoothConnected,
    canProceed: micGranted,
  };
}

async function isBatteryLow(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const Battery = await import('expo-battery');
    const level = await Battery.getBatteryLevelAsync();
    const state = await Battery.getBatteryStateAsync();
    const charging =
      state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;

    if (level < 0 || Number.isNaN(level)) return false;
    return level < LOW_BATTERY_THRESHOLD && !charging;
  } catch {
    return false;
  }
}

async function detectExternalAudioInput(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  let recording: Audio.Recording | null = null;

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const created = await Audio.Recording.createAsync({
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });

    recording = created.recording;
    const samples: number[] = [];

    for (let index = 0; index < 5; index += 1) {
      await delay(90);
      const status = await recording.getStatusAsync();
      if (typeof status.metering === 'number') {
        samples.push(status.metering);
      }
    }

    await recording.stopAndUnloadAsync();
    recording = null;

    if (samples.length < 3) return false;

    const average = samples.reduce((acc, value) => acc + value, 0) / samples.length;
    const spread = Math.max(...samples) - Math.min(...samples);

    return average > -42 && spread < 4;
  } catch {
    return false;
  } finally {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // ignore cleanup errors
      }
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
