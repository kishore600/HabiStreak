/* eslint-disable curly */
import React, {useState, useRef, useEffect} from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  View,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useGroup} from '../context/GroupContext';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {hobbies_enum} from '../constant';
import {MultiSelect} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Platform} from 'react-native';
import {Switch} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
const {height,width} = Dimensions.get('window');

const CreateScreen = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [groupTitle, setGroupTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [bannerImageUri, setBannerImageUri] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any>([]);
  const {createGroup, createLoading} = useGroup();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [endDate, setEndDate] = useState('');
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const navigation = useNavigation<any>();

  // Carousel setup
  const carouselImages = [
     require('../../assets/banner1.png'),
  require('../../assets/banner2.png'),
  ];
  const flatListRef = useRef<FlatList>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
console.log(currentImageIndex)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % carouselImages.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Always ensure Task 1 exists when entering tasks tab
    if (currentTab === 2 && tasks.length === 0) {
      setTasks([{title: '', description: '', requireProof: false, days: []}]);
    }
  }, [currentTab, tasks.length]);

  const categoryOptions = hobbies_enum.map(hobby => ({
    label: hobby,
    value: hobby,
  }));

  const handlePickProfileImage = async () => {
    const result: any = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
    });
    if (result?.assets && result.assets.length > 0) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const handlePickBannerImage = async () => {
    const result: any = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
    });
    if (result?.assets && result.assets.length > 0) {
      setBannerImageUri(result.assets[0].uri);
    }
  };

  const handleAddTask = () => {
    setTasks((prevTasks: any) => [
      {title: '', description: '', requireProof: false, days: []},
      ...prevTasks,
    ]);
  };

  const handleRemoveTask = (index: number) => {
    // Don't allow removing the last task (Task 1)
    if (tasks.length <= 1) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: 'Cannot Remove',
        textBody: 'Task 1 is mandatory and cannot be removed.',
      });
      return;
    }

    const updatedTasks = [...tasks];
    updatedTasks.splice(index, 1);
    setTasks(updatedTasks);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setEndDate(formattedDate);
    }
  };

  const handleTaskChange = (index: number, field: string, value: any) => {
    setTasks((prevTasks: any) => {
      const updatedTasks = [...prevTasks];
      updatedTasks[index] = {
        ...updatedTasks[index],
        [field]: value,
      };
      return updatedTasks;
    });
  };

  const handleToggleDay = (taskIndex: any, day: any) => {
    const updatedTasks = [...tasks];
    const currentDays = updatedTasks[taskIndex].days || [];
    if (currentDays.includes(day)) {
      updatedTasks[taskIndex].days = currentDays.filter((d: any) => d !== day);
    } else {
      updatedTasks[taskIndex].days = [...currentDays, day];
    }
    setTasks(updatedTasks);
  };

  const handleSubmit = async () => {
    try {
      if (!profileImageUri || !bannerImageUri) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: 'Please select required images for the group.',
        });
        return;
      }

      const nonEmptyTasks = tasks.filter(
        (task: any) =>
          task.title.trim() !== '' || task.description.trim() !== '',
      );

      if (nonEmptyTasks.length === 0) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: 'Please add at least one todo task.',
        });
        return;
      }

      if (!selectedCategories || selectedCategories.length === 0) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: 'Please select at least one category.',
        });
        return;
      }

      if (!endDate) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: 'Please select an end date.',
        });
        return;
      }

      const formData = new FormData();
      formData.append('title', groupTitle);
      formData.append('goal', goal);
      formData.append('members', JSON.stringify([]));
      formData.append('tasks', JSON.stringify(nonEmptyTasks));
      formData.append('categories', JSON.stringify(selectedCategories));
      formData.append('endDate', endDate);

      if (profileImageUri) {
        const filename = profileImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename ?? '');
        const type = match ? `image/${match[1]}` : 'image';
        formData.append('profileImage', {
          uri: profileImageUri,
          name: filename,
          type,
        } as any);
      }

      if (bannerImageUri) {
        const filename = bannerImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename ?? '');
        const type = match ? `image/${match[1]}` : 'image';
        formData.append('bannerImage', {
          uri: bannerImageUri,
          name: filename,
          type,
        } as any);
      }

      await createGroup(formData);

      // Reset form
      setGroupTitle('');
      setGoal('');
      setTasks([]);
      setProfileImageUri(null);
      setBannerImageUri(null);
      setSelectedCategories([]);
      setEndDate('');
      setCurrentTab(0);
    } catch (error) {
      console.error('Error creating group:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Something went wrong while creating the group.',
      });
    }
  };

  const nextTab = () => {
    if (currentTab < 3) {
      setCurrentTab(currentTab + 1);
    }
  };

  const prevTab = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }else{
        navigation.goBack();
    }
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const renderCarouselItem = ({item}: {item: any}) => (
    <View style={styles.carouselItem}>
      <Image source={item} style={styles.carouselImage} resizeMode="contain" />
    </View>
  );

  const renderTabContent = () => {
  // Validation functions for each tab
  const isTab0Complete = () => {
    return groupTitle.trim() !== '' && goal.trim() !== '';
  };

  const isTab1Complete = () => {
    return profileImageUri !== null && bannerImageUri !== null;
  };

  const isTask1Complete = () => {
    if (tasks.length === 0) return false;
    const task1 = tasks[tasks.length - 1]; // Task 1 is at the end of array
    return task1.title.trim() !== '' && task1.description.trim() !== '';
  };

  const isTab3Complete = () => {
    return endDate !== '' && selectedCategories.length > 0;
  };

  switch (currentTab) {
    case 0:
      return (
        <View style={styles.tabContent}>
          <View style={styles.heroSection}>
            <FlatList
              ref={flatListRef}
              data={carouselImages}
              renderItem={renderCarouselItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
              style={styles.carousel}
            />
          </View>

          <TextInput
            placeholder="Squad Name *"
            value={groupTitle}
            onChangeText={setGroupTitle}
            style={[
              styles.input,
              groupTitle.trim() === '' && styles.inputError,
            ]}
            placeholderTextColor="#666"
          />

          <TextInput
            placeholder="Squad Goal *"
            value={goal}
            onChangeText={setGoal}
            style={[
              styles.input,
              goal.trim() === '' && styles.inputError,
            ]}
            placeholderTextColor="#666"
            multiline
          />

          <TouchableOpacity
            onPress={nextTab}
            style={[
              styles.continueButtonInline,
              !isTab0Complete() && styles.disabledButton,
            ]}
            disabled={!isTab0Complete()}>
            <Text style={styles.continueButtonText}>CREATE A NEW SQUAD</Text>
          </TouchableOpacity>
        </View>
      );

    case 1:
      return (
        <View style={styles.tabContent}>
          <Text style={styles.tabTitle}>SQUAD PROFILE IMAGE *</Text>

          <TouchableOpacity
            onPress={handlePickProfileImage}
            style={[
              styles.circularImagePicker,
              !profileImageUri && styles.imagePickerError,
            ]}>
            {profileImageUri ? (
              <Image
                source={{uri: profileImageUri}}
                style={styles.circularImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.circularPlaceholder}>
                <Text style={styles.plusIcon}>+</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.tabTitle}>BANNER IMAGE *</Text>

          <TouchableOpacity
            onPress={handlePickBannerImage}
            style={[
              styles.bannerImagePicker,
              !bannerImageUri && styles.imagePickerError,
            ]}>
            {bannerImageUri ? (
              <Image
                source={{uri: bannerImageUri}}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Text style={styles.placeholderText}>Select Banner Image</Text>
              </View>
            )}
          </TouchableOpacity>


          <TouchableOpacity
            onPress={nextTab}
            style={[
              styles.continueButtonInline,
              !isTab1Complete() && styles.disabledButton,
            ]}
            disabled={!isTab1Complete()}>
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      );

    case 2:
      return (
        <View style={styles.tabContent}>
          <Text style={styles.tabTitle}>CREATE TASKS</Text>

          {tasks.length === 0 ? (
            <View style={styles.noTasksContainer}>
              <Text style={styles.noTasksText}>No tasks added yet</Text>
              <TouchableOpacity onPress={handleAddTask} style={styles.addTaskButton}>
                <Text style={styles.addTaskButtonText}>+ Add Your First Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.tasksScrollView} showsVerticalScrollIndicator={true}>
                {tasks.map((task: any, index: number) => (
                  <View key={index} style={styles.taskContainer}>
                    <View style={styles.taskHeader}>
                      <View style={styles.taskTitleContainer}>
                        <Text style={styles.taskNumber}>Task {tasks.length - index}</Text>
                        {tasks.length - index === 1 && (
                          <Text style={styles.mandatoryLabel}> (Required)</Text>
                        )}
                      </View>
                      {/* Only show remove button if it's not Task 1 (not the last item) */}
                      {index !== tasks.length - 1 && (
                        <TouchableOpacity
                          onPress={() => handleRemoveTask(index)}
                          style={styles.removeButton}>
                          <Text style={styles.removeButton}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.daysContainer}>
                      <Text style={styles.daysLabel}>Select Days:</Text>
                      <View style={styles.daysButtonsContainer}>
                        {weekdays.map(day => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayButton,
                              task?.days?.includes(day) && styles.dayButtonSelected,
                            ]}
                            onPress={() => handleToggleDay(index, day)}>
                            <Text
                              style={[
                                styles.dayButtonText,
                                task?.days?.includes(day) && styles.dayButtonTextSelected,
                              ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TextInput
                      placeholder={`Task ${tasks.length - index} Title *`}
                      value={task.title}
                      onChangeText={text => handleTaskChange(index, 'title', text)}
                      style={[
                        styles.input,
                        tasks.length - index === 1 && task.title.trim() === '' && styles.inputError,
                      ]}
                      placeholderTextColor="#666"
                    />

                    <TextInput
                      placeholder="Description *"
                      value={task.description}
                      onChangeText={text => handleTaskChange(index, 'description', text)}
                      style={[
                        styles.input,
                        {marginTop: 8, minHeight: 80},
                        tasks.length - index === 1 && task.description.trim() === '' && styles.inputError,
                      ]}
                      placeholderTextColor="#666"
                      multiline
                      textAlignVertical="top"
                    />

                    <View style={styles.switchContainer}>
                      <Text style={styles.switchLabel}>Require Proof</Text>
                      <Switch
                        value={task.requireProof}
                        onValueChange={value =>
                          handleTaskChange(index, 'requireProof', value)
                        }
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity onPress={handleAddTask} style={styles.addTaskButton}>
                <Text style={styles.addTaskButtonText}>+ Add Another Task</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={nextTab}
            style={[
              styles.continueButtonInline,
              !isTask1Complete() && styles.disabledButton,
            ]}
            disabled={!isTask1Complete()}>
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      );

    case 3:
      return (
        <View style={styles.tabContent}>
          <Text style={styles.tabTitle}>FINALIZE SQUAD</Text>

          <TouchableOpacity
            onPress={() => setShowEndDatePicker(true)}
            style={[
              styles.dateInput,
              endDate === '' && styles.inputError,
            ]}>
            <Text style={{color: endDate ? '#fff' : '#666'}}>
              {endDate || 'Select End Date *'}
            </Text>
          </TouchableOpacity>

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate ? new Date(endDate) : new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              maximumDate={new Date(2100, 11, 31)}
            />
          )}

          <Text style={styles.subheading}>Select Categories *</Text>
          <MultiSelect
            mode="modal"
            style={[
              styles.input,
              {paddingHorizontal: 10},
              selectedCategories.length === 0 && styles.inputError,
            ]}
            placeholderStyle={{color: '#666'}}
            selectedTextStyle={{color: '#fff'}}
            inputSearchStyle={{height: 40, fontSize: 16, backgroundColor: '#2a2a2a', color: '#fff'}}
            data={categoryOptions}
            labelField="label"
            valueField="value"
            placeholder="Select Categories *"
            search
            searchPlaceholder="Search..."
            value={selectedCategories}
            onChange={item => {
              setSelectedCategories(item);
            }}
            selectedStyle={{borderRadius: 12, backgroundColor: '#444'}}
            maxSelect={10}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.continueButtonInline,
              (!isTab3Complete() || createLoading) && styles.disabledButton,
            ]}
            disabled={!isTab3Complete() || createLoading}>
            <Text style={styles.continueButtonText}>
              {createLoading ? 'CREATING...' : 'CREATE YOUR SQUAD'}
            </Text>
          </TouchableOpacity>
        </View>
      );

    default:
      return null;
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevTab} style={styles.backButton}>
          <Text style={styles.backButtonText} >←</Text>
        </TouchableOpacity>
        <View style={styles.progressDots}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentTab === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#8B5CF6',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    flex: 1,
    paddingVertical: 20,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#fff',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  carousel: {
    height: 200,
  },
  carouselItem: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft:-20,
  },
  carouselImage: {
    width: width * 0.8,
    height: height * 4.4,
     resizeMode: 'cover',   
  },
  carouselDots: {
    flexDirection: 'row',
    marginTop: 15,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },
  activeCarouselDot: {
    backgroundColor: '#8B5CF6',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    color: '#fff',
  },
  circularImagePicker: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  circularImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  circularPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#555',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 40,
    color: '#666',
  },
  bannerImagePicker: {
    height: 100,
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#555',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  tasksScrollView: {
    maxHeight: 400,
    marginBottom: 10,
  },
  taskContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#444',
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#ccc',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: '#fff',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTaskButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  addTaskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  continueButtonInline: {
    backgroundColor: '#8B5CF6',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  noTasksContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTasksText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  taskNumber: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  daysLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  daysButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mandatoryLabel: {
    color: '#ff6b6b',
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputError: {
    // borderColor: '',
    borderWidth: 2,
  },
  imagePickerError: {
    // borderColor: '#ff4444',
    // borderWidth: 2,
  },
  validationText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
});

export default CreateScreen;