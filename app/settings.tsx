import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FadeInView } from '@/components/FadeInView';
import {
  ChevronRight,
  User,
  Lock,
  CreditCard,
  Bell,
  Mail,
  FileText,
  Shield,
  Globe,
  ArrowLeft,
  Brain,
  Bug,
} from 'lucide-react-native';
import { AppBackground } from '@/components/AppBackground';
import { GlassCard } from '@/components/GlassCard';
import { MD3Colors, Spacing } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { formatPlanLabel } from '@/lib/plan-access';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { useI18n } from '@/lib/i18n';
import { isBetaDiagnosticsEnabled } from '@/lib/beta-diagnostics';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut, updateAllowAiTraining } = useAuth();
  const { plan, loading: planLoading } = useSubscriptionAccess(profile?.id);
  const { t, language, setLanguage, availableLanguages } = useI18n();
  const [pushAlerts, setPushAlerts] = useState(true);
  const [emailSummaries, setEmailSummaries] = useState(false);
  const [savingAiPref, setSavingAiPref] = useState(false);

  async function handleAiTrainingToggle() {
    if (savingAiPref) return;
    setSavingAiPref(true);
    await updateAllowAiTraining(!(profile?.allow_ai_training ?? false));
    setSavingAiPref(false);
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={24} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.settings.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Language Section */}
        <FadeInView delay={100}>
          <SectionTitle>{t.settings.language.title}</SectionTitle>
          <GlassCard style={styles.groupCard}>
            {availableLanguages.map((lang, i) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.groupRow,
                  i < availableLanguages.length - 1 && styles.groupRowBorder,
                ]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <View style={styles.groupRowLeft}>
                  {i === 0 && <Globe size={20} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} style={styles.langIcon} />}
                  {!i && <View style={styles.langIconPlaceholder} />}
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={styles.groupRowLabel}>{lang.name}</Text>
                </View>
                {language === lang.code && (
                  <View style={styles.checkDot} />
                )}
              </TouchableOpacity>
            ))}
          </GlassCard>
        </FadeInView>

        {/* Account Section */}
        <FadeInView delay={200}>
          <SectionTitle>{t.settings.account.title}</SectionTitle>
          <GlassCard style={styles.groupCard}>
            <TouchableOpacity style={[styles.groupRow, styles.groupRowBorder]} activeOpacity={0.7}>
              <View style={styles.groupRowLeft}>
                <User size={20} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
                <View>
                  <Text style={styles.groupRowLabel}>{profile?.first_name ?? 'User'} {profile?.last_name ?? ''}</Text>
                  <Text style={styles.groupRowSublabel}>{profile?.email ?? ''}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.groupRow, styles.groupRowBorder]} activeOpacity={0.7}>
              <View style={styles.groupRowLeft}>
                <Lock size={20} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
                <Text style={styles.groupRowLabel}>Security</Text>
              </View>
              <ChevronRight size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.groupRow} onPress={() => router.push('/premium')} activeOpacity={0.7}>
              <View style={styles.groupRowLeft}>
                <CreditCard size={20} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
                <Text style={styles.groupRowLabel}>{t.settings.subscription.manage}</Text>
              </View>
              <View style={styles.planChip}>
                <Text style={styles.planChipText}>
                  {planLoading ? '…' : formatPlanLabel(plan).toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        </FadeInView>

        {/* Notification Preferences */}
        <FadeInView delay={300}>
          <SectionTitle>{t.common.info}</SectionTitle>
          <GlassCard style={styles.groupCard}>
            <View style={[styles.groupRow, styles.groupRowBorder]}>
              <View style={styles.groupRowLeft}>
                <Bell size={20} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
                <Text style={styles.groupRowLabel}>Push Alerts</Text>
              </View>
              <ToggleSwitch value={pushAlerts} onValueChange={setPushAlerts} />
            </View>
            <View style={styles.groupRow}>
              <View style={styles.groupRowLeft}>
                <Mail size={20} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
                <Text style={styles.groupRowLabel}>Email Summaries</Text>
              </View>
              <ToggleSwitch value={emailSummaries} onValueChange={setEmailSummaries} />
            </View>
          </GlassCard>
        </FadeInView>

        {/* Privacy */}
        <FadeInView delay={350}>
          <SectionTitle>{t.settings.privacy.title}</SectionTitle>
          <GlassCard style={styles.groupCard}>
            <View style={styles.privacyBlock}>
              <View style={styles.privacyHeader}>
                <Brain size={20} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
                <Text style={styles.privacyTitle}>{t.settings.privacy.improveTitle}</Text>
              </View>
              <View style={styles.privacyRow}>
                <View style={styles.privacyTextWrap}>
                  <Text style={styles.groupRowLabel}>{t.settings.privacy.aiTrainingLabel}</Text>
                  <Text style={styles.privacyDescription}>{t.settings.privacy.aiTrainingDescription}</Text>
                </View>
                <ToggleSwitch
                  value={profile?.allow_ai_training ?? false}
                  onValueChange={handleAiTrainingToggle}
                />
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        {/* Legal */}
        <FadeInView delay={400}>
          <SectionTitle>{t.settings.about.title}</SectionTitle>
          <GlassCard style={styles.groupCard}>
            {isBetaDiagnosticsEnabled() ? (
              <TouchableOpacity
                style={[styles.groupRow, styles.groupRowBorder]}
                onPress={() => router.push('/beta-diagnostics' as never)}
                activeOpacity={0.7}
              >
                <View style={styles.groupRowLeft}>
                  <Bug size={20} color={MD3Colors.primaryFixedDim} strokeWidth={1.5} />
                  <Text style={styles.groupRowLabel}>Beta diagnostics</Text>
                </View>
                <ChevronRight size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.groupRow, styles.groupRowBorder]} activeOpacity={0.7}>
              <View style={styles.groupRowLeft}>
                <FileText size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={1.5} />
                <Text style={styles.groupRowLabel}>{t.settings.about.terms}</Text>
              </View>
              <ChevronRight size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.groupRow} activeOpacity={0.7}>
              <View style={styles.groupRowLeft}>
                <Shield size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={1.5} />
                <Text style={styles.groupRowLabel}>{t.settings.about.privacy}</Text>
              </View>
              <ChevronRight size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            </TouchableOpacity>
          </GlassCard>
        </FadeInView>

        {/* Actions */}
        <FadeInView delay={500} style={styles.actionsSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.7}>
            <Text style={styles.logoutText}>{t.settings.logout}</Text>
          </TouchableOpacity>
          <View style={styles.versionWrap}>
            <Text style={styles.versionText}>{t.settings.about.version} 2.4.0</Text>
          </View>
        </FadeInView>

        <View style={styles.spacer} />
      </ScrollView>
    </AppBackground>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle}>{children}</Text>
  );
}

function ToggleSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[
        styles.toggleTrack,
        value ? styles.toggleTrackActive : styles.toggleTrackInactive,
      ]}
      activeOpacity={0.9}
    >
      <View
        style={[
          styles.toggleThumb,
          value ? styles.toggleThumbActive : styles.toggleThumbInactive,
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 56, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.containerMobile,
    marginBottom: Spacing.lg,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 24,
    color: MD3Colors.onSurface,
  },
  headerSpacer: { width: 40 },

  sectionTitle: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: Spacing.containerMobile,
    marginBottom: 8,
    marginTop: Spacing.lg,
  },

  groupCard: { marginHorizontal: Spacing.containerMobile, overflow: 'hidden' },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  groupRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  groupRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupRowLabel: { fontFamily: 'HankenGrotesk-Regular', fontSize: 16, color: MD3Colors.onSurface },
  groupRowSublabel: { fontFamily: 'HankenGrotesk-Regular', fontSize: 12, color: MD3Colors.onSurfaceVariant, marginTop: 2 },

  privacyBlock: { paddingHorizontal: 16, paddingVertical: 14 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  privacyTitle: {
    flex: 1,
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: MD3Colors.onSurface,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  privacyTextWrap: { flex: 1 },
  privacyDescription: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 17,
  },

  langIcon: { marginRight: -8 },
  langIconPlaceholder: { width: 20, marginRight: -8 },
  langFlag: { fontSize: 18 },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MD3Colors.primaryFixedDim,
  },

  planChip: {
    backgroundColor: 'rgba(0,219,231,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planChipText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 11,
    color: MD3Colors.primaryFixedDim,
    letterSpacing: 0.5,
  },

  // Toggle
  toggleTrack: { width: 40, height: 20, borderRadius: 10, position: 'relative' },
  toggleTrackActive: {
    backgroundColor: 'rgba(0,242,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.3)',
  },
  toggleTrackInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, position: 'absolute', top: 1 },
  toggleThumbActive: {
    right: 2,
    backgroundColor: MD3Colors.primaryFixedDim,
    shadowColor: MD3Colors.primaryFixedDim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  toggleThumbInactive: { left: 2, backgroundColor: 'rgba(185,202,203,0.4)' },

  actionsSection: { marginTop: Spacing.xl, marginHorizontal: Spacing.containerMobile, alignItems: 'center' },
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.2)',
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 14,
    color: MD3Colors.error,
  },
  versionWrap: { marginTop: Spacing.lg, alignItems: 'center' },
  versionText: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    opacity: 0.4,
  },
  spacer: { height: 40 },
});
