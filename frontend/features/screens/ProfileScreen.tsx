/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {Menu, Provider, Button, ActivityIndicator} from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import {launchImageLibrary} from 'react-native-image-picker';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {useGroup} from '../context/GroupContext';
import {FlatList} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';
import {API_URL} from '@env';

const ProfileScreen = ({route, navigation}: any) => {
  const {
    user,
    logout,
    updateUser,
    fetchUserProfile,
    currentUser,
    profileUser,
    setIsCurrentUser,
    fetchProfile,
    sendFollowRequest,
    unfollowUser,
    handleFollowRequest,
    pendingRequest,
    isGroupUpdated,
    getPendingRequests,
    joinRequests,
  }: any = useAuth();
  const {
    userGroups,
    loading: userGroupLoading,
    fetchUserGroups,
    handleJoinRequest,
    fetchGroups,
  } = useGroup();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [image, setImage] = useState(user?.image || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState(userGroups);
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);
  const [userListModalVisible, setUserListModalVisible] = useState(false); // New state for user list modal
  const [userListType, setUserListType] = useState<
    'followers' | 'following' | null
  >(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchUserGroups();
      if (profileUser && !currentUser) {
        setGroups(profileUser?.createdGroups);
        console.log('in u');
      }
      if (currentUser) {
        getPendingRequests();
        setGroups(userGroups);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userGroups.length, currentUser, profileUser, navigation]), // optional dependency if you still want to trigger on update
  );

  useFocusEffect(
    useCallback(() => {
      let uid = route?.params?.user?._id;
      if (uid && uid !== user?._id) {
        fetchUserProfile(uid);
        setIsCurrentUser(false);
      }
      return () => {
        setIsCurrentUser(true);
        navigation.setParams({user: null});
        fetchUserGroups();
        fetchProfile();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route?.params?.user?._id]),
  );

  useEffect(() => {
    if (profileUser && !currentUser) {
      setName(profileUser.name || '');
      setEmail(profileUser.email || '');
      setImage(profileUser.image || '');
      setGroups(profileUser?.createdGroups);
      console.log('in u');
    }
    if (currentUser) {
      setName(user?.name);
      setEmail(user?.email);
      setImage(user?.image);
      console.log('in');
      setGroups(userGroups);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUser, currentUser, isGroupUpdated, userGroups, navigation]);
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
          setImage(user?.imge);
        } else if (response.errorMessage) {
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
  const closeUserListModal = () => setUserListModalVisible(false);

  const openUserListModal = (type: 'followers' | 'following') => {
    setUserListType(type);
    setUserListModalVisible(true);
  };

  const handleJoinGroup = async (groupId: string) => {
    await handleJoinRequest(groupId);
    await fetchGroups();
  };

  const handleDeleteAccount = () => {
    Dialog.show({
      type: ALERT_TYPE.WARNING,
      title: 'Confirm Delete',
      textBody:
        'Are you sure you want to permanently delete your account? This action cannot be undone.',
      button: 'Delete',
      onPressButton: async () => {
        try {
          const token = user?.token; // Adjust based on how you're storing the token

          const response = await fetch(`${API_URL}/users/delete-account`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok) {
            Dialog.show({
              type: ALERT_TYPE.SUCCESS,
              title: 'Account Deleted',
              textBody: 'Your account has been successfully deleted.',
              button: 'OK',
              onPressButton: () => {
                logout(); // Clear user state
                navigation.reset({
                  index: 0,
                  routes: [{name: 'Login'}],
                });
              },
            });
          } else {
            Dialog.show({
              type: ALERT_TYPE.DANGER,
              title: 'Delete Failed',
              textBody: data.message || 'Failed to delete account',
              button: 'OK',
            });
          }
        } catch (error: any) {
          Dialog.show({
            type: ALERT_TYPE.DANGER,
            title: 'Error',
            textBody:
              error.message ||
              'Something went wrong while deleting the account.',
            button: 'OK',
          });
        }
      },
    });
  };

  return (
    <Provider>
      <View style={styles.menuContainer}>
        {currentUser && (
          <>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
                  <Icon name="bars" size={30} color="#333" />
                  {user?.pendingRequest?.length > 0 ||
                    (user?.joinRequests?.length > 0 && (
                      <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>
                          {user.pendingRequest.length +
                            user?.joinRequests?.length}
                        </Text>
                      </View>
                    ))}
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
              <Menu.Item
                onPress={handleDeleteAccount}
                title="Delete Account"
                titleStyle={{color: 'red'}}
              />
              {user?.pendingRequest?.length > 0 && (
                <Menu.Item
                  onPress={() => setShowPendingModal(true)}
                  title={`Requested Users (${user.pendingRequest.length})`}
                />
              )}

              <Menu.Item
                onPress={() => setShowJoinRequestModal(true)}
                title={`GroupJoinRequest (${user?.joinRequests?.length})`}
              />
            </Menu>
          </>
        )}
      </View>

      <Modal
        visible={showPendingModal}
        animationType="slide"
        transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              width: '85%',
              borderRadius: 10,
            }}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10}}>
              Pending Follow Requests
            </Text>
            {pendingRequest?.map((item: any) => (
              <View
                key={item?._id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                <Text>{item?.user.name}</Text>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <Button
                    onPress={async () => {
                      try {
                        setLoading(true);
                        await handleFollowRequest(item?.user._id, 'accept');
                        Dialog.show({
                          type: ALERT_TYPE.SUCCESS,
                          title: 'Accepted',
                          textBody: 'You have accepted the follow request.',
                          button: 'OK',
                        });
                        setShowPendingModal(false);
                      } catch (error) {
                      } finally {
                        setShowPendingModal(false);

                        setLoading(false);
                      }
                    }}>
                    Accept
                  </Button>
                  <Button
                    onPress={async () => {
                      try {
                        await handleFollowRequest(item?.user._id, 'reject');
                        Dialog.show({
                          type: ALERT_TYPE.SUCCESS,
                          title: 'Rejected',
                          textBody: 'You have rejected the follow request.',
                          button: 'OK',
                        });
                        setShowPendingModal(false);
                      } catch (error) {
                        // The error dialog is already handled inside handleFollowRequest
                      } finally {
                        await fetchProfile();
                        setShowPendingModal(false);
                        setLoading(false);
                      }
                    }}>
                    Reject
                  </Button>
                </View>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setShowPendingModal(false)}
              style={{marginTop: 10}}>
              <Text style={{color: 'blue', textAlign: 'center'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={userListModalVisible}
        animationType="slide"
        transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              width: '80%',
              borderRadius: 10,
            }}>
            <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
              User List
            </Text>
            <FlatList
              data={
                userListType === 'followers' ? user?.followers : user?.following
              }
              keyExtractor={item => item?._id}
              renderItem={({item}) => (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 10,
                  }}>
                  <Text>{item.name}</Text>
                  {userListType === 'following' && (
                    <TouchableOpacity
                      style={styles.unfollowButton}
                      onPress={async () => {
                        try {
                          await unfollowUser(item?._id);
                          Dialog.show({
                            type: ALERT_TYPE.SUCCESS,
                            title: 'Unfollowed',
                            textBody: 'You have unfollowed this user.',
                          });
                          fetchUserProfile(user?._id);
                        } catch (err: any) {
                          console.log(err);
                          Dialog.show({
                            type: ALERT_TYPE.DANGER,
                            title: 'Error',
                            textBody:
                              err.response?.data?.message ||
                              'Something went wrong.',
                          });
                        }
                      }}>
                      <Text style={styles.unfollowText}>❌</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              onPress={closeUserListModal}
              style={{marginTop: 10}}>
              <Text style={{color: 'blue', textAlign: 'center'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showJoinRequestModal}
        animationType="slide"
        transparent={true}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              width: '85%',
              borderRadius: 10,
              maxHeight: '80%',
            }}>
            <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10}}>
              Your Group Join Requests
            </Text>

            {joinRequests?.length === 0 ? (
              <Text>No pending requests.</Text>
            ) : (
              joinRequests?.map((g: any) => (
                <TouchableOpacity
                  key={g?._id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 15,
                    gap: 10,
                  }}
                  onPress={() => {
                    setShowJoinRequestModal(false); // Close modal
                    navigation.navigate('GroupDetails', {groupId: g._id}); // Navigate
                  }}>
                  {/* Group Image */}
                  <Image
                    source={{uri: g?.image || 'https://via.placeholder.com/60'}}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 10,
                      marginRight: 10,
                      backgroundColor: '#eee',
                    }}
                    resizeMode="cover"
                  />

                  {/* Group Info */}
                  <View style={{flex: 1}}>
                    <Text style={{fontWeight: '600'}}>{g?.title}</Text>
                    <Text style={{fontSize: 12, color: 'gray'}}>
                      {g?.goal || 'No goal'}
                    </Text>
                  </View>

                  {/* Cancel Button */}
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#ccc',
                      padding: 6,
                      borderRadius: 5,
                    }}
                    onPress={async e => {
                      e.stopPropagation(); // Prevent navigation on cancel
                      try {
                        setLoading(true);
                        await handleJoinGroup(g._id); // Cancel request
                        Dialog.show({
                          type: ALERT_TYPE.SUCCESS,
                          title: 'Cancelled',
                          textBody: 'Join request cancelled.',
                          button: 'OK',
                        });
                        await fetchProfile(); // Refresh data
                      } catch (error) {
                        Dialog.show({
                          type: ALERT_TYPE.DANGER,
                          title: 'Error',
                          textBody: 'Failed to cancel join request.',
                          button: 'OK',
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}>
                    <Text style={{fontSize: 12}}>Cancel</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              onPress={() => setShowJoinRequestModal(false)}
              style={{marginTop: 10}}>
              <Text style={{color: 'blue', textAlign: 'center'}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <View>
          {/* Menu Button */}

          {/* Profile Info */}
          <View style={styles.topGrid}>
            <View>
              <Image source={{uri: image}} style={styles.avatar} />
            </View>
            <View>
              <Text style={styles.name}>{name || 'Guest User'} </Text>
              {currentUser && <Text>{user?.totalStreak} 🐦‍🔥</Text>}
            </View>
            <View>
              {currentUser && (
                <View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Button onPress={() => openUserListModal('followers')}>
                      {user?.followers?.length}Followers
                    </Button>
                    <Button onPress={() => openUserListModal('following')}>
                      {user?.following?.length}Fllowing
                    </Button>
                  </View>
                </View>
              )}
            </View>
            {!currentUser && (
              <View style={{marginTop: 0}}>
                {user?.followers.some(
                  (f: {_id: {toString: () => any}}) =>
                    f._id.toString() === profileUser?._id.toString(),
                ) &&
                !user?.following.some(
                  (f: {_id: {toString: () => any}}) =>
                    f._id.toString() === profileUser?._id.toString(),
                ) ? (
                  <Button
                    onPress={async () => {
                      try {
                        await sendFollowRequest(profileUser?._id);
                        fetchProfile();
                        Dialog.show({
                          type: ALERT_TYPE.SUCCESS,
                          title: 'Follow Requested',
                          textBody: 'Follow request sent.',
                        });
                      } catch (err: any) {
                        console.log(err);
                        Dialog.show({
                          type: ALERT_TYPE.DANGER,
                          title: 'Error',
                          textBody: err.data.message,
                        });
                      }
                    }}>
                    Follow Back
                  </Button>
                ) : user?.following.some(
                    (f: {_id: {toString: () => any}}) =>
                      f._id.toString() === profileUser?._id.toString(),
                  ) ? (
                  <Button
                    onPress={async () => {
                      try {
                        await unfollowUser(profileUser._id);
                        Dialog.show({
                          type: ALERT_TYPE.SUCCESS,
                          title: 'Unfollowed',
                          textBody: 'You have unfollowed this user.',
                        });
                        fetchUserProfile(profileUser._id); // Refresh state
                      } catch (err: any) {
                        Dialog.show({
                          type: ALERT_TYPE.DANGER,
                          title: 'Error',
                          textBody: err.message,
                        });
                      }
                    }}>
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    onPress={async () => {
                      try {
                        await sendFollowRequest(profileUser._id);
                        fetchProfile();
                        Dialog.show({
                          type: ALERT_TYPE.SUCCESS,
                          title: 'Follow Requested',
                          textBody: 'Follow request sent.',
                        });
                      } catch (err: any) {
                        console.log(err);
                        Dialog.show({
                          type: ALERT_TYPE.DANGER,
                          title: 'Error',
                          textBody: err.data.message,
                        });
                      }
                    }}>
                    Follow
                  </Button>
                )}
              </View>
            )}
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
                  {image ? (
                    <Image source={{uri: image}} style={styles.image} />
                  ) : (
                    <Image source={{uri: user?.image}} style={styles.image} />
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
                    onPress={() => {
                      setName(user?.name);
                      setEmail(user?.email);
                      setImage(user?.image);
                      setEditModalVisible(false);
                    }}>
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
                <Text style={styles.sectionTitle}>Groups:</Text>
                {groups?.length > 0 ? (
                  <FlatList
                    data={groups}
                    numColumns={3}
                    keyExtractor={item => item._id}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={styles.gridItem}
                        onPress={() =>
                          navigation.navigate('GroupDetails', {
                            groupId: item._id,
                          })
                        }>
                        <View style={styles.imageContainer}>
                          <Image
                            source={{uri: item.image}}
                            style={styles.groupImage}
                            resizeMode="cover"
                          />
                          {currentUser && item?.joinRequests.length > 0 && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>
                                {item?.joinRequests?.length}
                              </Text>
                            </View>
                          )}
                        </View>
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
  followModel: {
    fontSize: 12,
  },
  topGrid: {
    flexDirection: 'row', // Arrange items horizontally
    flexWrap: 'wrap', // Wrap to next line if needed
    alignItems: 'center', // Center items vertically
    // marginBottom: 10,
    gap: 30,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },

  notificationText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  container: {
    // flex: 1,
    display: 'flex',
    marginTop: 40,
    justifyContent: 'center',
    // backgroundColor: '#fff',
    padding: 20,
  },
  imageContainer: {
    position: 'relative',
    width: 100, // adjust based on your layout
    height: 100,
    margin: 5,
  },

  groupImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },

  badge: {
    position: 'absolute',
    top: -6,
    right: -9,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 18,
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unfollowButton: {
    padding: 10,
    backgroundColor: 'lightgray',
    borderRadius: 8,
    alignItems: 'center',
  },

  unfollowText: {
    fontSize: 16,
    color: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  pendingRequestText: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 14,
    alignSelf: 'flex-end',
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
    marginTop: 5,
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
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },

  badgeText1: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
