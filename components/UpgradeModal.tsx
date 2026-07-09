import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Crown, Building2, Sparkles } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';

type UpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  currentPlan: 'free' | 'premium' | 'garage';
  upgradeTo: 'premium' | 'garage';
  reason: string;
  onUpgrade: () => void;
};

export function UpgradeModal({ visible, onClose, currentPlan, upgradeTo, reason, onUpgrade }: UpgradeModalProps) {
  const { t } = useI18n();
  const isPremium = upgradeTo === 'premium';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isPremium && styles.modalContentPremium, !isPremium && styles.modalContentGarage]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
            </TouchableOpacity>

            <View style={[styles.iconBadge, isPremium && styles.iconBadgePremium, !isPremium && styles.iconBadgeGarage]}>
              {isPremium ? (
                <Crown size={32} color="#FFFFFF" strokeWidth={1.5} />
              ) : (
                <Building2 size={32} color="#FFFFFF" strokeWidth={1.5} />
              )}
            </View>

            <Text style={styles.title}>{t.premium.upgradeModal.title.replace('{{plan}}', isPremium ? t.premium.plans.premium.name : t.premium.plans.garage.name)}</Text>
            <Text style={styles.subtitle}>{reason}</Text>

            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>{t.premium.upgradeModal.unlock}</Text>
              {isPremium ? (
                <>
                  <BenefitRow text={t.premium.plans.premium.features.vehicles} />
                  <BenefitRow text={t.premium.plans.premium.features.analyses} />
                  <BenefitRow text={t.premium.plans.premium.features.diagnostic} />
                  <BenefitRow text={`${t.premium.plans.premium.features.pdfExport} & ${t.premium.plans.premium.features.history}`} />
                  <BenefitRow text={t.premium.plans.premium.features.alerts} />
                </>
              ) : (
                <>
                  <BenefitRow text={t.premium.plans.garage.features.vehicles} />
                  <BenefitRow text={t.premium.plans.garage.features.fleetManagement} />
                  <BenefitRow text={t.premium.plans.garage.features.dashboard} />
                  <BenefitRow text={t.premium.plans.garage.features.support} />
                  <BenefitRow text={t.premium.plans.garage.features.business} />
                </>
              )}
            </View>

            <View style={styles.pricingSection}>
              <Text style={styles.price}>
                {isPremium ? '2.99' : '49'}
                <Text style={styles.priceCurrency}>€</Text>
              </Text>
              <Text style={styles.pricePeriod}>{t.premium.perMonth}</Text>
              {isPremium && (
                <Text style={styles.yearlyPrice}>{t.premium.yearlyPrice}</Text>
              )}
            </View>

            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade} activeOpacity={0.85}>
              {isPremium ? (
                <LinearGradient colors={[MD3Colors.primaryFixedDim, MD3Colors.primaryFixed]} style={styles.upgradeGradient}>
                  <Sparkles size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.upgradeText}>{t.premium.upgradeModal.upgradeButton.replace('{{plan}}', t.premium.plans.premium.name)}</Text>
                </LinearGradient>
              ) : (
                <LinearGradient colors={[MD3Colors.tertiaryFixedDim, MD3Colors.tertiaryFixed]} style={styles.upgradeGradient}>
                  <Building2 size={18} color={MD3Colors.onTertiary} strokeWidth={2} />
                  <Text style={[styles.upgradeText, { color: MD3Colors.onTertiary }]}>{t.premium.upgradeModal.upgradeButton.replace('{{plan}}', t.premium.plans.garage.name)}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.skipText}>{t.premium.upgradeModal.maybeLater}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitDot}>
        <Text style={styles.benefitDotText}>✓</Text>
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
  },
  modalContent: {
    backgroundColor: MD3Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalContentPremium: {
    borderWidth: 1,
    borderColor: MD3Colors.primaryFixedDim,
    shadowColor: MD3Colors.primaryFixedDim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  modalContentGarage: {
    borderWidth: 1,
    borderColor: MD3Colors.tertiaryFixedDim,
    shadowColor: MD3Colors.tertiaryFixedDim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: 4,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  iconBadgePremium: {
    backgroundColor: MD3Colors.primaryFixedDim,
  },
  iconBadgeGarage: {
    backgroundColor: MD3Colors.tertiaryFixedDim,
  },
  title: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 24,
    color: MD3Colors.onSurface,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  benefitsSection: {
    alignSelf: 'stretch',
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  benefitsTitle: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  benefitDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: MD3Colors.primaryFixedDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  benefitText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
  pricingSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  price: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 42,
    color: MD3Colors.onSurface,
  },
  priceCurrency: {
    fontSize: 24,
    fontWeight: '600',
  },
  pricePeriod: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    marginTop: -4,
  },
  yearlyPrice: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    marginTop: Spacing.xs,
  },
  upgradeButton: {
    alignSelf: 'stretch',
    borderRadius: Radii.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
  },
  upgradeText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
});
