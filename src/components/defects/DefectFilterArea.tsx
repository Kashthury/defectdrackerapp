import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import Dropdown from '../common/Dropdown';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FilterAreaProps {
  filters: any;
  setFilters: (filters: any) => void;
  options: {
    modules: any[];
    defectTypes: any[];
    severities: any[];
    priorities: any[];
    releases: any[];
    statuses: any[];
    developers: any[];
  };
  subModules: any[];
  subModulesLoading?: boolean;
  onClear: () => void;
}

export const DefectFilterArea: React.FC<FilterAreaProps> = ({
  filters,
  setFilters,
  options,
  subModules,
  subModulesLoading = false,
  onClear,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const updateFilter = (key: string, value: any) => {
    if (key === 'moduleId') {
      setFilters({ ...filters, [key]: value, subModuleId: '' });
    } else {
      setFilters({ ...filters, [key]: value });
    }
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== '' && v !== undefined && v !== null,
  );

  const FilterItem = ({ label, placeholder, keyName, items, disabled = false }: any) => (
    <View style={styles.filterItem}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Dropdown
        items={[{ label: 'All', value: '' }, ...items]}
        selectedValue={filters[keyName]}
        onSelect={(val) => updateFilter(keyName, val)}
        placeholder={placeholder}
        disabled={disabled}
        style={styles.dropdown}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search description..."
            placeholderTextColor={Colors.textLight}
            value={filters.searchTerm}
            onChangeText={(text) => updateFilter('searchTerm', text)}
          />
        </View>
        <TouchableOpacity style={styles.filterToggle} onPress={toggleExpand}>
          <View style={[styles.iconBadge, hasActiveFilters && styles.activeBadge]}>
            <Icon name="sliders" size={20} color={isExpanded ? Colors.primary : Colors.textSecondary} />
            {hasActiveFilters && <View style={styles.dot} />}
          </View>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedHeader}>
            <Text style={Typography.overline}>Refine Search</Text>
            <TouchableOpacity onPress={onClear} disabled={!hasActiveFilters}>
              <Text style={[Typography.link, { fontSize: 13 }, !hasActiveFilters && { color: Colors.textLight }]}>
                Reset All
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <FilterItem
              label="Module"
              placeholder="Module"
              keyName="moduleId"
              items={options.modules.map(m => ({ label: m.name, value: m.id }))}
            />

            <FilterItem
              label="Submodule"
              placeholder={!filters.moduleId ? 'Pick Module' : 'Submodule'}
              keyName="subModuleId"
              items={subModules.map(m => ({ label: m.name, value: m.id }))}
              disabled={!filters.moduleId || subModulesLoading}
            />

            <FilterItem
              label="Type"
              placeholder="Type"
              keyName="defectTypeId"
              items={options.defectTypes.map((t: any) => ({
                label: t.name ?? t.defectTypeName,
                value: t.id ?? t.defectTypeId,
              }))}
            />

            <FilterItem
              label="Severity"
              placeholder="Severity"
              keyName="severityId"
              items={options.severities.map(s => ({ label: s.name, value: s.id }))}
            />

            <FilterItem
              label="Priority"
              placeholder="Priority"
              keyName="priorityId"
              items={options.priorities.map(p => ({ label: p.name, value: p.id }))}
            />

            <FilterItem
              label="Release"
              placeholder="Release"
              keyName="releaseId"
              items={options.releases.map(r => ({ label: r.name, value: r.id }))}
            />

            <FilterItem
              label="Status"
              placeholder="Status"
              keyName="statusId"
              items={options.statuses.map(s => ({ label: s.name, value: s.id }))}
            />

            <FilterItem
              label="Assigned To"
              placeholder="Assigned To"
              keyName="assignedToId"
              items={options.developers.map((d: any) => ({ label: d.name, value: d.id }))}
            />

            <FilterItem
              label="Entered By"
              placeholder="Entered By"
              keyName="enteredById"
              items={options.developers.map((d: any) => ({ label: d.name, value: d.id }))}
            />
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.text,
    fontFamily: Typography.body.fontFamily,
  },
  filterToggle: {
    height: 46,
    width: 46,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadge: {
    // color handled in Icon
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  expandedContent: {
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  filterItem: {
    width: 140,
  },
  filterLabel: {
    ...Typography.overline,
    fontSize: 10,
    marginBottom: 4,
    color: Colors.textSecondary,
  },
  dropdown: {
    width: '100%',
  },
});
