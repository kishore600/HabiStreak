import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  PanResponder,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useGroup} from '../context/GroupContext';
import {useAuth} from '../context/AuthContext';
import ForceUpdateCheck from '../components/ForceUpdateCheck';

const {height: screenHeight, width: screenWidth} = Dimensions.get('window');

const CARD_HEIGHT = screenHeight * 0.65;
const CARD_WIDTH = screenWidth * 0.9;

const HomeScreen = ({navigation}: any) => {
  const {groups, loading, fetchGroups, fetchUserGroups} = useGroup();
  const {user}: any = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardHistory, setCardHistory] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const position = useRef(new Animated.ValueXY()).current;
  const refreshAnimation = useRef(new Animated.Value(0)).current;
  const pullToRefreshAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchGroups();
    fetchUserGroups();
  }, [fetchGroups, fetchUserGroups, navigation]);

  const resetPosition = () => {
    position.setValue({x: 0, y: 0});
  };

  // Snapchat-like refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    
    // Start refresh animation
    Animated.sequence([
      Animated.timing(refreshAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(refreshAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await fetchGroups();
      await fetchUserGroups();
      setCurrentIndex(0);
      setCardHistory([]);
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Custom pull-to-refresh handler
  const handleScroll = (event: any) => {
    const {contentOffset} = event.nativeEvent;
    if (contentOffset.y < -50 && !refreshing) {
      const distance = Math.abs(contentOffset.y + 50);
      setPullDistance(distance);
      
      // Animate pull indicator
      Animated.timing(pullToRefreshAnimation, {
        toValue: Math.min(distance / 100, 1),
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  };

  const forceSwipe = (direction: string) => {
    const x = direction === 'right' ? screenWidth : -screenWidth;
    Animated.timing(position, {
      toValue: {x, y: 0},
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: string) => {
    const item = groups[currentIndex];
    if (direction === 'right') {
      navigation.navigate('GroupDetails', {groupId: item._id});
    }

    setCardHistory(prev => [...prev, currentIndex]);
    setCurrentIndex(currentIndex + 1);
    resetPosition();
  };

  const goBackToPreviousCard = () => {
    if (cardHistory.length > 0) {
      const previousIndex = cardHistory[cardHistory.length - 1];
      setCardHistory(prev => prev.slice(0, -1));
      setCurrentIndex(previousIndex);
      resetPosition();
    }
  };

  const handleUpSwipe = () => {
    if (cardHistory.length > 0) {
      Animated.timing(position, {
        toValue: {x: 0, y: -screenHeight},
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        goBackToPreviousCard();
      });
    }
  };

  const getCardStyle = () => {
    const rotateCard = position.x.interpolate({
      inputRange: [-screenWidth * 1.5, 0, screenWidth * 1.5],
      outputRange: ['-30deg', '0deg', '30deg'],
    });

    return {
      ...position.getLayout(),
      transform: [{rotate: rotateCard}],
    };
  };

  const getLikeOpacity = () => {
    return position.x.interpolate({
      inputRange: [-screenWidth / 2, 0, screenWidth / 2],
      outputRange: [0, 0, 1],
      extrapolate: 'clamp',
    });
  };

  const getNopeOpacity = () => {
    return position.x.interpolate({
      inputRange: [-screenWidth / 2, 0, screenWidth / 2],
      outputRange: [1, 0, 0],
      extrapolate: 'clamp',
    });
  };

  const getBackOpacity = () => {
    return position.y.interpolate({
      inputRange: [-screenHeight / 2, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (event, gesture) => {
      if (Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
        position.setValue({x: gesture.dx, y: 0});
      } else if (gesture.dy < 0 && cardHistory.length > 0) {
        position.setValue({x: 0, y: gesture.dy});
      }
    },
    onPanResponderRelease: (event, gesture) => {
      if (Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
        if (gesture.dx > 120) {
          forceSwipe('right');
        } else if (gesture.dx < -120) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      } else if (gesture.dy < -100 && cardHistory.length > 0) {
        handleUpSwipe();
      } else {
        resetPosition();
      }
    },
  });

  // Custom refresh indicator component
  const renderRefreshIndicator = () => {
    const rotateAnimation = refreshAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const scaleAnimation = pullToRefreshAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1.2],
    });

    return (
      <Animated.View
        style={[
          styles.refreshIndicator,
          {
            opacity: pullToRefreshAnimation,
            transform: [
              {scale: scaleAnimation},
              {rotate: rotateAnimation},
            ],
          },
        ]}>
        <View style={styles.refreshIcon}>
          <Text style={styles.refreshEmoji}>🔄</Text>
        </View>
        <Text style={styles.refreshText}>
          {pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
        </Text>
      </Animated.View>
    );
  };

  const renderCard = (item: any, index: number) => {
    if (index < currentIndex) {
      return null;
    }

    if (index === currentIndex) {
      return (
        <Animated.View
          key={item._id}
          style={[styles.cardStyle, getCardStyle()]}
          {...panResponder.panHandlers}>
          
          <Animated.View style={[styles.likeLabel, {opacity: getLikeOpacity()}]}>
            <Text style={styles.likeText}>JOIN</Text>
          </Animated.View>

          <Animated.View style={[styles.nopeLabel, {opacity: getNopeOpacity()}]}>
            <Text style={styles.nopeText}>PASS</Text>
          </Animated.View>

          {cardHistory.length > 0 && (
            <Animated.View style={[styles.backLabel, {opacity: getBackOpacity()}]}>
              <Text style={styles.backText}>BACK</Text>
            </Animated.View>
          )}

          <View style={styles.cardContent}>
            <View style={styles.imageContainer}>
              <Image source={{uri: item.image}} style={styles.cardImage} />

              {item.todo && item.todo.tasks.length > 0 && (
                <TouchableOpacity
                  style={styles.todoButton}
                  onPress={() => {
                    setSelectedTasks(item.todo.tasks);
                    setModalVisible(true);
                  }}>
                  <Text style={styles.todoButtonText}>View Tasks</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.cardHeader}>
                <Text style={styles.groupTitle}>{item.title}</Text>
                <Text style={styles.groupGoal}>{item.goal}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.membersContainer}>
                  {item.members.slice(0, 3).map((member: any, idx: number) => (
                    <Image
                      key={idx}
                      source={{
                        uri: member.image || 'https://via.placeholder.com/30',
                      }}
                      style={[styles.memberAvatar, {marginLeft: idx * -8}]}
                    />
                  ))}
                  {item.members.length > 3 && (
                    <View style={styles.moreMembers}>
                      <Text style={styles.moreMembersText}>
                        +{item.members.length - 3}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() =>
                    navigation.navigate('GroupDetails', {groupId: item._id})
                  }>
                  <Text style={styles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={item._id}
        style={[
          styles.cardStyle,
          {
            zIndex: -index,
            transform: [
              {scale: 1 - (index - currentIndex) * 0.03},
              {translateY: (index - currentIndex) * 8},
            ],
            opacity: 1 - (index - currentIndex) * 0.2,
          },
        ]}>
        <View style={styles.cardContent}>
          <View style={styles.imageContainer}>
            <Image source={{uri: item.image}} style={styles.cardImage} />
          </View>

          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.groupTitle}>{item.title}</Text>
              <Text style={styles.groupGoal}>{item.goal}</Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.membersContainer}>
                {item.members.slice(0, 3).map((member: any, idx: number) => (
                  <Image
                    key={idx}
                    source={{
                      uri: member.image || 'https://via.placeholder.com/30',
                    }}
                    style={[styles.memberAvatar, {marginLeft: idx * -8}]}
                  />
                ))}
                {item.members.length > 3 && (
                  <View style={styles.moreMembers}>
                    <Text style={styles.moreMembersText}>
                      +{item.members.length - 3}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.joinButton}
                onPress={() =>
                  navigation.navigate('GroupDetails', {groupId: item._id})
                }>
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderCards = () => {
    if (currentIndex >= groups.length) {
      return (
        <View style={styles.noMoreCards}>
          <Text style={styles.noMoreCardsText}>No more groups!</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              setCurrentIndex(0);
              setCardHistory([]);
              fetchGroups();
            }}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return groups.map((item, index) => renderCard(item, index)).reverse();
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
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Custom refresh indicator */}
      {renderRefreshIndicator()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            style={{backgroundColor: 'transparent'}}
          />
        }>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{uri: user?.image}} style={styles.userAvatar} />
            <View>
              <Text style={styles.userName}>Welcome Back</Text>
              <Text style={styles.userHandle}>@{user?.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuGrid}>
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
              <View style={styles.menuDot} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Cards Container - Centered */}
        <View style={styles.cardsContainer}>
          <View style={styles.cardsWrapper}>{renderCards()}</View>
        </View>

        {/* Back Button (visible when there's history) */}
        {cardHistory.length > 0 && (
          <View style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBackToPreviousCard}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            {/* <View style={styles.hintsContainer}>
              <Text style={styles.hintText}>← Swipe left to pass</Text>
              <Text style={styles.hintText}>Swipe right to join →</Text>
            </View> */}
          </View>
        )}

        {/* Extra space for scrolling */}
        <View style={styles.extraSpace} />
      </ScrollView>

      {/* Modal for Tasks */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Daily Tasks</Text>
            <ScrollView style={styles.modalScroll}>
              {selectedTasks.map((task, index) => (
                <Text key={index} style={styles.modalTaskText}>
                  • {task.title}
                </Text>
              ))}
            </ScrollView>

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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  refreshIndicator: {
    position: 'absolute',
    top: 80,
    left: '50%',
    marginLeft: -50,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 60,
  },
  refreshIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  refreshEmoji: {
    fontSize: 16,
    color: '#fff',
  },
  refreshText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userHandle: {
    color: '#888',
    fontSize: 14,
  },
  menuButton: {
    padding: 5,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 20,
    height: 20,
  },
  menuDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    margin: 1,
  },
  backButtonContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -25,
  },
  backButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: CARD_HEIGHT + 100,
  },
  cardsWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStyle: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardContent: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardInfo: {
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  cardHeader: {
    marginBottom: 15,
  },
  groupTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  groupGoal: {
    color: '#ccc',
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreMembers: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreMembersText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  todoButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    zIndex: 1000,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{rotate: '15deg'}],
  },
  likeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    zIndex: 1000,
    backgroundColor: '#F44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    transform: [{rotate: '-15deg'}],
  },
  nopeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLabel: {
    position: 'absolute',
    top: 100,
    left: '50%',
    marginLeft: -30,
    zIndex: 1000,
    backgroundColor: '#FF9800',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintsContainer: {
    alignItems: 'stretch',
    display: 'flex',
  },
  hintText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
  extraSpace: {
    height: 200,
  },
  noMoreCards: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CARD_HEIGHT,
  },
  noMoreCardsText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
});

export default HomeScreen;