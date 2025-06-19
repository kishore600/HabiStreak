import React, {useState} from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  View,
  Button,
  StyleSheet,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {useGroup} from '../context/GroupContext';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {hobbies_enum} from '../constant';
import {MultiSelect} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Platform} from 'react-native';
import {Switch} from 'react-native-paper';

const CreateScreen = () => {
  const [groupTitle, setGroupTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [bannerImageUri, setBannerImageUri] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any>([]);
  const {createGroup, createLoading} = useGroup();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const categoryOptions = hobbies_enum.map(hobby => ({
    label: hobby,
    value: hobby,
  }));
  const [endDate, setEndDate] = useState('');
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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
    // Validate that all tasks have descriptions
    for (let i = 0; i < tasks.length; i++) {
      if (!tasks[i].description || tasks[i].description.trim() === '') {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Validation Error',
          textBody: 'Please enter a description for Task ${i + 1}.',
        });
        return;
      }
    }

    // If all descriptions are valid, add a new task
    setTasks((prevTasks: any) => [
      ...prevTasks,
      {title: '', description: '', requireProof: false, days: []},
    ]);
  };

  const handleRemoveTask = (index: number) => {
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
    console.log(value);
    setTasks((prevTasks: any) => {
      const updatedTasks = [...prevTasks];
      updatedTasks[index] = {
        ...updatedTasks[index],
        [field]: value,
      };
      return updatedTasks;
    });
  };

  const handleSubmit = async () => {
    try {
      if (!profileImageUri || !bannerImageUri) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: 'Please select an require images for the group.',
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

      // Ensure categories and endDate exist
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
      formData.append('endDate', endDate); // Must be a valid ISO or 'YYYY-MM-DD' string

      if (profileImageUri) {
        const filename = profileImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename ?? '');
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('profileImage', {
          uri: profileImageUri,
          name: filename,
          type,
        } as any);
      }

      if (bannerImageUri) {
        const filename = bannerImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename ?? '');
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('bannerImage', {
          uri: bannerImageUri,
          name: filename,
          type,
        } as any);
      }

      await createGroup(formData);
      setGroupTitle('');
      setGoal('');
      setTasks(['']);
      setProfileImageUri(null);
      setBannerImageUri(null);
      setSelectedCategories([]); // Reset categories
      setEndDate(''); // Reset end date
    } catch (error) {
      console.error('Error creating group:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Something went wrong while creating the group.',
      });
      setGroupTitle('');
      setGoal('');
      setTasks(['']);
      setSelectedCategories([]); // Reset categories
      setEndDate(''); // Reset end date
    }
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

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Create Group</Text>

      <TextInput
        placeholder="Group Title"
        value={groupTitle}
        onChangeText={setGroupTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Group Goal"
        value={goal}
        onChangeText={setGoal}
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handlePickProfileImage}
        style={styles.imagePicker}>
        {profileImageUri ? (
          <Image
            source={{uri: profileImageUri}}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              Select Profile Image
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Banner Image Picker */}
      <TouchableOpacity
        onPress={handlePickBannerImage}
        style={styles.imagePicker}>
        {bannerImageUri ? (
          <Image
            source={{uri: bannerImageUri}}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Select Banner Image</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.subheading}>Create Todo (Tasks)</Text>
      {tasks.map((task: any, index: number) => (
        <View key={index} style={styles.taskContainer}>
          <View style={styles.daysContainer}>
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

          <TextInput
            placeholder={`Task ${index + 1} Title`}
            value={task.title}
            onChangeText={text => handleTaskChange(index, 'title', text)}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <TextInput
            placeholder="Description"
            value={task.description}
            onChangeText={text => handleTaskChange(index, 'description', text)}
            style={[styles.input, {marginTop: 6}]}
            placeholderTextColor="#999"
            multiline
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

          <TouchableOpacity
            onPress={() => handleRemoveTask(index)}
            style={styles.removeButton}>
            <Text style={styles.removeButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button title="Add Task" onPress={handleAddTask} />
      <TouchableOpacity
        onPress={() => setShowEndDatePicker(true)}
        style={styles.input}>
        <Text style={{color: endDate ? '#000' : '#888'}}>
          {endDate || 'Select End Date'}
        </Text>
      </TouchableOpacity>

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          maximumDate={new Date(2100, 11, 31)} // optional
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

      <View style={{marginVertical: 20}}>
        <Button
          title={createLoading ? 'Laoding' : 'Create Group and Todo'}
          onPress={handleSubmit}
          color="#4CAF50"
          disabled={createLoading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
    marginTop: 50,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subheading: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  taskContainer: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 6,
    fontSize: 14,
    marginTop: 20,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    color: '#444',
  },
  removeButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f44',
    borderRadius: 4,
  },
  imagePicker: {
    marginBottom: 15,
    alignItems: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  imagePlaceholderText: {
    color: '#888',
    fontSize: 14,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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

export default CreateScreen;
