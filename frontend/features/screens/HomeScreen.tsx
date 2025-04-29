import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useGroup} from '../context/GroupContext';
import {Modal} from 'react-native';

const HomeScreen = () => {
  const {groups, loading, fetchGroups} = useGroup();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<any[]>([]);
  useEffect(() => {
    fetchGroups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const renderItem = ({item}: any) => (
    <View style={styles.convoContainer}>
      {/* User Info */}
      {item.admin ? (
        <View style={styles.userContainer}>
          <Image source={{uri: item.admin.image}} style={styles.userImage} />
          <View>
            <Text style={styles.userName}>{item.admin.name}</Text>
            <Text style={styles.userId}>ID: {item.admin._id}</Text>
          </View>
        </View>
      ) : (
        <View>
          <Text style={{color: 'red'}}>Admin not found</Text>
        </View>
      )}

      {/* Group Title, Goal, and Description */}
      <Text style={styles.groupTitle}>{item.title}</Text>
      <Text style={styles.groupGoal}>Goal: {item.goal}</Text>

      {/* Group Image */}
      <Image source={{uri: item.image}} style={styles.convoImage} />

      {/* Group Description */}
      <Text style={styles.description}>{item.description}</Text>

      {/* Streak */}
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

      <Text>No of Members : {item.members.length}</Text>
      {/* Timestamp */}
      {item.createdAt && (
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      )}
    </View>
  );


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.flatListContent}
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
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {flex: 1, padding: 10, backgroundColor: '#f8f9fa', top: 50},
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convoContainer: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userId: {
    fontSize: 12,
    color: '#888',
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  groupGoal: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 10,
  },
  convoImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginVertical: 10,
  },
  streakText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 5,
  },
  commentsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  commentsTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#555',
  },
  noComments: {
    fontSize: 14,
    color: '#999',
  },
  todoContainer: {
    // marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 0,
    // backgroundColor: '#e9ecef',
    borderRadius: 8,
  },
  todoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  todoText: {
    fontSize: 14,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 10,
    textAlign: 'right',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: {fontSize: 20, fontWeight: 'bold', marginBottom: 10},
  modalTaskText: {fontSize: 16, marginBottom: 5},
  closeButton: {
    marginTop: 15,
    color: 'blue',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
