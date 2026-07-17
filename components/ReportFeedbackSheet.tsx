import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ThumbsUp, ThumbsDown, HelpCircle, X } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { updateDiagnosticFeedback } from '@/lib/analyzer';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

type ReportFeedbackSheetProps = {
  visible: boolean;
  recordId: string;
  onComplete: () => void;
  onSkip: () => void;
};

export function ReportFeedbackSheet({
  visible,
  recordId,
  onComplete,
  onSkip,
}: ReportFeedbackSheetProps) {
  const { t } = useI18n();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);

  async function submit(answer: 'yes' | 'no' | 'unknown') {
    if (!recordId || saving) {
      onComplete();
      return;
    }

    setSaving(true);
    try {
      await updateDiagnosticFeedback(recordId, {
        user_confirmed: answer,
        allow_ai_training: profile?.allow_ai_training ?? false,
      });
    } catch {
      // Ne pas bloquer le retour accueil
    } finally {
      setSaving(false);
      onComplete();
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onSkip}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeBtn} onPress={onSkip} activeOpacity={0.7}>
            <X size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
          </TouchableOpacity>

          <Text style={styles.title}>{t.feedback.exitTitle}</Text>
          <Text style={styles.subtitle}>{t.feedback.exitSubtitle}</Text>

          <View style={styles.options}>
            <TouchableOpacity
              style={[styles.optionBtn, styles.optionYes]}
              onPress={() => submit('yes')}
              disabled={saving}
              activeOpacity={0.85}
            >
              <ThumbsUp size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.optionText}>{t.common.yes}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionBtn, styles.optionNo]}
              onPress={() => submit('no')}
              disabled={saving}
              activeOpacity={0.85}
            >
              <ThumbsDown size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.optionText}>{t.common.no}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionBtn, styles.optionUnknown]}
              onPress={() => submit('unknown')}
              disabled={saving}
              activeOpacity={0.85}
            >
              <HelpCircle size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
              <Text style={[styles.optionText, styles.optionTextMuted]}>{t.common.iDontKnow}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} disabled={saving} activeOpacity={0.7}>
            <Text style={styles.skipText}>{t.feedback.skipForNow}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MD3Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  title: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 22,
    color: MD3Colors.onSurface,
    marginBottom: Spacing.xs,
    paddingRight: 32,
  },
  subtitle: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  options: { gap: Spacing.sm },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: Radii.md,
  },
  optionYes: { backgroundColor: MD3Colors.primaryFixedDim },
  optionNo: { backgroundColor: MD3Colors.error },
  optionUnknown: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  optionText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  optionTextMuted: { color: MD3Colors.onSurfaceVariant },
  skipBtn: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
});
