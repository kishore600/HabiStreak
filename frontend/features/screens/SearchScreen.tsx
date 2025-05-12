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
import {useSearch} from '../context/SearchContext';
import {Image} from 'react-native-animatable';
import {useNavigation} from '@react-navigation/native';

const SearchScreen = () => {
  const navigation = useNavigation();

  const {
    query,
    setQuery,
    selectedType,
    setSelectedType,
    results,
    search,
    loading,
  } = useSearch();

  const toggleType = (type: 'user' | 'group') => {
    setSelectedType((prev: any) => (prev === type ? null : type));
  };

  const handlePress = (item: any) => {
    if (item.type === 'user') {
      navigation.navigate('Profile', {user: item});
    }
    // You can add similar logic for "group" later
  };

  return (
    <View style={styles.container}>
      {/* Search Box */}
      <TextInput
        style={styles.input}
        placeholder="Search users or groups..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={search}
      />

      {/* Tags */}
      <View style={styles.tagsContainer}>
        <TouchableOpacity
          style={[styles.tag, selectedType === 'user' && styles.selectedTag]}
          onPress={() => toggleType('user')}>
          <Text style={styles.tagText}>User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tag, selectedType === 'group' && styles.selectedTag]}
          onPress={() => toggleType('group')}>
          <Text style={styles.tagText}>Group</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{marginTop: 20}}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item._id}
          renderItem={({item}:any) => (
            <TouchableOpacity onPress={() => handlePress(item)}>
              
              <View style={styles.resultItem}>

                      <TouchableOpacity
        onPress={() =>
          navigation.navigate('GroupDetails', {groupId: item._id})
        }>
                  <View style={styles.align}>
                  <View  style={styles.resultText}>

                  <View>
                    {item.image && (
                      <Image source={{uri: item.image}} style={styles.avatar} />
                    )}
                  </View>
                  
                  <View>
                    <Text>
                      {item.type === 'user' ? ` ${item.name}` : `${item.title}`}
                    </Text>
                  </View>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      item.type === 'user'
                        ? styles.userBadge
                        : styles.groupBadge,
                    ]}>
                    <Text style={styles.badgeText}>
                      {item.type === 'user' ? 'User' : 'Group'}
                    </Text>
                  </View>
                </View>
        </TouchableOpacity>
        
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  align:{
display:'flex',
flexDirection:'row',
justifyContent:'space-between',
alignItems:'center'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  userBadge: {
    backgroundColor: '#d0ebff', // light blue
  },
  groupBadge: {
    backgroundColor: '#ffe0cc', // light orange
  },
  badgeText: {
    fontSize: 12,
    color: '#333',
  },

  container: {
    flex: 1,
    padding: 16,
    marginTop: 50,
    backgroundColor: '#fff',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 10,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedTag: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  tagText: {
    color: '#000',
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 16,
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 40,
  },
});
