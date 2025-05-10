import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Button} from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../context/AuthContext';
import {useGroup} from '../context/GroupContext';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {ScrollView} from 'react-native';
import Leaderboard from '../components/Leaderboard';
import CategoryList from '../components/CategoryList';
import DateTimePicker from '@react-native-community/datetimepicker';
import {hobbies_enum} from '../constant';
import {MultiSelect} from 'react-native-element-dropdown';
import {Platform} from 'react-native';

const GroupDetailsScreen = ({route}: any) => {
  const {user}: any = useAuth();
  const {groupId}: any = route.params;
  const {
    group,
    fetchGroupById,
    handleUpdateGroup,
    handleDeleteGroup,
    loading,
    setLoading,
    updateTodo,
    markTaskComplete,
  }: any = useGroup();

  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState<any>([]);
  const [image, setImage] = useState<any>(null);
  const [tasks, setTasks] = useState<any>([]);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const categoryOptions = hobbies_enum.map(hobby => ({
    label: hobby,
    value: hobby,
  }));
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchGroupById(groupId);
      setLoading(false);
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    if (groupId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    if (group) {
      setTitle(group.title);
      setGoal(group.goal);
      setMembers(group.members || []);
      setImage(group.image);
      setSelectedMembers(group.members?.map((m: any) => m._id) || []);
      setTasks(group.todo?.tasks || []);
      setEndDate(group.endDate)
      setSelectedCategories(group?.categories);
      
    }
  }, [group]);

  const validateText = (text: string) => {
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
      await handleUpdateGroup(
        groupId,
        title,
        goal,
        selectedMembers,
        image,
        endDate,
        selectedCategories
      );

      await updateTodo(groupId, tasks, endDate);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const handleTaskChange = (index: any, newText: any) => {
    const updated = [...tasks];
    updated[index].title = newText;
    setTasks(updated);
  };

  const addNewTask = () => {
    setTasks([...tasks, {title: '', completedBy: []}]);
  };

  const removeTask = (index: any) => {
    const updated = tasks.filter((_: any, i: any) => i !== index);
    setTasks(updated);
  };

  const updateTaskChanges = async () => {
    try {
      setLoading(true);
      await updateTodo(groupId, tasks);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Updated',
        textBody: 'Tasks updated successfully!',
        button: 'OK',
      });
    } catch (error) {
      console.log(error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to update tasks.',
        button: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      const res = await markTaskComplete(groupId, taskId);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: res.message || 'Task marked complete!',
        button: 'OK',
      });

      await fetchGroupById(groupId); // Refresh group tasks
    } catch (error: any) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: error?.response?.data?.message || 'Failed to complete task',
        button: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(group?.endDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setEndDate(formattedDate);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const admin_id = group?.admin?._id;

  const IsEditUser_id = user?._id == admin_id;

  console.log(selectedCategories)
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{paddingBottom: 50}}>
      {editMode ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Group Title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Group Goal"
            value={goal}
            onChangeText={setGoal}
          />
          <TouchableOpacity onPress={pickImage}>
            <Text style={{color: 'blue', marginBottom: 10}}>
              Pick New Group Image
            </Text>
          </TouchableOpacity>
          {image ? (
            <Image
              source={{uri: image.uri || image}}
              style={{width: 100, height: 100, marginBottom: 10}}
            />
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
                <Text style={{color: '#888'}}>Pick Group Image</Text>
              </View>
            </TouchableOpacity>
          )}

          <Text style={styles.subTitle}>Select Members:</Text>
          {user.followers.map((item: any) => (
            <TouchableOpacity
              key={item._id}
              style={styles.memberItem}
              onPress={() => toggleMemberSelection(item._id)}>
              <Icon
                name={
                  selectedMembers.includes(item._id)
                    ? 'check-circle'
                    : 'circle-o'
                }
                size={24}
                color={selectedMembers.includes(item._id) ? 'green' : 'gray'}
                style={{marginRight: 10}}
              />
              <View>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.subTitle}>Edit Tasks</Text>
          {tasks.map((task: any, index: any) => (
            <View key={index} style={styles.taskItem}>
              <TextInput
                style={styles.input}
                placeholder="Task Title"
                value={task.title}
                onChangeText={text => handleTaskChange(index, text)}
              />
              <TouchableOpacity onPress={() => removeTask(index)}>
                <Text style={{color: 'red'}}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Button onPress={addNewTask}>Add Task</Button>
          <Button onPress={updateTaskChanges}>Update Tasks</Button>

          <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
            <Text style={{color: 'blue', marginVertical: 10}}>
              Select End Date
            </Text>
          </TouchableOpacity>
          <Text style={{marginBottom: 10}}>
            Selected Date: {endDate ? new Date(endDate).toDateString() : 'None'}
          </Text>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate ? new Date(endDate) : new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              maximumDate={new Date(2100, 11, 31)}
            />
          )}

          <Text style={styles.subheading}>Select Categories</Text>
          <MultiSelect
            style={[styles.input, {paddingHorizontal: 10}]}
            placeholderStyle={{color: '#888'}}
            selectedTextStyle={{color: '#000'}}
            inputSearchStyle={{height: 40, fontSize: 16}}
            data={categoryOptions}
            labelField="label"
            valueField="value"
            placeholder="Select Categories"
            search
            searchPlaceholder="Search..."
            value={selectedCategories}
            onChange={item => {
              setSelectedCategories(item);
            }}
            selectedStyle={{borderRadius: 12}}
            maxSelect={10}
          />
          <CategoryList selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

        </>
      ) : (
        <>
          <Text style={styles.title}>{group?.title}</Text>
          <Text style={styles.goal}>Goal: {group?.goal}</Text>
          <Text style={styles.goal}>End Date: {formattedDate}</Text>
          <Text style={styles.streak}>Group Streak: {group?.streak} 🐦‍🔥</Text>
          <CategoryList categories={group?.categories} setSelectedCategories={setSelectedCategories} />

          <Text style={styles.subTitle}>Admin</Text>
          <View style={styles.adminContainer}>
            <Image
              source={{uri: group?.admin?.image}}
              style={styles.adminImage}
            />
            <View>
              <Text style={styles.memberName}>{group?.admin?.name}</Text>
              <Text style={styles.memberEmail}>{group?.admin?.email}</Text>
            </View>
          </View>
          {/* group  members */}
          <Text style={styles.subTitle}>Members</Text>
          {members.map((item: any) => (
            <View key={item._id} style={styles.memberItem}>
              <Image source={{uri: item.image}} style={styles.memberImage} />
              <View>
                <Text style={styles.memberName}>{item.name}</Text>
                <Text style={styles.memberEmail}>{item.email}</Text>
              </View>
            </View>
          ))}
          {/* group todo */}

          <Text style={styles.subTitle}>To-Do Tasks</Text>
          {group?.todo?.tasks?.map((task: any) => {
            const completionKey = `${user._id}_${today}`;
            const isCompleted = task?.completedBy?.includes(completionKey);

            return (
              <TouchableOpacity
                key={task._id}
                style={[
                  styles.taskItemContainer,
                  isCompleted && styles.taskItemCompleted,
                ]}
                onPress={() => handleCompleteTask(task._id)}
                activeOpacity={0.7}>
                <Icon
                  name={isCompleted ? 'check-circle' : 'circle-o'}
                  size={22}
                  color={isCompleted ? 'green' : '#aaa'}
                  style={{marginRight: 10}}
                />
                <Text
                  style={[
                    styles.taskText,
                    isCompleted && styles.taskTextCompleted,
                  ]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* leader board */}
          <Leaderboard groupId={groupId} />
        </>
      )}

      <View style={styles.buttonContainer}>
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
            {IsEditUser_id && (
              <>
                <Button
                  mode="contained"
                  style={{backgroundColor: 'tomato', marginBottom: 10}}
                  onPress={() => setEditMode(true)}>
                  Edit Group
                </Button>
                <Button mode="outlined" onPress={handleDeleteGroup}>
                  Delete Group
                </Button>
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
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
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
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
  taskItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },

  taskText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },

  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },

  taskItemCompleted: {
    backgroundColor: '#f9f9f9',
  },

  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
    gap: 10,
  },
});
