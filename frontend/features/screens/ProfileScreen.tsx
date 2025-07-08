/* eslint-disable react/no-unstable-nested-components */

/* eslint-disable react-native/no-inline-styles */
import {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {Menu, Provider, ActivityIndicator} from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import {launchImageLibrary} from 'react-native-image-picker';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {useGroup} from '../context/GroupContext';
import {FlatList} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';
import {API_URL} from '@env';
import WeeklyStatsDisplay from '../components/WeeklyStatsDisplay';
import React from 'react';

const {width} = Dimensions.get('window');

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
  const [userListModalVisible, setUserListModalVisible] = useState(false);
  const [userListType, setUserListType] = useState<
    'followers' | 'following' | null
  >(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showReleaseNotesModal, setShowReleaseNotesModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Release Notes Data
  const releaseNotes = [
    {
      version: '2.1.0',
      date: 'January 2025',
      features: [
        '🎯 Enhanced task completion with proof verification',
        '📊 New analytics dashboard with detailed insights',
        '🔥 Improved streak tracking system',
        '👥 Better group management tools',
        '🎨 Updated UI with modern design elements',
      ],
      fixes: [
        'Fixed notification timing issues',
        'Resolved image upload problems',
        'Improved app performance and stability',
      ],
    },
    {
      version: '2.0.5',
      date: 'December 2024',
      features: [
        '📱 Push notifications for daily reminders',
        '🏆 Leaderboard system for group competition',
        '📅 Flexible task scheduling (daily/weekly)',
        '🔒 Enhanced privacy settings',
      ],
      fixes: [
        'Fixed group creation bugs',
        'Improved sync across devices',
        'Better error handling',
      ],
    },
    {
      version: '2.0.0',
      date: 'November 2024',
      features: [
        '🚀 Major app redesign',
        '👥 Auto-forming habit groups',
        '📸 Photo/video proof system',
        '📈 Personal progress tracking',
        '🎯 Category-based habit organization',
      ],
      fixes: [
        'Complete backend overhaul',
        'Improved data synchronization',
        'Enhanced security measures',
      ],
    },
  ];

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleMenuAction = (action: () => void) => {
    closeMenu();
    // Small delay to ensure menu closes before opening modal
    setTimeout(action, 100);
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserGroups();
      if (profileUser && !currentUser) {
        console.log(profileUser);
        // Assuming profileUser is your object containing user data
        const allGroupsMap = new Map();

        // Add createdGroups
        profileUser?.createdGroups?.forEach((group: any) => {
          allGroupsMap.set(group._id, group);
        });

        // Add joinedGroups (only if not already in createdGroups)
        profileUser?.joinedGroups?.forEach((groupId: any) => {
          // If the group is not already present in createdGroups
          if (!allGroupsMap.has(groupId)) {
            // You’ll need full group data here, fetch if necessary
            // For now we store only the id (could be replaced with full group data later)
            allGroupsMap.set(groupId, {_id: groupId});
          }
        });

        const allGroups = Array.from(allGroupsMap.values());
        setGroups(allGroups);

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
      let uid = route?.params?.user?._id || route?.params?.userId;
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

  const filteredUsers = useMemo(() => {
    const list =
      userListType === 'followers' ? user?.followers : user?.following;
    // eslint-disable-next-line curly
    if (!list) return [];
    return list.filter((u: any) =>
      u?.name?.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [searchText, userListType, user]);

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
          setLoading(false);
        });
    } catch (error: any) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Update Failed',
        textBody: error.response?.data?.message || 'Something went wrong',
        button: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectImage = () => {
    launchImageLibrary(
      {mediaType: 'photo', includeBase64: false},
      (response: any) => {
        if (response.didCancel) {
          setImage(user?.image);
        } else if (response.errorMessage) {
        } else if (response.assets && response.assets.length > 0) {
          setImage(response.assets[0].uri);
        }
      },
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
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
          const token = user?.token;
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
                logout();
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

  // About App Modal Component
  const AboutModal = () => (
    <Modal
      visible={showAboutModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAboutModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.aboutModalContent}>
          <View style={styles.aboutModalHeader}>
            <Text style={styles.aboutModalTitle}>About This App</Text>
            <TouchableOpacity
              onPress={() => setShowAboutModal(false)}
              style={styles.aboutCloseButton}>
              <Icon name="times" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.aboutModalScroll}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.aboutWelcomeText}>
              Welcome to the ultimate social habit-tracking app designed to make
              habit-building fun, social, and consistent.
            </Text>

            <Text style={styles.aboutDescriptionText}>
              With this app, users can effortlessly create and track personal
              habits—whether it's drinking more water, working out daily,
              journaling, or learning a new skill. But the real magic happens
              when{' '}
              <Text style={styles.aboutBoldText}>
                two or more users share the same habit and follow each other.
              </Text>
            </Text>

            <Text style={styles.aboutDescriptionText}>
              When that happens, the app{' '}
              <Text style={styles.aboutBoldText}>
                automatically forms a habit group.
              </Text>{' '}
              These groups unite users with common goals, turning personal
              growth into a shared journey. Every day, members are prompted to
              complete a{' '}
              <Text style={styles.aboutBoldText}>daily to-do task</Text> related
              to their shared habit. The goal?{' '}
              <Text style={styles.aboutBoldText}>
                Everyone in the group must complete the task for that day to
                maintain the streak.
              </Text>{' '}
              If even one person misses, the group's streak resets. It's a
              simple yet powerful system that transforms social accountability
              into motivation.
            </Text>

            <Text style={styles.aboutFeaturesTitle}>Key features include:</Text>

            <View style={styles.aboutFeatureItem}>
              <Text style={styles.aboutFeatureEmoji}>✅</Text>
              <View style={styles.aboutFeatureContent}>
                <Text style={styles.aboutFeatureTitle}>
                  Create and track personal habits
                </Text>
                <Text style={styles.aboutFeatureDescription}>
                  Build custom daily, weekly, or flexible habits with reminders
                  and progress visualization.
                </Text>
              </View>
            </View>

            <View style={styles.aboutFeatureItem}>
              <Text style={styles.aboutFeatureEmoji}>👥</Text>
              <View style={styles.aboutFeatureContent}>
                <Text style={styles.aboutFeatureTitle}>
                  Auto-forming Habit Groups
                </Text>
                <Text style={styles.aboutFeatureDescription}>
                  Follow a friend who shares the same habit, and the app will
                  create a habit group automatically.
                </Text>
              </View>
            </View>

            <View style={styles.aboutFeatureItem}>
              <Text style={styles.aboutFeatureEmoji}>🔥</Text>
              <View style={styles.aboutFeatureContent}>
                <Text style={styles.aboutFeatureTitle}>
                  Group Streaks for Motivation
                </Text>
                <Text style={styles.aboutFeatureDescription}>
                  Everyone must complete their daily task to keep the group's
                  streak going. One miss resets it!
                </Text>
              </View>
            </View>

            <View style={styles.aboutFeatureItem}>
              <Text style={styles.aboutFeatureEmoji}>📅</Text>
              <View style={styles.aboutFeatureContent}>
                <Text style={styles.aboutFeatureTitle}>
                  Daily To-Do Reminders
                </Text>
                <Text style={styles.aboutFeatureDescription}>
                  Stay on track with notifications and reminders tailored to
                  your goals and group progress.
                </Text>
              </View>
            </View>

            <View style={styles.aboutFeatureItem}>
              <Text style={styles.aboutFeatureEmoji}>📊</Text>
              <View style={styles.aboutFeatureContent}>
                <Text style={styles.aboutFeatureTitle}>
                  Analytics and Progress Insights
                </Text>
                <Text style={styles.aboutFeatureDescription}>
                  Track your individual progress and compare with your group for
                  extra accountability.
                </Text>
              </View>
            </View>

            <Text style={styles.aboutClosingText}>
              The app is designed to boost{' '}
              <Text style={styles.aboutBoldText}>
                consistency through community.
              </Text>{' '}
              Whether you're forming a small accountability group with friends,
              or joining strangers working on similar goals, you'll find
              strength in numbers and purpose in progress.
            </Text>

            <Text style={styles.aboutTaglineText}>
              You don't just build habits—you build momentum, one day at a time.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Release Notes Modal Component
  const ReleaseNotesModal = () => (
    <Modal
      visible={showReleaseNotesModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowReleaseNotesModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.aboutModalContent}>
          <View style={styles.aboutModalHeader}>
            <Text style={styles.aboutModalTitle}>Release Notes</Text>
            <TouchableOpacity
              onPress={() => setShowReleaseNotesModal(false)}
              style={styles.aboutCloseButton}>
              <Icon name="times" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.aboutModalScroll}
            showsVerticalScrollIndicator={false}>
            {releaseNotes.map((release, index) => (
              <View key={index} style={styles.releaseItem}>
                <View style={styles.releaseHeader}>
                  <Text style={styles.releaseVersion}>
                    Version {release.version}
                  </Text>
                  <Text style={styles.releaseDate}>{release.date}</Text>
                </View>

                <View style={styles.releaseSection}>
                  <Text style={styles.releaseSectionTitle}>
                    🎉 New Features
                  </Text>
                  {release.features.map((feature, featureIndex) => (
                    <Text key={featureIndex} style={styles.releaseFeature}>
                      {feature}
                    </Text>
                  ))}
                </View>

                <View style={styles.releaseSection}>
                  <Text style={styles.releaseSectionTitle}>
                    🔧 Bug Fixes & Improvements
                  </Text>
                  {release.fixes.map((fix, fixIndex) => (
                    <Text key={fixIndex} style={styles.releaseFix}>
                      • {fix}
                    </Text>
                  ))}
                </View>

                {index < releaseNotes.length - 1 && (
                  <View style={styles.releaseDivider} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
    // eslint-disable-next-line semi
  );

  return (
    <Provider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <View style={styles.backButtonCircle}>
              <Text style={styles.backButtonText}>←</Text>
            </View>
          </TouchableOpacity>
          {currentUser && (
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
                  <Icon name="bars" size={24} color="#fff" />
                  {(user?.pendingRequest?.length > 0 ||
                    user?.joinRequests?.length > 0) && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>
                        {user.pendingRequest.length +
                          user?.joinRequests?.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              }
              contentStyle={styles.menuContent}>
              <Menu.Item
                onPress={() => handleMenuAction(openEditModal)}
                title="Edit Profile"
                titleStyle={{color: 'white'}}
              />
              <Menu.Item
                onPress={() =>
                  handleMenuAction(() => {
                    logout();
                    navigation.navigate('Login');
                  })
                }
                title="Logout"
                titleStyle={{color: 'white'}}
              />
              <Menu.Item
                onPress={() => handleMenuAction(handleDeleteAccount)}
                title="Delete Account"
                titleStyle={{color: 'red'}}
              />
              {user?.pendingRequest?.length > 0 && (
                <Menu.Item
                  onPress={() =>
                    handleMenuAction(() => setShowPendingModal(true))
                  }
                  title={`Requested Users (${user.pendingRequest.length})`}
                  titleStyle={{color: 'white'}}
                />
              )}
              <Menu.Item
                onPress={() =>
                  handleMenuAction(() => setShowJoinRequestModal(true))
                }
                title={`GroupJoinRequest (${user?.joinRequests?.length})`}
                titleStyle={{color: 'white'}}
              />
              <Menu.Item
                onPress={() => handleMenuAction(() => setShowAboutModal(true))}
                title="About App"
                titleStyle={{color: 'white'}}
              />
              <Menu.Item
                onPress={() =>
                  handleMenuAction(() => setShowReleaseNotesModal(true))
                }
                title="Release Notes"
                titleStyle={{color: 'white'}}
              />
            </Menu>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Image source={{uri: image}} style={styles.avatar} />
            <Text style={styles.name}>{name || 'Guest User'}</Text>
            {currentUser && (
              <View style={styles.streakContainer}>
                <Text style={styles.streakText}>{user?.totalStreak}</Text>
                <Text style={styles.fireEmoji}>🔥</Text>
              </View>
            )}
          </View>

          {/* Followers/Following */}
          {currentUser && (
            <View style={styles.followSection}>
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => openUserListModal('followers')}>
                <Text style={styles.followCount}>
                  {user?.followers?.length}
                </Text>
                <Text style={styles.followLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.followButton}
                onPress={() => openUserListModal('following')}>
                <Text style={styles.followCount}>
                  {user?.following?.length}
                </Text>
                <Text style={styles.followLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Weekly Stats */}
          {currentUser && user?.weeklyStats && user?.weeklyOption && (
            <View style={styles.weeklyStatsContainer}>
              <WeeklyStatsDisplay
                weeklyStats={user.weeklyStats}
                weeklyOption={user.weeklyOption}
              />
            </View>
          )}

          {/* Follow/Unfollow Button for Other Users */}
          {!currentUser && (
            <View style={styles.followActionContainer}>
              {user?.followers.some(
                (f: {_id: {toString: () => any}}) =>
                  f._id.toString() === profileUser?._id.toString(),
              ) &&
              !user?.following.some(
                (f: {_id: {toString: () => any}}) =>
                  f._id.toString() === profileUser?._id.toString(),
              ) ? (
                <TouchableOpacity
                  style={styles.followActionButton}
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
                  <Text style={styles.followActionText}>Follow Back</Text>
                </TouchableOpacity>
              ) : user?.following.some(
                  (f: {_id: {toString: () => any}}) =>
                    f._id.toString() === profileUser?._id.toString(),
                ) ? (
                <TouchableOpacity
                  style={[
                    styles.followActionButton,
                    styles.unfollowActionButton,
                  ]}
                  onPress={async () => {
                    try {
                      await unfollowUser(profileUser._id);
                      Dialog.show({
                        type: ALERT_TYPE.SUCCESS,
                        title: 'Unfollowed',
                        textBody: 'You have unfollowed this user.',
                      });
                      fetchUserProfile(profileUser._id);
                    } catch (err: any) {
                      Dialog.show({
                        type: ALERT_TYPE.DANGER,
                        title: 'Error',
                        textBody: err.message,
                      });
                    }
                  }}>
                  <Text style={styles.followActionText}>Unfollow</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.followActionButton}
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
                  <Text style={styles.followActionText}>Follow</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Groups Section */}
          <View style={styles.groupsSection}>
            <Text style={styles.groupsTitle}>Groups:</Text>
            {userGroupLoading ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : groups?.length > 0 ? (
              <View style={styles.groupsGrid}>
                {groups.map((item: any) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.groupItem}
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

                      {/* 👇 Group name centered over image */}
                      <View style={styles.groupNameOverlay}>
                        <Text style={styles.groupNameText}>{item.title}</Text>
                      </View>

                      {/* 👇 Badge for join requests */}
                      {currentUser && user._id === item?.admin && item?.joinRequests.length > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>
                            {item?.joinRequests?.length}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noGroupText}>
                You are not part of any groups yet.
              </Text>
            )}
          </View>
        </ScrollView>

        {/* About App Modal */}
        <AboutModal />

        {/* Release Notes Modal */}
        <ReleaseNotesModal />

        {/* All existing modals remain the same */}
        <Modal
          visible={showPendingModal}
          animationType="slide"
          transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.darkModalContent}>
              <Text style={styles.darkModalTitle}>Pending Follow Requests</Text>
              {pendingRequest?.map((item: any) => (
                <View key={item?._id} style={styles.requestItem}>
                  <Text style={styles.requestText}>{item?.user.name}</Text>
                  <View style={styles.requestButtons}>
                    <TouchableOpacity
                      style={styles.acceptButton}
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
                      <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
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
                        } finally {
                          await fetchProfile();
                          setShowPendingModal(false);
                          setLoading(false);
                        }
                      }}>
                      <Text style={styles.buttonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => setShowPendingModal(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={userListModalVisible}
          animationType="slide"
          transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.darkModalContent}>
              <Text style={styles.darkModalTitle}>
                {userListType === 'followers' ? 'Followers' : 'Following'}
              </Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#888"
                value={searchText}
                onChangeText={setSearchText}
              />
              <FlatList
                data={filteredUsers}
                keyExtractor={item => item?._id}
                contentContainerStyle={{paddingBottom: 80}}
                renderItem={({item}) => (
                  <View style={styles.userListItem}>
                    <Text style={styles.userListText}>{item.name}</Text>
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
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showJoinRequestModal}
          animationType="slide"
          transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.darkModalContent}>
              <Text style={styles.darkModalTitle}>
                Your Group Join Requests
              </Text>
              {joinRequests?.length === 0 ? (
                <Text style={styles.noRequestsText}>No pending requests.</Text>
              ) : (
                joinRequests?.map((g: any) => (
                  <TouchableOpacity
                    key={g?._id}
                    style={styles.joinRequestItem}
                    onPress={() => {
                      setShowJoinRequestModal(false);
                      navigation.navigate('GroupDetails', {groupId: g._id});
                    }}>
                    <Image
                      source={{
                        uri: g?.image || 'https://via.placeholder.com/60',
                      }}
                      style={styles.joinRequestImage}
                      resizeMode="cover"
                    />
                    <View style={styles.joinRequestInfo}>
                      <Text style={styles.joinRequestTitle}>{g?.title}</Text>
                      <Text style={styles.joinRequestGoal}>
                        {g?.goal || 'No goal'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.cancelRequestButton}
                      onPress={async e => {
                        e.stopPropagation();
                        try {
                          setLoading(true);
                          await handleJoinGroup(g._id);
                          Dialog.show({
                            type: ALERT_TYPE.SUCCESS,
                            title: 'Cancelled',
                            textBody: 'Join request cancelled.',
                            button: 'OK',
                          });
                          await fetchProfile();
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
                      <Text style={styles.cancelRequestText}>Cancel</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                onPress={() => setShowJoinRequestModal(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.darkModalContent}>
              <Text style={styles.darkModalTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={selectImage}>
                {image ? (
                  <Image source={{uri: image}} style={styles.image} />
                ) : (
                  <Image source={{uri: user?.image}} style={styles.image} />
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Enter Name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, {flex: 1, marginBottom: 0}]}
                  placeholder="Password"
                  placeholderTextColor="#666"
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
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveProfileChanges}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setName(user?.name);
                    setEmail(user?.email);
                    setImage(user?.image);
                    setEditModalVisible(false);
                  }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    marginTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  menuButton: {
    position: 'relative',
    padding: 10,
  },
  menuContent: {
    backgroundColor: '#2a2a2a',
    marginTop: 40,
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
    color: '#fff',
    marginRight: 5,
  },
  fireEmoji: {
    fontSize: 16,
  },
  followSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 40,
  },
  followButton: {
    alignItems: 'center',
  },
  followCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  followLabel: {
    fontSize: 14,
    color: 'white',
  },
  weeklyStatsContainer: {
    marginBottom: 20,
  },
  followActionContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  followActionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  unfollowActionButton: {
    backgroundColor: '#666',
  },
  followActionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  groupsSection: {
    marginTop: 20,
  },
  searchInput: {
    height: 40,
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#fff',
    marginBottom: 12,
  },
  groupsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  groupItem: {
    width: '48%', // ~2 items per row with spacing
    aspectRatio: 1, // makes the item square
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  groupImage: {
    width: '100%',
    height: (width - 60) / 3,
    borderRadius: 10,
  },
  groupNameOverlay: {
    position: 'absolute',
    top: '50%',
    left: '30%',
    transform: [{translateX: -50}, {translateY: -50}],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // semi-transparent background
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },

  groupNameText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  badge: {
    position: 'absolute',
    top: 2,
    right: -1,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  noGroupText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  darkModalContent: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    width: '85%',
    borderRadius: 15,
    maxHeight: '80%',
  },
  darkModalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 15,
    color: '#fff',
    textAlign: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  requestText: {
    color: '#fff',
    fontSize: 16,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  userListText: {
    color: '#fff',
    fontSize: 16,
  },
  unfollowButton: {
    padding: 8,
    backgroundColor: '#666',
    borderRadius: 8,
    alignItems: 'center',
  },
  unfollowText: {
    fontSize: 16,
  },
  noRequestsText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 20,
  },
  joinRequestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  joinRequestImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#444',
  },
  joinRequestInfo: {
    flex: 1,
  },
  joinRequestTitle: {
    fontWeight: '600',
    color: '#fff',
    fontSize: 16,
  },
  joinRequestGoal: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cancelRequestButton: {
    backgroundColor: '#666',
    padding: 8,
    borderRadius: 6,
  },
  cancelRequestText: {
    fontSize: 12,
    color: '#fff',
  },
  // Edit Modal Styles
  imagePicker: {
    width: 100,
    height: 100,
    backgroundColor: '#444',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#1a1a1a',
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#666',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // About Modal Styles
  aboutModalContent: {
    backgroundColor: '#1a1a1a',
    width: '95%',
    height: '90%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  aboutModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  aboutModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  aboutCloseButton: {
    padding: 5,
  },
  aboutModalScroll: {
    flex: 1,
    padding: 20,
  },
  aboutWelcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 26,
  },
  aboutDescriptionText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 16,
    lineHeight: 24,
  },
  aboutBoldText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  aboutFeaturesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    marginBottom: 16,
  },
  aboutFeatureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  aboutFeatureEmoji: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  aboutFeatureContent: {
    flex: 1,
  },
  aboutFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  aboutFeatureDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  aboutClosingText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 24,
  },
  aboutTaglineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  // Release Notes Modal Styles
  releaseItem: {
    marginBottom: 24,
  },
  releaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  releaseVersion: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  releaseDate: {
    fontSize: 14,
    color: '#ccc',
    fontStyle: 'italic',
  },
  releaseSection: {
    marginBottom: 16,
  },
  releaseSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  releaseFeature: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
    lineHeight: 20,
  },
  releaseFix: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
    lineHeight: 20,
  },
  releaseDivider: {
    height: 1,
    backgroundColor: '#444',
    marginTop: 16,
  },
});

export default ProfileScreen;
