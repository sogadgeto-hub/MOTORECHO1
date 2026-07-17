import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  BackHandler,
  Pressable,
} from 'react-native';
import { SkeletonList } from '@/components/Skeleton';
import { ChevronDown, Search, X, CheckCircle2 } from 'lucide-react-native';
import { MD3Colors, Spacing, Radii } from '@/lib/theme';
import { getBrands, Brand } from '@/lib/db';
import { useI18n } from '@/lib/i18n';
import { brandMatchesQuery, pickPopularBrands } from '@/lib/popular-brands';

type Props = {
  value: string;
  brandId: string | null;
  onChange: (name: string, id: string) => void;
  placeholder?: string;
  label?: string;
};

type ListItem =
  | { type: 'header'; id: string; title: string }
  | { type: 'brand'; id: string; brand: Brand }
  | { type: 'seeAll'; id: string };

export function BrandPicker({ value, brandId, onChange, placeholder, label }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(600)).current;
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    getBrands()
      .then((data) => {
        setBrands(data);
        if (data.length === 0) {
          setLoadError(t.vehicleSetup.brandNoResults);
        }
      })
      .catch(() => {
        setLoadError(t.vehicleSetup.brandLoadError);
      })
      .finally(() => setLoading(false));
  }, [t.vehicleSetup.brandLoadError, t.vehicleSetup.brandNoResults]);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const filteredBrands = useMemo(() => {
    if (!isSearching) return brands;
    return brands.filter((b) => brandMatchesQuery(b, trimmedQuery));
  }, [brands, isSearching, trimmedQuery]);

  const popularBrands = useMemo(() => pickPopularBrands(brands), [brands]);

  const listItems = useMemo((): ListItem[] => {
    if (isSearching) {
      return filteredBrands.map((brand) => ({
        type: 'brand' as const,
        id: brand.id,
        brand,
      }));
    }

    if (showAllBrands) {
      return [
        { type: 'header', id: 'header-all', title: t.vehicleSetup.brandAllSection },
        ...brands.map((brand) => ({ type: 'brand' as const, id: brand.id, brand })),
      ];
    }

    return [
      { type: 'header', id: 'header-popular', title: t.vehicleSetup.brandPopularSection },
      ...popularBrands.map((brand) => ({ type: 'brand' as const, id: brand.id, brand })),
      { type: 'seeAll', id: 'see-all' },
    ];
  }, [
    brands,
    filteredBrands,
    isSearching,
    popularBrands,
    showAllBrands,
    t.vehicleSetup.brandAllSection,
    t.vehicleSetup.brandPopularSection,
  ]);

  useEffect(() => {
    if (!__DEV__ || !open) return;
    console.log('[BrandPicker]', {
      query: trimmedQuery,
      focused: searchFocused,
      keyboardOpen,
      filteredCount: filteredBrands.length,
      showAllBrands,
      listItems: listItems.length,
    });
  }, [
    open,
    trimmedQuery,
    searchFocused,
    keyboardOpen,
    filteredBrands.length,
    showAllBrands,
    listItems.length,
  ]);

  useEffect(() => {
    if (!open) return;

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false)
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [open]);

  const closeSheet = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 600, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      setQuery('');
      setShowAllBrands(false);
      setSearchFocused(false);
    });
  }, [backdropOpacity, sheetY]);

  const handleBackPress = useCallback(() => {
    if (keyboardOpen) {
      Keyboard.dismiss();
      return true;
    }
    closeSheet();
    return true;
  }, [closeSheet, keyboardOpen]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => sub.remove();
  }, [open, handleBackPress]);

  function openSheet() {
    setQuery('');
    setShowAllBrands(false);
    setOpen(true);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 12 }),
    ]).start(() => {
      requestAnimationFrame(() => searchRef.current?.focus());
    });
  }

  function select(brand: Brand) {
    Keyboard.dismiss();
    onChange(brand.name, brand.id);
    closeSheet();
  }

  function clearSearch() {
    setQuery('');
    setShowAllBrands(false);
    searchRef.current?.focus();
  }

  const sheetTitle = label ?? t.vehicleSetup.brandChooseTitle;

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={openSheet} activeOpacity={0.8}>
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {value || placeholder || t.vehicleSetup.brandPlaceholder}
        </Text>
        <ChevronDown size={18} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
      </TouchableOpacity>
      {loadError && <Text style={styles.loadErrorText}>{loadError}</Text>}

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={handleBackPress}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.modalRoot} pointerEvents="box-none">
            <Animated.View
              pointerEvents="box-none"
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={closeSheet}
                accessibilityRole="button"
                accessibilityLabel={t.common.close}
              />
            </Animated.View>

            <Animated.View
              style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
              pointerEvents="auto"
            >
              <View style={styles.handle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{sheetTitle}</Text>
                <TouchableOpacity onPress={closeSheet} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={20} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchRow}>
                <Search
                  size={16}
                  color={MD3Colors.onSurfaceVariant}
                  strokeWidth={2}
                  style={styles.searchIcon}
                />
                <TextInput
                  ref={searchRef}
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={t.vehicleSetup.brandSearch}
                  placeholderTextColor={MD3Colors.onSurfaceVariant}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  accessibilityLabel={t.vehicleSetup.brandSearch}
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={clearSearch}
                    style={styles.clearBtn}
                    activeOpacity={0.7}
                    accessibilityLabel={t.vehicleSetup.brandClearSearch}
                  >
                    <X size={14} color={MD3Colors.onSurfaceVariant} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <SkeletonList count={6} />
                </View>
              ) : (
                <FlatList
                  data={listItems}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>{t.vehicleSetup.brandNoResults}</Text>
                      {isSearching && (
                        <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
                          <Text style={styles.emptyAction}>{t.vehicleSetup.brandClearSearch}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  }
                  renderItem={({ item }) => {
                    if (item.type === 'header') {
                      return <Text style={styles.sectionHeader}>{item.title}</Text>;
                    }

                    if (item.type === 'seeAll') {
                      return (
                        <TouchableOpacity
                          style={styles.seeAllBtn}
                          onPress={() => {
                            setShowAllBrands(true);
                            searchRef.current?.focus();
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.seeAllText}>{t.vehicleSetup.brandSeeAll}</Text>
                        </TouchableOpacity>
                      );
                    }

                    const isSelected = item.brand.id === brandId || item.brand.name === value;
                    return (
                      <TouchableOpacity
                        style={[styles.brandRow, isSelected && styles.brandRowSelected]}
                        onPress={() => select(item.brand)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.brandInfo}>
                          <Text style={[styles.brandName, isSelected && styles.brandNameSelected]}>
                            {item.brand.name}
                          </Text>
                          {item.brand.country ? (
                            <Text style={styles.brandCountry}>{item.brand.country}</Text>
                          ) : null}
                        </View>
                        {isSelected ? (
                          <CheckCircle2 size={18} color={MD3Colors.primaryFixedDim} strokeWidth={2} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
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
  loadErrorText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 12,
    color: MD3Colors.error,
    marginTop: 6,
    lineHeight: 16,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 0,
  },
  sheet: {
    backgroundColor: '#0D1515',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '85%',
    minHeight: 320,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    zIndex: 1,
    elevation: 24,
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
    flex: 1,
    paddingRight: Spacing.sm,
  },
  closeBtn: {
    padding: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: MD3Colors.surfaceContainer,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    zIndex: 2,
    elevation: 2,
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
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 16,
  },
  sectionHeader: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 13,
    color: MD3Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  seeAllBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0,219,231,0.25)',
    backgroundColor: 'rgba(0,219,231,0.06)',
    alignItems: 'center',
  },
  seeAllText: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 15,
    color: MD3Colors.primaryFixedDim,
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
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 14,
    color: MD3Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyAction: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 14,
    color: MD3Colors.primaryFixedDim,
  },
});
