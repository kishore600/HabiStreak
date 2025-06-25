import {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import {useGroup} from '../context/GroupContext';
import ForceUpdateCheck from '../components/ForceUpdateCheck';
import React from 'react';
import {useAuth} from '../context/AuthContext';

const {height: screenHeight, width: screenWidth} = Dimensions.get('window');

// Full screen height for true reels experience
export const CARD_HEIGHT = screenHeight;
export const CARD_WIDTH = screenWidth;

const HomeScreen = ({navigation}: any) => {
  const {groups, loading, fetchGroups, fetchUserGroups, handleJoinRequest} =
    useGroup();

  const {fetchUserProfile}: any = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  console.log(currentIndex, setSelectedTasks);

  const handleJoinGroup = async (groupId: string) => {
    await handleJoinRequest(groupId);
    await fetchGroups();
    await fetchUserProfile();
  };

  useEffect(() => {
    fetchGroups();
    fetchUserGroups();
  }, [fetchGroups, fetchUserGroups, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchGroups();
      await fetchUserGroups();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle scroll events
  const handleScroll = Animated.event(
    [{nativeEvent: {contentOffset: {y: scrollY}}}],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / CARD_HEIGHT);
        setCurrentIndex(index);
      },
    },
  );

  const renderCard = (item: any, index: number) => {
    console.log(index);
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() =>
            navigation.navigate('GroupDetails', {
              groupId: item._id,
            })
          }
          activeOpacity={0.9}>
          <Image
            source={{uri: item.image}}
            style={styles.backgroundImage}
            resizeMode="cover"
          />

          {/* Gradient Overlay */}
          <View style={styles.gradientOverlay} />

          {/* Bottom Content */}
          <View style={styles.bottomContent}>
            {/* Group Title */}
            <View>
              <View style={styles.cardContentWrapper}>
                <Image
                  source={{uri: item.admin.image}}
                  style={styles.adminImage}
                  resizeMode="cover"
                />
                <Text style={styles.groupTitle}>
                  {item.title || "Kishore's Gym club"}
                </Text>
              </View>
              <Text style={styles.groupSubtitle}>
                {item.goal || 'Active Aesthetic physique'}
              </Text>
            </View>

            {/* Members Avatars */}
            <View style={styles.membersAvatarsSection}>
              <View>
                <View style={styles.membersAvatars}>
                  {item.members?.slice(0, 4).map((member: any, idx: number) => (
                    <Image
                      key={member._id || idx}
                      source={{
                        uri: member.image || 'https://via.placeholder.com/40',
                      }}
                      style={[styles.memberAvatar, {marginLeft: idx * -12}]}
                    />
                  ))}
                  {item.members?.length > 4 && (
                    <View
                      style={[
                        styles.memberAvatar,
                        styles.moreMembers,
                        {marginLeft: -12},
                      ]}>
                      <Text style={styles.moreMembersText}>
                        +{item.members.length - 4}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.membersJoinedText}>
                  {item.members?.length || 6} members joined
                </Text>
              </View>

              {/* Join Button */}
              <TouchableOpacity
                style={styles.joinButtonBottom}
                onPress={e => {
                  e.stopPropagation(); // Prevent navigation when clicking join
                  handleJoinGroup(item._id);
                }}>
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({item, index}: any) => {
    return renderCard(item, index);
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.noMoreCards}>
        <Text style={styles.noMoreCardsText}>No more groups!</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            fetchGroups();
          }}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Full screen scrollable cards */}
      <FlatList
        ref={flatListRef}
        data={groups}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#fff']}
            progressBackgroundColor="#000"
          />
        }
        style={styles.flatListStyle}
        pagingEnabled={true}
        snapToInterval={CARD_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        getItemLayout={(_, index) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
      />

      {/* Modal for Tasks */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Daily Tasks</Text>
            <FlatList
              data={selectedTasks}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({item}) => (
                <Text style={styles.modalTaskText}>• {item.title}</Text>
              )}
              style={styles.modalScroll}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ForceUpdateCheck />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  // FlatList Styles
  flatListStyle: {
    flex: 1,
  },
  adminImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 10,
  },
  flatListContent: {
    flexGrow: 1,
  },
  cardContainer: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
  },
  cardContent: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  // Top Right Section
  topRightSection: {
    position: 'absolute',
    top: 60,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 10, // Reduced from 20 since join button is removed
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 8,
  },
  profileName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  membersSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  membersCount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  membersLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  tasksSection: {
    alignItems: 'center',
  },
  tasksIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tasksEmoji: {
    fontSize: 20,
  },
  tasksLabel: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },

  // Bottom Content
  bottomContent: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 100,
  },
  cardContentWrapper: {
    // padding: 16,
    borderRadius: 16,
    gap: 10,
    alignItems: 'center',
    flexDirection: 'row',
  },
  groupTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupSubtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 20,
  },
  membersAvatarsSection: {
    marginBottom: 15,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  membersAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  moreMembers: {
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMembersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  membersJoinedText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  streakSection: {
    marginTop: 10,
  },
  streakText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom Navigation
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  activeNavItem: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  homeIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconText: {
    fontSize: 20,
  },
  navLabel: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },

  // Modal Styles
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    padding: 30,
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalTaskText: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Empty State
  noMoreCards: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CARD_HEIGHT,
    paddingHorizontal: 20,
  },
  noMoreCardsText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButtonBottom: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
    color: 'white',
    // marginVertical: 12,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
