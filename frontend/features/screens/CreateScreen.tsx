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
import * as ImagePicker from 'react-native-image-picker';
import {useGroup} from '../context/GroupContext';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {hobbies_enum} from '../constant';
import {MultiSelect} from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Platform} from 'react-native';

const CreateScreen = () => {
  const [groupTitle, setGroupTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [tasks, setTasks] = useState<string[]>(['']);
  const {createGroup, loading} = useGroup();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const categoryOptions = hobbies_enum.map(hobby => ({
    label: hobby,
    value: hobby,
  }));
  const [endDate, setEndDate] = useState('');
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handlePickImage = () => {
    ImagePicker.launchImageLibrary(
      {mediaType: 'photo', quality: 1},
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          setImageUri(response.assets[0].uri as any);
        }
      },
    );
  };

  const handleAddTask = () => {
    setTasks([...tasks, '']);
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

  const handleTaskChange = (text: string, index: number) => {
    const updatedTasks = [...tasks];
    updatedTasks[index] = text;
    setTasks(updatedTasks);
  };
  const handleSubmit = async () => {
    try {
      if (!imageUri) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: 'Please select an image for the group.',
        });
        return;
      }
  
      const nonEmptyTasks = tasks.filter(task => task.trim() !== '');
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
  
      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename ?? '');
        const type = match ? `image/${match[1]}` : `image`;
  
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }
  
      await createGroup(formData);
      setGroupTitle('');
      setGoal('');
      setTasks(['']);
      setImageUri(null);
      setSelectedCategories([]); // Reset categories
      setEndDate('');  // Reset end date
  
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
      setImageUri(null);
      setSelectedCategories([]); // Reset categories
      setEndDate('');  // Reset end date
    }
  };
  

  console.log(loading);
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

      <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
        {imageUri ? (
          <Image source={{uri: imageUri}} style={styles.image} />
        ) : (
          <Text>Place Image</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.subheading}>Create Todo (Tasks)</Text>

      {tasks.map((task, index) => (
        <View key={index} style={styles.taskContainer}>
          <TextInput
            placeholder={`Task ${index + 1}`}
            value={task}
            onChangeText={text => handleTaskChange(text, index)}
            style={[styles.input, {flex: 1}]}
          />
          <TouchableOpacity
            onPress={() => handleRemoveTask(index)}
            style={styles.removeButton}>
            <Text style={{color: 'white'}}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button title="Add Another Task" onPress={handleAddTask} />
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
          title={loading ? 'Laoding' : 'Create Group and Todo'}
          onPress={handleSubmit}
          color="#4CAF50"
          disabled={loading}
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
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  imagePicker: {
    height: 150,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  removeButton: {
    backgroundColor: '#e53935',
    padding: 10,
    marginLeft: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
});

export default CreateScreen;
