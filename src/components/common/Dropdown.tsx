import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';

interface DropdownItem {
  label: string;
  value: string | number;
  color?: string;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedValue?: string | number;
  onSelect: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Force the in-sheet search box on/off. Defaults to auto (on when > 8 items). */
  searchable?: boolean;
  style?: any;
}

const Dropdown: React.FC<DropdownProps> = ({
  items,
  selectedValue,
  onSelect,
  placeholder = 'Select...',
  disabled = false,
  searchable,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const selectedItem = items.find(item => item.value === selectedValue);
  const hasSelection = !!selectedItem && selectedValue !== '' && selectedValue !== undefined;
  const selectedLabel = hasSelection ? selectedItem!.label : placeholder;

  const showSearch = searchable ?? items.length > 8;

  const filteredItems = useMemo(() => {
    if (!showSearch || !query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(q));
  }, [items, query, showSearch]);

  const open = () => {
    if (disabled) return;
    setQuery('');
    setVisible(true);
  };

  const close = () => setVisible(false);

  const handleSelect = (item: DropdownItem) => {
    if (item.value !== undefined) {
      onSelect(item.value);
    }
    close();
  };

  return (
    <View style={style}>
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: visible }}
        accessibilityLabel={`${placeholder}. ${hasSelection ? `Selected ${selectedItem!.label}` : 'No selection'}`}
        style={[
          styles.trigger,
          hasSelection && styles.triggerActive,
          disabled && styles.disabled,
          selectedItem?.color ? { borderColor: selectedItem.color + '55' } : {},
        ]}
        onPress={open}
        disabled={disabled}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.selectedText,
            !hasSelection && styles.placeholderText,
            selectedItem?.color ? { color: selectedItem.color, fontWeight: '700' } : {},
          ]}
        >
          {selectedLabel}
        </Text>
        <Icon
          name="chevron-down"
          size={18}
          color={selectedItem?.color || (hasSelection ? Colors.text : Colors.textLight)}
        />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={[styles.modal, { paddingBottom: insets.bottom + 12 }]} onPress={() => {}}>
            <View style={styles.grabber} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{placeholder}</Text>
              <TouchableOpacity onPress={close} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="x" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {showSearch && (
              <View style={styles.searchBox}>
                <Icon name="search" size={16} color={Colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor={Colors.textLight}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="x-circle" size={16} color={Colors.textLight} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <FlatList
              data={filteredItems}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item, index) => {
                const val = item.value?.toString() || index.toString();
                return `dropdown-item-${val}`;
              }}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Icon name="inbox" size={28} color={Colors.textLight} />
                  <Text style={styles.emptyText}>
                    {query ? 'No matches found' : 'No options available'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isActive = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    style={[styles.item, isActive && styles.itemActive]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.itemLeft}>
                      {item.color && (
                        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      )}
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.itemText,
                          isActive && styles.itemTextActive,
                          item.color ? { color: item.color, fontWeight: '700' } : {},
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {isActive && (
                      <Icon name="check" size={20} color={item.color || Colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.listContent}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 150,
  },
  triggerActive: {
    borderColor: Colors.borderStrong,
  },
  disabled: { opacity: 0.5, backgroundColor: Colors.background },
  selectedText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    marginRight: 8,
  },
  placeholderText: {
    color: Colors.textLight,
    fontWeight: '400',
  },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '75%',
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderStrong,
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text, marginRight: 12 },
  closeButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    padding: 0,
  },

  emptyList: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  emptyText: { color: Colors.textLight, fontSize: 14, fontWeight: '500' },
  listContent: { paddingBottom: 8 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  itemActive: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  itemText: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  itemTextActive: { color: Colors.primary, fontWeight: '700' },
});

export default Dropdown;
