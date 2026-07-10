import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface Project {
  id?: string | number;
  projectId?: string | number;
  name?: string;
  projectName?: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | number | null;
  onSelect: (id: string | number) => void;
  placeholder?: string;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelect,
  placeholder = 'Search projects...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projects.filter((p) => {
    const name = p.projectName || p.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project Selection</Text>

      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight || '#94a3b8'}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredProjects.map((project) => {
          // ✅ Use projectId explicitly – if missing, fallback to id
          const projectKey = project.projectId ?? project.id;
          const isSelected = Number(selectedProjectId) === Number(projectKey);

          console.log('🔍 Project:', project.projectName, 'Key:', projectKey, 'Selected:', selectedProjectId, 'isSelected:', isSelected);

          return (
            <TouchableOpacity
              key={String(projectKey)}
              style={[
                styles.projectButton,
                isSelected && styles.projectButtonActive,
              ]}
              onPress={() => {
                console.log('🟢 Pressed project key:', projectKey);
                if (projectKey !== undefined && projectKey !== null) {
                  onSelect(projectKey);
                }
              }}
            >
              <Text
                style={[
                  styles.projectButtonText,
                  isSelected && styles.projectButtonTextActive,
                ]}
              >
                {project.projectName || project.name || 'Unnamed'}
              </Text>
            </TouchableOpacity>
          );
        })}
        {filteredProjects.length === 0 && (
          <Text style={styles.noProjects}>No projects match</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
  },
  scrollView: {
    flexDirection: 'row',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  projectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  projectButtonActive: {
    backgroundColor: '#1e3a5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectButtonText: {
    fontSize: 14,
    color: '#0f172a',
  },
  projectButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  noProjects: {
    fontSize: 14,
    color: '#94a3b8',
    paddingVertical: 8,
  },
});

export default ProjectSelector;