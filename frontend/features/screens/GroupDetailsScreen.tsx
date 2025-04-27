import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Button } from 'react-native-paper';

const GroupDetailsScreen = ({ route, navigation }: any) => {
  const { group } = route.params;
  const [groupData, setGroupData] = useState(group);

  console.log(groupData)
  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Call your delete group API here
            console.log('Group deleted!');
            navigation.goBack();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditGroup = () => {
    // TODO: Navigate to EditGroup screen or open a modal to edit
    console.log('Edit group');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{groupData.title}</Text>
      <Text style={styles.goal}>Goal: {groupData.goal}</Text>
      <Text style={styles.streak}>Group Streak: {groupData.streak}</Text>

      <Text style={styles.subTitle}>Members:</Text>
      <FlatList
        data={groupData.members}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.memberItem}>
            <Text style={styles.memberName}>{item.name}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
          </View>
        )}
      />

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          style={{ backgroundColor: 'tomato', marginBottom: 10 }}
          onPress={handleEditGroup}
        >
          Edit Group
        </Button>
        <Button mode="outlined" onPress={handleDeleteGroup}>
          Delete Group
        </Button>
      </View>
    </View>
  );
};

export default GroupDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop:50
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  goal: {
    fontSize: 18,
    marginBottom: 5,
  },
  streak: {
    fontSize: 18,
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  memberItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 20,
  },
});
