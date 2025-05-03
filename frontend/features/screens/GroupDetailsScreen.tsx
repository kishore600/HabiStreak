import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';

const GroupDetailsScreen = ({ route }: any) => {
  const { user }: any = useAuth();
  const { groupId }: any = route.params;
  const {
    group,
    fetchGroupById,
    handleUpdateGroup,
    handleDeleteGroup,
    loading,
    setLoading,
  }: any = useGroup();

  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [image, setImage] = useState<any>(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchGroupById(groupId);
      setLoading(false);
    };

    if (groupId) {
      fetchData();
    }
  }, [groupId]);

  useEffect(() => {
    if (group) {
      setTitle(group.title);
      setGoal(group.goal);
      setMembers(group.members || []);
      setImage(group.image);
      setSelectedMembers(group.members?.map((m: any) => m._id) || []);
      setTasks(group.todo?.tasks || []);
    }
  }, [group]);

  const validateText = text => {
    return text && text.trim().length > 0;
  };

  const pickImage = async () => {
    const result: any = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
    });

    if (result?.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMembers((prev: any) =>
      prev.includes(id) ? prev.filter((mid: any) => mid !== id) : [...prev, id],
    );
  };

  const saveGroupChanges = async () => {
    if (!validateText(title) || !validateText(goal)) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Group update failed!',
        button: 'OK',
      });
      return;
    }
    try {
      setLoading(true);
      await handleUpdateGroup(groupId, title, goal, selectedMembers, image);      
      // await updateTodo(groupId, tasks);
    } catch (error: any) {
      console.log(error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const handleTaskChange = (index, newText) => {
    const updated = [...tasks];
    updated[index].title = newText;
    setTasks(updated);
  };

  const addNewTask = () => {
    setTasks([...tasks, { title: '', completedBy: [] }]);
  };

  const removeTask = index => {
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
  };

  return (
    <FlatList
      style={styles.container}
      data={[group]} // Pass your group data here for rendering
      keyExtractor={(item: any) => item?._id}
      ListHeaderComponent={<>
        {editMode ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Group Title"
              value={title}
              onChangeText={setTitle} />
            <TextInput
              style={styles.input}
              placeholder="Group Goal"
              value={goal}
              onChangeText={setGoal} />
            <TouchableOpacity onPress={pickImage}>
              <Text style={{ color: 'blue', marginBottom: 10 }}>
                Pick New Group Image
              </Text>
            </TouchableOpacity>
            {image ? (
              <Image
                source={{ uri: image.uri || image }}
                style={{ width: 100, height: 100, marginBottom: 10 }} />
            ) : (
              <TouchableOpacity onPress={pickImage}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    marginBottom: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#eee',
                    borderRadius: 8,
                  }}>
                  <Text style={{ color: '#888' }}>Pick Group Image</Text>
                </View>
              </TouchableOpacity>
            )}

            <Text style={styles.subTitle}>Select Members:</Text>
            <FlatList
              data={user.followers}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberItem}
                  onPress={() => toggleMemberSelection(item._id)}>
                  <Icon
                    name={selectedMembers.includes(item._id)
                      ? 'check-circle'
                      : 'circle-o'}
                    size={24}
                    color={selectedMembers.includes(item._id) ? 'green' : 'gray'}
                    style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                  </View>
                </TouchableOpacity>
              )} />
                 <Text style={styles.subTitle}>Edit Tasks</Text>
              {tasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <TextInput
                    style={styles.input}
                    placeholder="Task Title"
                    value={task.title}
                    onChangeText={text => handleTaskChange(index, text)}
                  />
                  <TouchableOpacity onPress={() => removeTask(index)}>
                    <Text style={{ color: 'red' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Button onPress={addNewTask}>Add Task</Button>
          </>
        ) : (
          <>
            <Text style={styles.title}>{group?.title}</Text>
            <Text style={styles.goal}>Goal: {group?.goal}</Text>
            <Text style={styles.streak}>Group Streak: {group?.streak}</Text>

            <Text style={styles.subTitle}>Admin</Text>
            <View style={styles.adminContainer}>
              <Image source={{ uri: group?.admin?.image }} style={styles.adminImage} />
              <View>
                <Text style={styles.memberName}>{group?.admin?.name}</Text>
                <Text style={styles.memberEmail}>{group?.admin?.email}</Text>
              </View>
            </View>

            <Text style={styles.subTitle}>Members</Text>
            <FlatList
              data={members}
              keyExtractor={(item: any) => item?._id}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <Image source={{ uri: item?.image }} style={styles.memberImage} />
                  <View>
                    <Text style={styles.memberName}>{item?.name}</Text>
                    <Text style={styles.memberEmail}>{item?.email}</Text>
                  </View>
                </View>
              )} />

            <Text style={styles.subTitle}>To-Do Tasks</Text>
            {group?.todo?.tasks?.map((task: any) => (
              <View key={task._id} style={styles.taskItem}>
                <Text>{task.title}</Text>
              </View>
            ))}
          </>
        )}
      </>}
      ListFooterComponent={<View style={styles.buttonContainer}>
        {editMode ? (
          <>
            <Button mode="contained" onPress={saveGroupChanges}>
              Save Changes
            </Button>
            <Button mode="outlined" onPress={() => setEditMode(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              mode="contained"
              style={{ backgroundColor: 'tomato', marginBottom: 10 }}
              onPress={() => setEditMode(true)}>
              Edit Group
            </Button>
            <Button mode="outlined" onPress={handleDeleteGroup}>
              Delete Group
            </Button>
          </>
        )}
      </View>} renderItem={undefined}    />
  );
};

export default GroupDetailsScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  goal: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  streak: {
    fontSize: 16,
    marginBottom: 15,
    color: '#28a745',
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 10,
    color: '#444',
  },
  adminContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    marginBottom: 10,
  },
  adminImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    marginBottom: 10,
  },
  memberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  memberName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  memberEmail: {
    color: '#777',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 3,
  },
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
    gap: 10,
  },
});
