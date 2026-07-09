import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ThumbsUp, ThumbsDown, HelpCircle, Brain, Wrench } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { updateDiagnosticFeedback } from '@/lib/analyzer';
import { useI18n } from '@/lib/i18n';

type FeedbackStep = 'confirmation' | 'garage_diagnosis' | 'ai_consent' | 'done';

type DiagnosisFeedbackModalProps = {
  visible: boolean;
  recordId: string;
  onClose: () => void;
};

export function DiagnosisFeedbackModal({ visible, recordId, onClose }: DiagnosisFeedbackModalProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<FeedbackStep>('confirmation');
  const [userConfirmed, setUserConfirmed] = useState<'yes' | 'no' | 'unknown' | null>(null);
  const [garageDiagnosis, setGarageDiagnosis] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const garageOptions = [
    { key: 'turbo_issue', label: t.feedback.issues.turbo_issue },
    { key: 'injector_noise', label: t.feedback.issues.injector_noise },
    { key: 'timing_chain_noise', label: t.feedback.issues.timing_chain_noise },
    { key: 'engine_knocking', label: t.feedback.issues.engine_knocking },
    { key: 'idle_instability', label: t.feedback.issues.idle_instability },
    { key: 'no_issue', label: t.feedback.issues.no_issue },
    { key: 'other', label: t.feedback.issues.other },
  ];

  async function handleConfirmation(answer: 'yes' | 'no' | 'unknown') {
    setUserConfirmed(answer);
    if (answer === 'yes') {
      setStep('garage_diagnosis');
    } else {
      setStep('ai_consent');
    }
  }

  async function handleGarageDiagnosis(diagnosis: string) {
    setGarageDiagnosis(diagnosis);
    setStep('ai_consent');
  }

  async function handleAiConsent(consent: boolean) {
    if (!recordId) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await updateDiagnosticFeedback(recordId, {
        user_confirmed: userConfirmed ?? 'unknown',
        garage_diagnosis: garageDiagnosis,
        allow_ai_training: consent,
      });
    } catch {}
    setSaving(false);
    setStep('done');
    setTimeout(onClose, 1200);
  }

  function handleClose() {
    setStep('confirmation');
    setUserConfirmed(null);
    setGarageDiagnosis(null);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <X size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
          </TouchableOpacity>

          {step === 'confirmation' && (
            <View style={styles.stepContent}>
              <View style={styles.iconBadge}>
                <ThumbsUp size={28} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
              </View>
              <Text style={styles.stepTitle}>{t.feedback.wasCorrect}</Text>
              <Text style={styles.stepSubtitle}>{t.feedback.helpUsImprove}</Text>
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={[styles.optionBtn, styles.optionYes]}
                  onPress={() => handleConfirmation('yes')}
                  activeOpacity={0.85}
                >
                  <ThumbsUp size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.optionBtnText}>{t.common.yes}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionBtn, styles.optionNo]}
                  onPress={() => handleConfirmation('no')}
                  activeOpacity={0.85}
                >
                  <ThumbsDown size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.optionBtnText}>{t.common.no}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionBtn, styles.optionUnknown]}
                  onPress={() => handleConfirmation('unknown')}
                  activeOpacity={0.85}
                >
                  <HelpCircle size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
                  <Text style={[styles.optionBtnText, { color: MD3Colors.onSurfaceVariant }]}>{t.common.iDontKnow}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'garage_diagnosis' && (
            <View style={styles.stepContent}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(232,196,35,0.1)' }]}>
                <Wrench size={28} color={MD3Colors.tertiaryFixedDim} strokeWidth={1.5} />
              </View>
              <Text style={styles.stepTitle}>{t.feedback.actualDiagnosis}</Text>
              <Text style={styles.stepSubtitle}>{t.feedback.selectIssue}</Text>
              <ScrollView style={styles.garageList} showsVerticalScrollIndicator={false}>
                {garageOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.garageOption, garageDiagnosis === opt.key && styles.garageOptionSelected]}
                    onPress={() => handleGarageDiagnosis(opt.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.garageOptionText, garageDiagnosis === opt.key && styles.garageOptionTextSelected]}>
                      {opt.label}
                    </Text>
                    {garageDiagnosis === opt.key && <View style={styles.selectedDot} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {step === 'ai_consent' && (
            <View style={styles.stepContent}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(0,219,231,0.08)' }]}>
                <Brain size={28} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
              </View>
              <Text style={styles.stepTitle}>{t.feedback.helpImproveAI}</Text>
              <Text style={styles.stepSubtitle}>
                {t.feedback.consentQuestion}
              </Text>
              <View style={styles.consentNote}>
                <Text style={styles.consentNoteText}>
                  {t.feedback.consentNote}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.consentYes}
                onPress={() => handleAiConsent(true)}
                disabled={saving}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.consentGradient}
                >
                  <Text style={styles.consentYesText}>{saving ? t.common.saving : t.feedback.yesAuthorize}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.consentNo}
                onPress={() => handleAiConsent(false)}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.consentNoText}>{t.feedback.keepPrivate}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'done' && (
            <View style={[styles.stepContent, { alignItems: 'center', paddingVertical: 40 }]}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(0,219,231,0.1)' }]}>
                <ThumbsUp size={32} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
              </View>
              <Text style={styles.stepTitle}>{t.feedback.thankYou}</Text>
              <Text style={styles.stepSubtitle}>{t.feedback.feedbackHelps}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MD3Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 360,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4,
    zIndex: 10,
  },
  stepContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,219,231,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 22,
    color: MD3Colors.onSurface,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  optionsRow: {
    gap: Spacing.sm,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: Radii.md,
    marginBottom: 4,
  },
  optionYes: {
    backgroundColor: MD3Colors.primaryFixedDim,
  },
  optionNo: {
    backgroundColor: MD3Colors.error,
  },
  optionUnknown: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionBtnText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  garageList: {
    maxHeight: 280,
  },
  garageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: MD3Colors.surfaceContainer,
    marginBottom: 8,
  },
  garageOptionSelected: {
    borderColor: MD3Colors.primaryFixedDim,
    backgroundColor: 'rgba(0,219,231,0.06)',
  },
  garageOptionText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurfaceVariant,
  },
  garageOptionTextSelected: {
    fontFamily: 'HankenGrotesk-SemiBold',
    color: MD3Colors.primaryFixedDim,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MD3Colors.primaryFixedDim,
  },
  consentNote: {
    backgroundColor: 'rgba(0,219,231,0.06)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.12)',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  consentNoteText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  consentYes: {
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  consentGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentYesText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  consentNo: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  consentNoText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
});
