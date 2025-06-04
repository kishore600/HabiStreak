/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import {Button, Switch} from 'react-native-paper';
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
import {Picker} from '@react-native-picker/picker';
import AnalyticsChart from '../components/AnalyticsChart';

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
    handleJoinRequest,
    hasRequested,
    handleAcceptRequest,
    pendingRequests,
    fetchUserGroup,
    fetchAnalytics,
    analytics,
    MemberAnalytics,
    ComparisonAnalytisc,
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
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [type, setType] = useState('daily');
  const [proofMap, setProofMap] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const isUserInGroup =
    group?.members?.some((member: any) => member._id === user?._id) ?? false;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchGroupById(groupId);

      setLoading(false);
    };

    if (groupId) {
      fetchData();
      fetchAnalytics(type);
      MemberAnalytics(groupId);
      ComparisonAnalytisc(groupId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, type]);

  useEffect(() => {
    if (group) {
      setTitle(group.title);
      setGoal(group.goal);
      setMembers(group.members || []);
      setImage(group.image);
      setSelectedMembers(group.members?.map((m: any) => m._id) || []);
      setTasks(group.todo?.tasks || []);
      setEndDate(group.endDate);
      setSelectedCategories(group?.categories);
    }
  }, [group, groupId, group?.members]);

  const handleUploadProof = async (taskId: string) => {
    const result: any = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0, // 0 = unlimited
    });

    if (!result.didCancel && result.assets?.length) {
      setProofMap((prev: any) => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), ...result.assets],
      }));
    }
  };

  const handleRemoveProof = (taskId: string, index: number) => {
    setProofMap((prev: any) => {
      const updatedProofs = [...(prev[taskId] || [])];
      updatedProofs.splice(index, 1); // remove image at index
      return {
        ...prev,
        [taskId]: updatedProofs,
      };
    });
  };

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
        title: 'Validation Error',
        textBody: 'Please enter both title and goal for the group.',
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
        selectedCategories,
      );

      try {
        await updateTodo(groupId, tasks, endDate);
      } catch (todoError) {
        console.log('❌ Failed to update todo:', todoError);
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: 'Partial Update',
          textBody: 'Group updated, but tasks could not be saved.',
          button: 'OK',
        });
      }
    } catch (error) {
      console.log('❌ Group update error:', error);
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

  const addNewTask = () => {
    setTasks([
      ...tasks,
      {title: '', completedBy: [], requireProof: false, description: '',days:[]},
    ]);
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

  const handleCompleteTask = async (taskId: string, images: File[]) => {
    console.log(images);
    try {
      setLoading(true);
      console.log(groupId, taskId, images);
      const res = await markTaskComplete(groupId, taskId, images);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: res.message || 'Task marked complete!',
        button: 'OK',
      });

      await fetchGroupById(groupId);
    } catch (error: any) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: error.message || 'Failed to complete task',
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
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setEndDate(formattedDate);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    await handleJoinRequest(groupId);
    await fetchGroupById(groupId);
  };

  const acceptJoinRequest = async (userId: string) => {
    await handleAcceptRequest(groupId, userId);
    await fetchGroupById(groupId);
  };

  const handleDelete = async () => {
    await handleDeleteGroup(groupId);
    await fetchUserGroup();
  };

  const today = new Date().toISOString().slice(0, 10);

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const admin_id = group?.admin?._id;

  const IsEditUser_id = user?._id === admin_id;

  const getProof = (taskId: string) => {
    if (proofMap[taskId]?.length > 0) {
      return proofMap[taskId];
    }

    const task = group?.todo?.tasks?.find((t: any) => t._id === taskId);
    const completedEntry = task?.completedBy?.find(
      (entry: any) => entry.userDateKey === `${user._id}_${today}`,
    );

    return completedEntry?.proof || [];
  };


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
    {tasks.map((task: any, index: number) => {
  const completionKey = `${user._id}_${today}`;
  const isCompleted = task?.completedBy?.some(
    (c: any) => c.userDateKey === completionKey
  );
  const requiresProof = task.requireProof;
  const hasProvidedProof = proofMap[task._id]?.length > 0;
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const isTaskToday = task?.days?.includes(currentDay);

  const handleImagePress = (taskId: string, imageUrl: string) => {
    console.log('Task ID:', taskId);
    console.log('Image URL:', imageUrl);
  };

  return (
    <View key={index} style={[styles.taskContainer, !isTaskToday && { backgroundColor: '#eee' }]}>
      <TextInput
        placeholder={`Task ${index + 1} Title`}
        value={task.title}
        onChangeText={text => {
          const updatedTasks = [...tasks];
          updatedTasks[index].title = text;
          setTasks(updatedTasks);
        }}
        style={[styles.input, { flex: 1 }]}
      />

      <TextInput
        placeholder="Description (optional)"
        value={task.description}
        onChangeText={text => {
          const updatedTasks = [...tasks];
          updatedTasks[index].description = text;
          setTasks(updatedTasks);
        }}
        style={[styles.input, { flex: 1, marginTop: 8 }]}
        multiline
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={{ marginRight: 8 }}>Require Proof</Text>
        <Switch
          value={task.requireProof}
          onValueChange={value => {
            const updatedTasks = [...tasks];
            updatedTasks[index].requireProof = value;
            setTasks(updatedTasks);
          }}
        />
      </View>

      {/* Days badges like your first snippet */}
      <View style={styles.daysContainer}>
    {weekdays.map(day => (
  <TouchableOpacity
    key={day}
    onPress={() => {
      const updatedTasks = [...tasks];
      const days = updatedTasks[index].days || [];
      if (days.includes(day)) {
        // Remove day
        updatedTasks[index].days = days.filter(d => d !== day);
      } else {
        // Add day
        updatedTasks[index].days = [...days, day];
      }
      setTasks(updatedTasks);
    }}
    style={[
      styles.dayButton,
      task?.days?.includes(day) && styles.dayButtonSelected,
      day === currentDay && { borderColor: 'blue', borderWidth: 1 },
    ]}
  >
    <Text
      style={[
        styles.dayButtonText,
        task?.days?.includes(day) && styles.dayButtonTextSelected,
        day === currentDay && { fontWeight: 'bold' },
      ]}
    >
      {day}
    </Text>
  </TouchableOpacity>
))}

      </View>

      {/* Proof Upload Button & Images */}
      {requiresProof && !isCompleted && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: '#d9534f', fontSize: 13, marginBottom: 6 }}>
            * Proof required (image or video)
          </Text>

          <Button onPress={() => handleUploadProof(task._id)}>
            <Text>Upload Proof</Text>
          </Button>

          <ScrollView horizontal>
            {proofMap[task._id]?.map((proofItem: any, idx: number) => (
              <View key={idx} style={{ position: 'relative', margin: 5 }}>
                <Image
                  source={{ uri: proofItem.uri }}
                  style={{ width: 100, height: 100, borderRadius: 8, backgroundColor: '#ccc' }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveProof(task._id, idx)}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#f00',
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>–</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Completion toggle, disabled if not today's task */}
      <TouchableOpacity
        onPress={() => {
          if (requiresProof && !hasProvidedProof && !isCompleted) {
            Dialog.show({
              type: ALERT_TYPE.DANGER,
              title: 'Error',
              textBody: 'Please Upload the required fields',
            });
            return;
          }
          handleCompleteTask(task._id, getProof(task._id));
        }}
        activeOpacity={0.8}
        disabled={!isTaskToday}
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
      >
        <Icon
          name={isCompleted ? 'check-circle' : 'circle-o'}
          size={20}
          color={isCompleted ? '#34c759' : '#bbb'}
          style={{ marginRight: 12, marginTop: 4 }}
        />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: isCompleted ? '#34c759' : '#333',
          }}
        >
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </Text>
      </TouchableOpacity>

      {/* Remove Task button */}
      <TouchableOpacity onPress={() => removeTask(index)} style={styles.removeButton}>
        <Text style={{ color: 'white' }}>X</Text>
      </TouchableOpacity>
    </View>
  );
})}


          <Button onPress={addNewTask}>
            <Text>Add Task</Text>
          </Button>
          <Button onPress={updateTaskChanges}>
            <Text>Update Tasks</Text>
          </Button>

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
            mode="modal" // 👈 This enables modal mode
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
          <CategoryList
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />
        </>
      ) : (
        <>
          <TouchableOpacity
            onPress={() => {
              setShowJoinRequests(true);
            }}
            style={{
              padding: 4,
              backgroundColor: 'red',
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 20,
              marginBottom: 20,
            }}>
            <Text
              style={{
                color: 'white',
              }}>
              Pending Request {pendingRequests.length}
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>{group?.title} </Text>
          <Text style={styles.goal}>Goal: {group?.goal}</Text>
          <Text style={styles.goal}>End Date: {formattedDate}</Text>
          <Text style={styles.streak}>Group Streak: {group?.streak} 🐦‍🔥</Text>
          <CategoryList
            categories={group?.categories}
            setSelectedCategories={setSelectedCategories}
          />{' '}
          <View>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.openButton}>Open Analytics</Text>
            </TouchableOpacity>

            <Modal
              visible={modalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  {/* Close Button */}
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButton}>Close</Text>
                  </TouchableOpacity>

                  {/* Your existing content */}
                  <View style={styles.pickerContainer}>
                    <Text style={styles.label1}>Analytics:</Text>
                    <Text style={styles.label}>Select Type:</Text>
                    <Picker
                      selectedValue={type}
                      style={styles.picker}
                      onValueChange={itemValue => setType(itemValue)}>
                      <Picker.Item label="Daily" value="daily" />
                      <Picker.Item label="Weekly" value="weekly" />
                      <Picker.Item label="Monthly" value="monthly" />
                      <Picker.Item label="Yearly" value="yearly" />
                    </Picker>
                  </View>

                  {loading ? (
                    <ActivityIndicator size="large" color="#007bff" />
                  ) : (
                    <AnalyticsChart analytics={analytics.data} />
                  )}
                </View>
              </View>
            </Modal>
          </View>
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
          {isUserInGroup ? (
            group?.todo?.tasks?.map((task: any) => {
              const completionKey = `${user._id}_${today}`;
              const isCompleted = task?.completedBy?.some(
                (c: any) => c.userDateKey === completionKey,
              );
              const requiresProof = task.requireProof;
              const hasProvidedProof = proofMap[task._id]?.length > 0;
const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
const isTaskToday = task?.days?.includes(currentDay);
              const handleImagePress = (taskId: string, imageUrl: string) => {
                console.log('Task ID:', taskId);
                console.log('Image URL:', imageUrl);
              };

              return (
                <View
                  key={task._id}
                  style={[
                    {
                      backgroundColor: '#fff',
                      padding: 14,
                      borderRadius: 12,
                      marginVertical: 8,
                      shadowColor: '#000',
                      shadowOffset: {width: 0, height: 1},
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 2,
                    },
                    isCompleted && {backgroundColor: '#e6f5e6'},
                     !isTaskToday && { backgroundColor: 'lightgray' },
                  ]}>
                  <View style={styles.daysContainer}>
                    {weekdays.map(day => (
                      <View
                        key={day}
                        style={[
                          styles.dayButton,
                          task?.days?.includes(day) && styles.dayButtonSelected,
                          
                        ]}>
                        <Text
                          style={[
                            styles.dayButtonText,
                            task?.days?.includes(day) &&
                              styles.dayButtonTextSelected,
                          ]}>
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={{flexDirection: 'row', alignItems: 'flex-start'}}
                    onPress={() => {
                      if (requiresProof && !hasProvidedProof && !isCompleted) {
                        Dialog.show({
                          type: ALERT_TYPE.DANGER,
                          title: 'Error',
                          textBody: 'Please Upload the required fields',
                        });
                        return;
                      }
                      handleCompleteTask(task._id, getProof(task._id));
                    }}
                    activeOpacity={0.8}
                      disabled={!isTaskToday}>
                    <Icon
                      name={isCompleted ? 'check-circle' : 'circle-o'}
                      size={20}
                      color={isCompleted ? '#34c759' : '#bbb'}
                      style={{marginRight: 12, marginTop: 4}}
                    />

                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: isCompleted ? '#34c759' : '#333',
                        }}>
                        {task.title}
                      </Text>

                      {task.description ? (
                        <Text
                          style={{fontSize: 14, color: '#666', marginTop: 4}}>
                          {task.description}
                        </Text>
                      ) : null}

                      {requiresProof && !isCompleted && (
                        <View style={{marginTop: 10}}>
                          <Text
                            style={{
                              color: '#d9534f',
                              fontSize: 13,
                              marginBottom: 6,
                            }}>
                            * Proof required (image or video)
                          </Text>

                          <Button onPress={() => handleUploadProof(task._id)}>
                            <Text>Upload Proof</Text>
                          </Button>
                          <ScrollView horizontal>
                            {proofMap[task._id]?.map(
                              (proofItem: any, index: number) => (
                                <View
                                  key={index}
                                  style={{position: 'relative', margin: 5}}>
                                  <Image
                                    source={{uri: proofItem.uri}}
                                    style={{
                                      width: 100,
                                      height: 100,
                                      borderRadius: 8,
                                      backgroundColor: '#ccc',
                                    }}
                                    resizeMode="cover"
                                  />
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleRemoveProof(task._id, index)
                                    }
                                    style={{
                                      position: 'absolute',
                                      top: -8,
                                      right: -8,
                                      backgroundColor: '#f00',
                                      borderRadius: 12,
                                      width: 24,
                                      height: 24,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}>
                                    <Text
                                      style={{
                                        color: '#fff',
                                        fontWeight: 'bold',
                                      }}>
                                      –
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              ),
                            )}
                          </ScrollView>
                        </View>
                      )}

                      {isCompleted && (
                        <ScrollView horizontal>
                          {task.completedBy
                            ?.filter(
                              (entry: any) =>
                                entry.userDateKey === `${user._id}_${today}`,
                            ) // Filter by user ID and date
                            .flatMap(
                              (entry: any) =>
                                entry.proof?.filter(
                                  (proofItem: any) =>
                                    proofItem.type === 'image',
                                ) || [],
                            )
                            .map((proofItem: any) => (
                              <TouchableOpacity
                                key={proofItem._id}
                                onPress={() =>
                                  handleImagePress(task._id, proofItem.url)
                                }>
                                <Image
                                  source={{uri: proofItem.url}}
                                  style={{
                                    width: 100,
                                    height: 100,
                                    margin: 5,
                                    borderRadius: 8,
                                    backgroundColor: '#ccc',
                                  }}
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            ))}
                        </ScrollView>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View>
              {group?.todo?.tasks?.map((task: any) => (
                <View key={task._id} style={{marginBottom: 20}}>
                  <Text style={styles.taskText}>{task.title}</Text>

                  {task.description && (
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                  )}

                  {task.requireProof && (
                    <Text style={{color: 'red'}}>
                      Requires proof to complete
                    </Text>
                  )}

                  {/* Display proof images if available */}
                  <ScrollView>
                    {getProof(task._id).map((task: any) => (
                      <View key={task._id} style={{marginBottom: 20}}>
                        <Text style={styles.taskText}>{task.title}</Text>

                        {task.description && (
                          <Text style={styles.taskDescription}>
                            {task.description}
                          </Text>
                        )}

                        {task.requireProof && (
                          <Text style={{color: 'red'}}>
                            Requires proof to complete
                          </Text>
                        )}

                        {/* Show proof images */}
                        {task.completedBy?.map((entry: any) => (
                          <View
                            key={entry._id}
                            style={{
                              flexDirection: 'row',
                              flexWrap: 'wrap',
                              marginTop: 10,
                            }}>
                            {entry.proof?.map((proofItem: any) =>
                              proofItem.type === 'image' ? (
                                <Image
                                  key={proofItem._id}
                                  source={{uri: proofItem.url}}
                                  style={{
                                    width: 100,
                                    height: 100,
                                    margin: 5,
                                    borderRadius: 8,
                                    backgroundColor: '#ccc', // to see if image fails
                                  }}
                                  resizeMode="cover"
                                />
                              ) : null,
                            )}
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ))}

              <Button
                style={styles.joinButton}
                onPress={() => handleJoinGroup(groupId)}
                disabled={loading}>
                <Text style={styles.textColor}>
                  {loading
                    ? 'Processing...'
                    : hasRequested
                    ? 'Cancel Join Request'
                    : 'Request to Join'}
                </Text>
              </Button>
            </View>
          )}
          {/* leader board */}
          <Leaderboard groupId={groupId} />
        </>
      )}

      {admin_id && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showJoinRequests}
          onRequestClose={() => setShowJoinRequests(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Pending Join Requests</Text>
              <ScrollView>
                {pendingRequests.length === 0 ? (
                  <Text style={{textAlign: 'center'}}>
                    No pending requests.
                  </Text>
                ) : (
                  pendingRequests.map((user: any) => (
                    <View key={user._id} style={styles.memberItem}>
                      <Image
                        source={{uri: user.image}}
                        style={styles.memberImage}
                      />
                      <View>
                        <Text style={styles.memberName}>{user.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => acceptJoinRequest(user._id)}>
                        <Text style={{color: 'white'}}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                <Button onPress={() => setShowJoinRequests(false)}>
                  <Text> Close</Text>
                </Button>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
      <View style={styles.buttonContainer}>
        {editMode ? (
          <>
            <Button mode="contained" onPress={saveGroupChanges}>
              <Text>Save Changes</Text>
            </Button>
            <Button mode="outlined" onPress={() => setEditMode(false)}>
              <Text> Cancel</Text>
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
                  <Text> Edit Group</Text>
                </Button>
                <Button mode="outlined" onPress={handleDelete}>
                  <Text>Delete Group</Text>
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
  taskItemContainer: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  taskItemCompleted: {
    backgroundColor: '#e6f5e6',
  },
  taskText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskTextCompleted: {
    color: '#34c759',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f7f7f7',
  },
  textColor: {
    color: 'white',
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

  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
    gap: 10,
  },
  joinButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  acceptButton: {
    marginLeft: 'auto',
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 8,
  },
  pickerContainer: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  label1: {
    fontWeight: 'bold',
    marginVertical: 15,
  },
  picker: {
    backgroundColor: '#eee',
    borderRadius: 5,
  },
  taskContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  removeButton: {
    marginTop: 10,
    backgroundColor: 'red',
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  openButton: {
    padding: 10,
    backgroundColor: '#007bff',
    color: 'white',
    textAlign: 'center',
    borderRadius: 5,
    margin: 10,
    width: '50%',
  },
  closeButton: {
    color: '#007bff',
    textAlign: 'right',
    marginBottom: 10,
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 10,
    padding: 20,
    // elevation: 5,
    marginTop: 40,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  dayButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#aaa',
    backgroundColor: '#f0f0f0',
  },
  dayButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
});
