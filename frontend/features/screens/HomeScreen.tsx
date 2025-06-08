import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  PanResponder,
  Dimensions,
  Animated,
} from 'react-native';
import {useGroup} from '../context/GroupContext';
import ForceUpdateCheck from '../components/ForceUpdateCheck';

const {height: screenHeight, width: screenWidth} = Dimensions.get('window');

const ITEM_HEIGHT = screenHeight; // Full screen height per item for reel effect

const HomeScreen = ({navigation}: any) => {
  const {groups, loading, fetchGroups, fetchUserGroups} = useGroup();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);

  const swipeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchGroups();
    fetchUserGroups();
  }, [fetchGroups, fetchUserGroups,navigation]);

  const renderItem = ({item}: any) => {
    swipeX.setValue(0);

    const opacityFade = swipeX.interpolate({
      inputRange: [-screenWidth, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        Math.abs(gestureState.dx) > 15,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          swipeX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -80) {
          Animated.timing(swipeX, {
            toValue: -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            navigation.navigate('GroupDetails', {groupId: item._id});
            swipeX.setValue(0);
          });
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    });

    return (
      <Animated.View
        style={[styles.cardContainer, {transform: [{translateX: swipeX}]}]}
        {...panResponder.panHandlers}>
        {/* Left fade overlay */}
        <Animated.View
          pointerEvents="none"
          style={[styles.leftFadeOverlay, {opacity: opacityFade}]}
        />

        {item.admin ? (
          <View style={styles.userContainer}>
            <Image source={{uri: item.admin.image}} style={styles.userImage} />
            <View>
              <Text style={styles.userName}>{item.admin.name}</Text>
              <Text style={styles.userId}>ID: {item.admin._id}</Text>
            </View>
          </View>
        ) : (
          <Text style={{color: 'red'}}>Admin not found</Text>
        )}

        <Text style={styles.groupTitle}>{item.title}</Text>
        <Text style={styles.groupGoal}>Goal: {item.goal}</Text>
        <Image source={{uri: item.image}} style={styles.convoImage} />
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.streakText}>Streak: {item.streak}</Text>

        {item.todo && item.todo.tasks.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSelectedTasks(item.todo.tasks);
              setModalVisible(true);
            }}>
            <View style={styles.todoContainer}>
              <Text style={styles.todoTitle}>Click to View Daily Todo</Text>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.membersText}>
          No of Members : {item.members.length}
        </Text>
        {item.createdAt && (
          <Text style={styles.timestamp}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        )}
        <Text style={styles.swipeHint}>Swipe left for details →</Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          pagingEnabled={false} // Disable native paging because snapToInterval works better here
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          style={{flex: 1}}
          contentContainerStyle={{paddingTop: 0}}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Daily Tasks</Text>
            {selectedTasks.map((task, index) => (
              <Text key={index} style={styles.modalTaskText}>
                {task.title}
              </Text>
            ))}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ForceUpdateCheck />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userName: {
    fontWeight: '700',
    fontSize: 18,
  },
  userId: {
    color: 'gray',
    fontSize: 13,
  },
  groupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  groupGoal: {
    fontSize: 18,
    marginVertical: 6,
    color: '#333',
  },
  convoImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginVertical: 14,
    backgroundColor: '#ccc',
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    lineHeight: 22,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#007bff',
  },
  todoContainer: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
  },
  todoTitle: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  membersText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
    marginTop: 6,
  },
  swipeHint: {
    marginTop: 30,
    fontSize: 14,
    color: '#999',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: screenWidth,
    height: ITEM_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 110,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'flex-start',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 30,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalTaskText: {
    fontSize: 18,
    marginVertical: 6,
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
    fontSize: 18,
    color: '#007bff',
    fontWeight: '600',
    textAlign: 'right',
  },
  leftFadeOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
