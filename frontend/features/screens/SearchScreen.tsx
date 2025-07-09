import React from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSearch } from '../context/SearchContext';
import { Image } from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const SearchScreen = () => {
  const navigation = useNavigation();
  const {
    query,
    setQuery,
    selectedType,
    setSelectedType,
    results,
    setResults,
    search,
    loading,
  } = useSearch();
  const {user}:any = useAuth()
  const toggleType = (type: 'user' | 'group') => {
    setSelectedType((prev: any) => (prev === type ? null : type));
  };

  const handlePress = (item: any) => {
    if (item.type === 'user') {
      navigation.navigate('Profile', { user: item });
      setResults([]);
      setQuery('');
    } else {
      navigation.navigate('GroupDetails', { groupId: item._id });
      setResults([]);
      setQuery('');
    }
  };

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {query ? 'No results found' : 'Start typing to search...'}
        </Text>
        {query && (
          <Text style={styles.emptySubtext}>
            Try adjusting your search or filters
          </Text>
        )}
      </View>
    );
  };

  const renderResultItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.resultItem} 
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        <View style={styles.leftContent}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.type === 'user' 
                  ? item.name?.charAt(0)?.toUpperCase() || 'U'
                  : item.title?.charAt(0)?.toUpperCase() || 'G'
                }
              </Text>
            </View>
          )}
          <View style={styles.textContent}>
            <Text style={styles.itemName}>
              {item.type === 'user' ? item.name : item.title}
            </Text>
            {item.type === 'user' && item.email && (
              <Text style={styles.itemSubtext}>{item.email}</Text>
            )}
            {item.type === 'group' && item.memberCount && (
              <Text style={styles.itemSubtext}>
                {item.memberCount} members
              </Text>
            )}
          </View>
        </View>
        <View style={[
          styles.badge,
          item.type === 'user' ? styles.userBadge : styles.groupBadge,
        ]}>
          <Text style={[
            styles.badgeText,
            item.type === 'user' ? styles.userBadgeText : styles.groupBadgeText,
          ]}>
            {item.type === 'user' ? 'User' : 'Group'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
<View style={styles.header}>
  <Text style={styles.headerTitle}>Your search begins here, {user.name}!</Text>
</View>


      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users or groups..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
      </View>

      {/* Filter Tags */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterTag,
            selectedType === 'user' && styles.selectedFilterTag,
          ]}
          onPress={() => toggleType('user')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterTagText,
            selectedType === 'user' && styles.selectedFilterTagText,
          ]}>
            Users
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterTag,
            selectedType === 'group' && styles.selectedFilterTag,
          ]}
          onPress={() => toggleType('group')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterTagText,
            selectedType === 'group' && styles.selectedFilterTagText,
          ]}>
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={renderResultItem}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={results.length === 0 ? styles.emptyListContainer : undefined}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: 60,
    marginTop:20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#444',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  selectedFilterTag: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  selectedFilterTagText: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultItem: {
    marginBottom: 12,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  textContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  itemSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userBadge: {
    backgroundColor: '#1E3A8A',
  },
  groupBadge: {
    backgroundColor: '#9A3412',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userBadgeText: {
    color: '#93C5FD',
  },
  groupBadgeText: {
    color: '#FDBA74',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
export default SearchScreen;