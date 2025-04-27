import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  // FlatList,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {Menu, Provider, Button, ActivityIndicator} from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import {launchImageLibrary} from 'react-native-image-picker';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {useGroup} from '../context/GroupContext';
import {FlatList} from 'react-native';

const ProfileScreen = ({navigation}: any) => {
  const {user, logout, updateUser}: any = useAuth();
  const {userGroups, loading: userGroupLoading, fetchUserGroups} = useGroup();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [image, setImage] = useState(user?.image || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  console.log(name, email);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups, user]);
  const openEditModal = () => {
    setEditModalVisible(true);
    closeMenu();
  };
  const saveProfileChanges = async () => {
    setEditModalVisible(false);

    if (!user) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'User data is missing',
        button: 'OK',
      });
      return;
    }

    try {
      console.log('Updating Profile:', {name, email, password, image});

      setLoading(true);

      await updateUser(name, email, password, image)
        .then(() => {
          Dialog.show({
            type: ALERT_TYPE.SUCCESS,
            title: 'Success',
            textBody: 'Profile updated successfully!',
            button: 'OK',
          });
        })
        .then(() => {
          setLoading(false); // Stop loading
        });
    } catch (error: any) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Update Failed',
        textBody: error.response?.data?.message || 'Something went wrong',
        button: 'OK',
      });
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const selectImage = () => {
    launchImageLibrary(
      {mediaType: 'photo', includeBase64: false},
      (response: any) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.log('Image picker error: ', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          setImage(response.assets[0].uri);
        }
      },
    );
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <Provider>
         <View style={styles.menuContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
                <Icon name="bars" size={30} color="#333" />
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}>
            <Menu.Item onPress={openEditModal} title="Edit Profile" />
            <Menu.Item
              onPress={() => {
                logout();
                navigation.navigate('Login');
              }}
              title="Logout"
            />
          </Menu>
        </View>
      <View style={styles.container}>
      <View>
        {/* Menu Button */}
     

        {/* Profile Info */}
        <View style={styles.topGrid}>
          <View>
          {image && <Image source={{uri: image}} style={styles.avatar} />}

          </View>
          <View>
          <Text style={styles.name}>{name || 'Guest User'}</Text>

          </View>
        </View>
   
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              {/* Image Input */}
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={selectImage}>
                {user?.image ? (
                  <Image source={{uri: user?.image}} style={styles.image} />
                ) : (
                  <Image source={user?.image} style={styles.image} />
                )}
              </TouchableOpacity>

              {/* Name Input */}
              <TextInput
                style={styles.input}
                placeholder="Enter Name"
                value={name}
                onChangeText={setName}
              />

              {/* Email Input */}
              <TextInput
                style={styles.input}
                placeholder="Enter Email"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                style={styles.eyeIcon}>
                <Icon
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  style={{backgroundColor: 'tomato'}}
                  onPress={saveProfileChanges}>
                  Save
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setEditModalVisible(false)}>
                  Cancel
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <View>
        {userGroupLoading ? (
          <ActivityIndicator size="small" color="#1c1c1e" />
        ) : (
          <View>
            {/* User Groups */}
            <View style={styles.groupContainer}>
              <Text style={styles.sectionTitle}>Your Groups:</Text>

              {userGroups.length > 0 ? (
                <FlatList
                  data={userGroups}
                  numColumns={3} // 3 columns like Instagram
                  keyExtractor={item => item._id}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.gridItem}
                      onPress={() =>
                        navigation.navigate('GroupDetails', {group: item})
                      }>
                      <Image
                        source={{uri: item.image}} // Assuming you have group.imageUrl
                        style={styles.groupImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <Text style={styles.noGroupText}>
                  You are not part of any groups yet.
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  topGrid: {
    flexDirection: 'row',      // Arrange items horizontally
    flexWrap: 'wrap',          // Wrap to next line if needed
    alignItems: 'center',      // Center items vertically
    marginBottom: 10,      
    gap:30  
  },
  
  container: {
    // flex: 1,
    display: 'flex',
    marginTop: 40,
    justifyContent: 'center',
    // backgroundColor: '#fff',
    padding: 20,
  },
  menuContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  menuButton: {
    padding: 10,
  },
  menuContent: {
    marginTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 300,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  imagePicker: {
    width: 120,
    height: 120,
    backgroundColor: '#333',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  eyeIcon: {
    padding: 10,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  convoItem: {
    alignItems: 'center',
    margin: 5,
    width: 90,
  },
  convoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  convoName: {
    fontSize: 12,
    marginTop: 5,
  },
  groupItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  groupGoal: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  groupStreak: {
    fontSize: 14,
    color: 'tomato',
    marginTop: 4,
  },
  groupContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noGroupText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
  gridItem: {
    flex: 1 / 3, // 3 items per row
    aspectRatio: 1, // make it square
    padding: 6, // small space between images
  },
  groupImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8, // optional: rounded corners
  },
});

export default ProfileScreen;
