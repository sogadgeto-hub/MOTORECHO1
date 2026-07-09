import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Modal, Animated, Pressable, ActivityIndicator,
} from 'react-native';
import { ChevronDown, Search, X, CheckCircle2 } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { getBrands, Brand } from '@/lib/db';
import { useI18n } from '@/lib/i18n';

type Props = {
  value: string;
  brandId: string | null;
  onChange: (name: string, id: string) => void;
  placeholder?: string;
  label?: string;
};

export function BrandPicker({ value, brandId, onChange, placeholder, label }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    setLoading(true);
    getBrands()
      .then(setBrands)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = query.trim()
    ? brands.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) ||
        (b.country ?? '').toLowerCase().includes(query.toLowerCase()))
    : brands;

  function openSheet() {
    setQuery('');
    setOpen(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }),
    ]).start();
  }

  function closeSheet() {
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 600, duration: 250, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  }

  function select(brand: Brand) {
    onChange(brand.name, brand.id);
    closeSheet();
  }

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={openSheet} activeOpacity={0.8}>
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {value || placeholder || t.vehicleSetup.brandPlaceholder}
        </Text>
        <ChevronDown size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>

          {/* Bottom sheet */}
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label ?? t.vehicleSetup.brand}</Text>
              <TouchableOpacity onPress={closeSheet} style={styles.closeBtn} activeOpacity={0.7}>
                <X size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <Search size={16} color={MD3Colors.onSurfaceVariant} strokeWidth={2} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder={t.vehicleSetup.brandSearch}
                placeholderTextColor={MD3Colors.onSurfaceVariant}
                autoFocus
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} activeOpacity={0.7}>
                  <X size={14} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={MD3Colors.primaryFixedDim} />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t.vehicleSetup.brandNoResults}</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = item.id === brandId || item.name === value;
                  return (
                    <TouchableOpacity
                      style={[styles.brandRow, isSelected && styles.brandRowSelected]}
                      onPress={() => select(item)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.brandInfo}>
                        <Text style={[styles.brandName, isSelected && styles.brandNameSelected]}>
                          {item.name}
                        </Text>
                        {item.country && (
                          <Text style={styles.brandCountry}>{item.country}</Text>
                        )}
                      </View>
                      {isSelected && (
                        <CheckCircle2 size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  triggerText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 16,
    color: MD3Colors.onSurface,
    flex: 1,
  },
  triggerPlaceholder: {
    color: MD3Colors.onSurfaceVariant,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0D1515',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '80%',
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetTitle: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 17,
    color: MD3Colors.onSurface,
  },
  closeBtn: {
    padding: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    color: MD3Colors.onSurface,
    paddingVertical: 12,
  },
  clearBtn: {
    padding: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    marginBottom: 4,
  },
  brandRowSelected: {
    backgroundColor: 'rgba(0,219,231,0.08)',
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 15,
    color: MD3Colors.onSurface,
  },
  brandNameSelected: {
    color: MD3Colors.primaryFixedDim,
    fontFamily: 'HankenGrotesk-SemiBold',
  },
  brandCountry: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.onSurfaceVariant,
    marginTop: 1,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
  },
});
