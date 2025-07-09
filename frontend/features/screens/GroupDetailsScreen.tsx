/* eslint-disable quotes */
"use client";

/* eslint-disable react-native/no-inline-styles */
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
  SafeAreaView,
  ImageBackground,
} from "react-native";
import { Button, Switch } from "react-native-paper";
import Icon from "react-native-vector-icons/FontAwesome";
import { launchImageLibrary } from "react-native-image-picker";
import { useAuth } from "../context/AuthContext";
import { useGroup } from "../context/GroupContext";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";
import { ScrollView } from "react-native";
import Leaderboard from "../components/Leaderboard";
import CategoryList from "../components/CategoryList";
import DateTimePicker from "@react-native-community/datetimepicker";
import { hobbies_enum } from "../constant";
import { MultiSelect } from "react-native-element-dropdown";
import { Platform } from "react-native";
import AnalyticsChart from "../components/AnalyticsChart";
import { Menu, MenuOptions, MenuOption, MenuTrigger } from "react-native-popup-menu";
import React from "react";

const GroupDetailsScreen = ({ route,navigation }: any) => {
  const { user, fetchProfile }: any = useAuth();
  const { groupId }: any = route.params;
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
    leaveGroup,
    deductStreakFromUI,
  }: any = useGroup();

  const [activeTab, setActiveTab] = useState("taskinfo");
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState<any>([]);
  const [profileImageUri, setProfileImageUri] = useState<any>(null);
  const [bannerImageUri, setBannerImageUri] = useState<any>(null);
  const [tasks, setTasks] = useState<any>([]);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const categoryOptions = hobbies_enum.map((hobby) => ({
    label: hobby,
    value: hobby,
  }));
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [proofMap, setProofMap] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  useEffect(() => {
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const updateCountdown = () => {
      const current = new Date();
      const diff = endOfDay.getTime() - current.getTime();
      if (diff <= 0) {
        setCountdown("00:00:00");
      } else {
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
        const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
        const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
        setCountdown(`${hours}:${minutes}:${seconds}`);
      }
    };

    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
    const streakTimer: NodeJS.Timeout | null = null;

    return () => {
      clearInterval(countdownInterval);
      if (streakTimer) clearTimeout(streakTimer);
    };
  }, [deductStreakFromUI, groupId, user._id]);

  const isUserInGroup = group?.members?.some((member: any) => member._id === user?._id) ?? false;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchGroupById(groupId);
      setLoading(false);
    };
    if (groupId) {
      fetchData();
      fetchAnalytics("daily");
      MemberAnalytics(groupId);
      ComparisonAnalytisc(groupId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    if (group) {
      setTitle(group.title);
      setGoal(group.goal);
      setMembers(group.members || []);
      setProfileImageUri({ uri: group.image });
      setBannerImageUri({ uri: group.banner });
      setSelectedMembers(group.members?.map((m: any) => m._id) || []);
      setTasks(group.todo?.tasks || []);
      setEndDate(group.endDate);
      setSelectedCategories(group?.categories);
    }
  }, [group, groupId, group?.members]);

  // All your existing functions remain the same
  const handleUploadProof = async (taskId: string) => {
    const result: any = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 0,
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
      updatedProofs.splice(index, 1);
      return {
        ...prev,
        [taskId]: updatedProofs,
      };
    });
  };

  const validateText = (text: string) => {
    return text && text.trim().length > 0;
  };

  const handlePickProfileImage = async () => {
    const result: any = await launchImageLibrary({
      mediaType: "photo",
      includeBase64: false,
    });
    if (result?.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setProfileImageUri({
        uri: asset.uri,
        fileName: asset.fileName || "profile.jpg",
        type: asset.type || "image/jpeg",
      });
    }
  };

  const handlePickBannerImage = async () => {
    const result: any = await launchImageLibrary({
      mediaType: "photo",
      includeBase64: false,
    });
    if (result?.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setBannerImageUri({
        uri: asset.uri,
        fileName: asset.fileName || "banner.jpg",
        type: asset.type || "image/jpeg",
      });
    }
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMembers((prev: any) => (prev.includes(id) ? prev.filter((mid: any) => mid !== id) : [...prev, id]));
  };

  const saveGroupChanges = async () => {
    if (!validateText(title) || !validateText(goal)) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Validation Error",
        textBody: "Please enter both title and goal for the group.",
        button: "OK",
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
        profileImageUri,
        bannerImageUri,
        endDate,
        selectedCategories,
      );
      try {
        await updateTodo(groupId, tasks, endDate);
      } catch (todoError) {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Partial Update",
          textBody: "Group updated, but tasks could not be saved.",
          button: "OK",
        });
      }
    } catch (error) {
      console.log("❌ Group update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNewTask = () => {
    setTasks([
      ...tasks,
      {
        title: "",
        completedBy: [],
        requireProof: false,
        description: "",
        days: [],
      },
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
        title: "Updated",
        textBody: "Tasks updated successfully!",
        button: "OK",
      });
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Failed to update tasks.",
        button: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, images: File[]) => {
    try {
      setLoading(true);
      const res = await markTaskComplete(groupId, taskId, images);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Success",
        textBody: res.message || "Task marked complete!",
        button: "OK",
      });
                                setShowTaskDetails(false);

      await fetchGroupById(groupId);
      await fetchProfile();
    } catch (error: any) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: error.message || "Failed to complete task",
        button: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(group?.endDate).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setEndDate(formattedDate);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    await handleJoinRequest(groupId);
    await fetchGroupById(groupId);
    await fetchProfile()
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
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const admin_id = group?.admin?._id;
  const isAdmin = admin_id === user?._id;

  const getProof = (taskId: string) => {
    if (proofMap[taskId]?.length > 0) {
      return proofMap[taskId];
    }
    const task = group?.todo?.tasks?.find((t: any) => t._id === taskId);
    const completedEntry = task?.completedBy?.find((entry: any) => entry.userDateKey === `${user._id}_${today}`);
    return completedEntry?.proof || [];
  };

  const combinedUsers = [...user.followers, ...(group?.members || [])];
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const uniqueUsers = combinedUsers.filter((user, index, self) => index === self.findIndex((u) => u._id === user._id));

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }
console.log();
const renderHeader = () => (
  <ImageBackground
    source={{ uri: group?.banner }}
    style={styles.bannerBackground}
    resizeMode="cover"
  >
    {/* Shadow Overlay */}
    <View style={styles.shadowOverlay} />

    <View style={styles.headerContent}>
      <View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.menuContainer}>
          <Menu>
            <MenuTrigger style={styles.menuButton}>
              <Icon name="ellipsis-v" size={20} color="#FFFFFF" />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 5,
                  marginTop: 40,
                  marginRight: 10,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                },
                optionWrapper: {
                  padding: 10,
                },
                optionText: {
                  color: "#333",
                  fontSize: 16,
                },
              }}
            >
              {isAdmin ? (
                <>
                  <MenuOption onSelect={handleDelete} text="Delete Group" />
                  <MenuOption onSelect={() => setEditMode(true)} text="Edit Group" />
                </>
              ) : (
                <MenuOption onSelect={() => leaveGroup(groupId)} text="Leave Group" />
              )}
            </MenuOptions>
          </Menu>
        </View>
      </View>

      <View style={styles.groupInfo}>
        <Image source={{ uri: group?.image }} style={styles.groupImage} />
        
        <Text style={styles.groupName}>{group?.title}  

        </Text>
        <Text style={styles.groupDescription}>{group?.goal}</Text>
<View style={styles.bottomViewContainer}>

        <View style={styles.memberCount}>
          <Icon name="users" size={16} color="#FFFFFF" />
          <Text style={styles.memberCountText}>{members.length} members</Text>
        </View>

      <View style={styles.memberCount}>
         <Text style={styles.memberCountText}>{group?.streak}</Text>
          <Icon name="fire" size={16} color="white" />
        </View>
</View>

            
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setModalVisible(true)}>
            <Icon name="bar-chart" size={16} color="#8B5CF6" />
          </TouchableOpacity>
          {isAdmin && (
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowJoinRequests(true)}>
              <Icon name="bell" size={16} color="#8B5CF6" />
              {pendingRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  </ImageBackground>
);

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "taskinfo" && styles.activeTab]}
        onPress={() => setActiveTab("taskinfo")}
      >
        <Text style={[styles.tabText, activeTab === "taskinfo" && styles.activeTabText]}>Task info</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "members" && styles.activeTab]}
        onPress={() => setActiveTab("members")}
      >
        <Text style={[styles.tabText, activeTab === "members" && styles.activeTabText]}>members</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "leaderboard" && styles.activeTab]}
        onPress={() => setActiveTab("leaderboard")}
      >
        <Text style={[styles.tabText, activeTab === "leaderboard" && styles.activeTabText]}>leaderboard</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPersonalStreak = () => (
    <View style={styles.streakContainer}>
      <View style={styles.streakInfo}>
        <Text style={styles.streakName}>{user?.name}</Text>
        <Text style={styles.streakLabel}>your personal streak</Text>

      <CategoryList categories={group?.categories} setSelectedCategories={setSelectedCategories} />
      </View>
      <View style={styles.streakBadge}>
        <Icon name="fire" size={16} color="#8B5CF6" />
        <Text style={styles.streakNumber}>{user?.totalStreak || 0}</Text>
      </View>
    </View>
  );

  const renderTaskInfo = () => (
    <View style={styles.content}>
      {renderPersonalStreak()}

      <View style={styles.timeContainer}>
        <Text style={styles.timeLabel}>⏳ Time Left Today:</Text>
        <Text style={styles.timeValue}>{countdown}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DAILY TASKS</Text>
        {isUserInGroup ? (
          group?.todo?.tasks?.map((task: any) => {
            const completionKey = `${user._id}_${today}`;
            const isCompleted = task?.completedBy?.some((c: any) => c.userDateKey === completionKey);
            // const requiresProof = task.requireProof;
            // const hasProvidedProof = proofMap[task._id]?.length > 0;
            const currentDay = new Date().toLocaleDateString("en-US", {
              weekday: "short",
            });
            const isTaskToday = task?.days?.includes(currentDay);

            return (
              <TouchableOpacity
                key={task._id}
                style={[
                  styles.taskCard,
                  isCompleted && styles.taskCardCompleted,
                  !isTaskToday && styles.taskCardDisabled,
                ]}
                onPress={() => {
                  setSelectedTask(task);
                  setShowTaskDetails(true);
                }}
              >


                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskSubtitle}>{task.description || formattedDate}</Text>
                </View>

              </TouchableOpacity>
            );
          })
        ) : (
          <Button style={styles.joinButton} onPress={() => handleJoinGroup(groupId)} disabled={loading}>
            <Text style={styles.joinButtonText}>
              {loading ? "Processing..." : hasRequested ? "Cancel Join Request" : "Request to Join"}
            </Text>
          </Button>
        )}
      </View>

    </View>
  );

  const renderMembers = () => (
    <View style={styles.content}>
      {renderPersonalStreak()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADMIN</Text>
        <View style={styles.memberItem}>
          <View style={styles.memberInfo}>
            <Image source={{ uri: group?.admin?.image }} style={styles.memberAvatar} />
            <View>
              <Text style={styles.memberName}>{group?.admin?.name}</Text>
              <Text style={styles.memberEmail}>{group?.admin?.email}</Text>
            </View>
          </View>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>GROUP MEMBERS</Text>
        {members.map((member: any) => (
          <View key={member._id} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              <Image source={{ uri: member.image }} style={styles.memberAvatar} />
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            </View>
            <View style={styles.memberScore}>
              <Icon name="fire" size={14} color="#8B5CF6" />
              <Text style={styles.scoreText}>{member.totalStreak || 0}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderLeaderboard = () => (
    <View style={styles.content}>
      {renderPersonalStreak()}
      <Leaderboard groupId={groupId} />
    </View>
  );

  const renderContent = () => {
    if (editMode) {
      return renderEditMode();
    }

    switch (activeTab) {
      case "taskinfo":
        return renderTaskInfo();
      case "members":
        return renderMembers();
      case "leaderboard":
        return renderLeaderboard();
      default:
        return renderTaskInfo();
    }
  };

  const renderEditMode = () => (
    <View style={[styles.content, { paddingTop: 0 }]}>
      <ScrollView style={styles.editContainer}>
        <TextInput style={styles.input} placeholder="Group Title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Group Goal" value={goal} onChangeText={setGoal} />

        <TouchableOpacity onPress={handlePickProfileImage} style={styles.imagePicker}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri.uri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Select Profile Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePickBannerImage} style={styles.imagePicker}>
          {bannerImageUri ? (
            <Image source={{ uri: bannerImageUri.uri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Select Banner Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.subTitle}>Select Members:</Text>
        {uniqueUsers?.map((item: any) => (
          <TouchableOpacity
            key={item._id}
            style={styles.memberSelectItem}
            onPress={() => toggleMemberSelection(item._id)}
          >
            <Icon
              name={selectedMembers.includes(item._id) ? "check-circle" : "circle-o"}
              size={24}
              color={selectedMembers.includes(item._id) ? "#8B5CF6" : "gray"}
              style={{ marginRight: 10 }}
            />
            <View>
              <Text style={styles.memberName}>{item.name}</Text>
              <Text style={styles.memberEmail}>{item.email}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.subTitle}>Edit Tasks</Text>
        {tasks.map((task: any, index: number) => (
          <View key={index} style={styles.taskEditContainer}>
            <TextInput
              placeholder={`Task ${index + 1} Title`}
              value={task.title}
              onChangeText={(text) => {
                const updatedTasks = [...tasks];
                updatedTasks[index].title = text;
                setTasks(updatedTasks);
              }}
              style={styles.input}
            />
            <TextInput
              placeholder="Description (optional)"
              value={task.description}
              onChangeText={(text) => {
                const updatedTasks = [...tasks];
                updatedTasks[index].description = text;
                setTasks(updatedTasks);
              }}
              style={[styles.input, { marginTop: 8 }]}
              multiline
            />
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Require Proof</Text>
              <Switch
                value={task.requireProof}
                onValueChange={(value) => {
                  const updatedTasks = [...tasks];
                  updatedTasks[index].requireProof = value;
                  setTasks(updatedTasks);
                }}
              />
            </View>
            <View style={styles.daysContainer}>
              {weekdays.map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => {
                    const updatedTasks = [...tasks];
                    const days = updatedTasks[index].days || [];
                    if (days.includes(day)) {
                      updatedTasks[index].days = days.filter((d: any) => d !== day);
                    } else {
                      updatedTasks[index].days = [...days, day];
                    }
                    setTasks(updatedTasks);
                  }}
                  style={[styles.dayButton, task?.days?.includes(day) && styles.dayButtonSelected]}
                >
                  <Text style={[styles.dayButtonText, task?.days?.includes(day) && styles.dayButtonTextSelected]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => removeTask(index)} style={styles.removeTaskButton}>
              <Text style={styles.removeTaskText}>Remove Task</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Button onPress={addNewTask} style={styles.addTaskButton}>
          <Text>Add Task</Text>
        </Button>

        <Button onPress={updateTaskChanges} style={styles.updateTaskButton}>
          <Text>Update Tasks</Text>
        </Button>

        <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
          <Text style={styles.datePickerText}>Select End Date</Text>
        </TouchableOpacity>
        <Text style={styles.selectedDateText}>
          Selected Date: {endDate ? new Date(endDate).toDateString() : "None"}
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

        <Text style={styles.subTitle}>Select Categories</Text>
        <MultiSelect
          mode="modal"
          style={[styles.input, { paddingHorizontal: 10 }]}
          placeholderStyle={{ color: "#888" }}
          selectedTextStyle={{ color: "#000" }}
          inputSearchStyle={{ height: 40, fontSize: 16 }}
          data={categoryOptions}
          labelField="label"
          valueField="value"
          placeholder="Select Categories"
          search
          searchPlaceholder="Search..."
          value={selectedCategories}
          onChange={(item) => {
            setSelectedCategories(item);
          }}
          selectedStyle={{ borderRadius: 12 }}
          maxSelect={10}
        />

        <CategoryList selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

        <View style={styles.editButtonContainer}>
          <Button mode="contained" onPress={saveGroupChanges} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Button>
          <Button mode="outlined" onPress={() => setEditMode(false)} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Button>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {!editMode && renderTabs()}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Analytics Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
            {loading ? (
              <ActivityIndicator size="large" color="#8B5CF6" />
            ) : (
              <AnalyticsChart analytics={analytics.data} />
            )}
          </View>
        </View>
      </Modal>

      {/* Join Requests Modal */}
      {isAdmin && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showJoinRequests}
          onRequestClose={() => setShowJoinRequests(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Pending Join Requests</Text>
              <ScrollView>
                {pendingRequests.length === 0 ? (
                  <Text style={styles.noRequestsText}>No pending requests.</Text>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-shadow
                  pendingRequests.map((user: any) => (
                    <View key={user._id} style={styles.requestItem}>
                      <Image source={{ uri: user.image }} style={styles.requestAvatar} />
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestName}>{user.name}</Text>
                      </View>
                      <TouchableOpacity style={styles.acceptButton} onPress={() => acceptJoinRequest(user._id)}>
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
                <Button onPress={() => setShowJoinRequests(false)} style={styles.closeRequestsButton}>
                  <Text style={{color:'white'}}>Close</Text>
                </Button>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Task Details Modal */}
      <Modal
        visible={showTaskDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTaskDetails(false)}
      >
        <View style={styles.taskModalOverlay}>
          <View style={styles.taskModalContainer}>
            <View style={styles.taskModalHeader}>
              <Text style={styles.taskModalTitle}>Task Details</Text>
              <TouchableOpacity onPress={() => setShowTaskDetails(false)}>
                <Icon name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <View style={styles.taskModalContent}>
                <Text style={styles.taskDetailTitle}>{selectedTask.title}</Text>

                {selectedTask.description && (
                  <View style={styles.taskDetailSection}>
                    <Text style={styles.taskDetailLabel}>Description:</Text>
                    <Text style={styles.taskDetailText}>{selectedTask.description}</Text>
                  </View>
                )}

                <View style={styles.taskDetailSection}>
                  <Text style={styles.taskDetailLabel}>Scheduled Days:</Text>
                  <View style={styles.taskDetailDays}>
                    {weekdays.map((day) => (
                      <View
                        key={day}
                        style={[styles.taskDetailDay, selectedTask?.days?.includes(day) && styles.taskDetailDayActive]}
                      >
                        <Text
                          style={[
                            styles.taskDetailDayText,
                            selectedTask?.days?.includes(day) && styles.taskDetailDayTextActive,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {selectedTask.requireProof && (
                  <View style={styles.taskDetailSection}>
                    <Text style={styles.taskDetailLabel}>⚠️ Proof Required</Text>
                    <Text style={styles.taskDetailText}>This task requires photo/video proof to complete</Text>
                  </View>
                )}

                {(() => {
                  const completionKey = `${user._id}_${today}`;
                  const isCompleted = selectedTask?.completedBy?.some((c: any) => c.userDateKey === completionKey);
                  const requiresProof = selectedTask.requireProof;
                  const hasProvidedProof = proofMap[selectedTask._id]?.length > 0;
                  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "short" });
                  const isTaskToday = selectedTask?.days?.includes(currentDay);

                  return (
                    <View style={styles.taskModalActions}>
                      {isTaskToday ? (
                        <>
                          {/* Task Completion Section */}
                          <TouchableOpacity
                            style={styles.taskCompletionSection}
                            onPress={() => {
                              if (!isCompleted && requiresProof && !hasProvidedProof) {
                                Dialog.show({
                                  type: ALERT_TYPE.DANGER,
                                  title: "Error",
                                  textBody: "Please upload the required proof first",
                                });
                                return;
                              }

                              if (isCompleted) {

                                handleCompleteTask(selectedTask._id, getProof(selectedTask._id));
                              } else {
                                handleCompleteTask(selectedTask._id, getProof(selectedTask._id));
                                setShowTaskDetails(false);

                              }
                            }}
                          >
                            <View style={styles.taskCompletionLeft}>
                              <Text style={styles.taskCompletionTitle}>
                                {isCompleted ? "Task Completed" : "Mark as Complete"}
                              </Text>
                              <Text style={styles.taskCompletionSubtitle}>
                                {isCompleted
                                  ? "Tap to mark as incomplete"
                                  : requiresProof
                                    ? "Upload proof first"
                                    : "Tap to complete this task"}
                              </Text>
                            </View>
                            <View style={[styles.taskCheckbox, isCompleted && styles.taskCheckboxChecked]}>
                              {isCompleted && <Icon name="check" size={14} color="#FFFFFF" />}
                            </View>
                          </TouchableOpacity>

                          {/* Proof Upload Section */}
                          {requiresProof && !isCompleted && (
                            <View style={styles.proofUploadSection}>
                              <Button
                                mode="outlined"
                                onPress={() => handleUploadProof(selectedTask._id)}
                                style={styles.uploadButton}
                              >
                                Upload Proof
                              </Button>
                              <ScrollView horizontal style={styles.proofImagesScroll}>
                                {proofMap[selectedTask._id]?.map((proofItem: any, index: number) => (
                                  <View key={index} style={styles.proofImageContainer}>
                                    <Image
                                      source={{ uri: proofItem.uri }}
                                      style={styles.proofImage}
                                      resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                      onPress={() => handleRemoveProof(selectedTask._id, index)}
                                      style={styles.removeProofButton}
                                    >
                                      <Text style={styles.removeProofText}>–</Text>
                                    </TouchableOpacity>
                                  </View>
                                ))}
                              </ScrollView>
                            </View>
                          )}

                          {/* Show completed proof if task is done */}
                          {isCompleted && (
                            <View style={styles.taskDetailSection}>
                              <Text style={styles.taskDetailLabel}>✅ Completion Proof:</Text>
                              <ScrollView horizontal>
                                {selectedTask.completedBy
                                  ?.filter((entry: any) => entry.userDateKey === `${user._id}_${today}`)
                                  .flatMap(
                                    (entry: any) =>
                                      entry.proof?.filter((proofItem: any) => proofItem.type === "image") || [],
                                  )
                                  .map((proofItem: any) => (
                                    <Image
                                      key={proofItem._id}
                                      source={{ uri: proofItem.url }}
                                      style={{
                                        width: 100,
                                        height: 100,
                                        margin: 5,
                                        borderRadius: 8,
                                        backgroundColor: "#ccc",
                                      }}
                                      resizeMode="cover"
                                    />
                                  ))}
                              </ScrollView>
                            </View>
                          )}
                        </>
                      ) : (
                        <View style={styles.notTodayBadge}>
                          <Text style={styles.notTodayText}>This task is not scheduled for today</Text>
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    // paddingTop: 20,
    paddingBottom: 30,
    marginTop:50,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1,
  },
  menuButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  groupInfo: {
    alignItems: "center",
    marginTop: 40,
  },
  bottomViewContainer:{
    display:'flex',
    flexDirection:'row',
    gap:8
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.7,
    marginBottom: 12,
  },
  memberCount: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  memberCountText: {
    color: "#FFFFFF",
    marginLeft: 6,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 25,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
  },
  tabText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#000000",
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 20,
    minHeight: 600,
  },
  streakContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  streakInfo: {
    flex: 1,
  },
  streakName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 12,
    color: "#666666",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginLeft: 4,
  },
  timeContainer: {
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF3B30",
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666666",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  taskCard: {
    backgroundColor: "#8B5CF6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  taskCardCompleted: {
    backgroundColor: "#34C759",
  },
  taskCardDisabled: {
    backgroundColor: "#CCCCCC",
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  taskSubtitle: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  taskStatus: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  taskStatusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  proofSection: {
    marginTop: 10,
    width: "100%",
  },
  proofImageContainer: {
    position: "relative",
    margin: 5,
  },
  proofImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#ccc",
  },
  removeProofButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#f00",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  removeProofText: {
    color: "#fff",
    fontWeight: "bold",
  },
  joinButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
  bannerBackground: {
  width: '100%',
  height: 340,
  marginBottom:30,
},

shadowOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0, 0, 0, 0.4)', // dark shadow
  zIndex: 1,
},

headerContent: {
  paddingHorizontal: 20,
  paddingTop: 40,
  paddingBottom: 30,
  zIndex: 2, // above the shadow
},

// the rest of your existing styles can stay unchanged

  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  memberEmail: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
  },
  memberScore: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginLeft: 4,
  },
  adminBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Edit Mode Styles
  editContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  imagePicker: {
    marginBottom: 15,
    alignItems: "center",
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  imagePlaceholderText: {
    color: "#888",
    fontSize: 14,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  memberSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  taskEditContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  switchLabel: {
    fontSize: 16,
    color: "#333",
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  dayButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#aaa",
    backgroundColor: "#f0f0f0",
  },
  dayButtonSelected: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  dayButtonText: {
    fontSize: 14,
    color: "#333",
  },
  dayButtonTextSelected: {
    color: "#fff",
  },
  removeTaskButton: {
    marginTop: 10,
    backgroundColor: "#FF3B30",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  removeTaskText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  addTaskButton: {
    backgroundColor: "#8B5CF6",
    marginVertical: 10,
  },
  updateTaskButton: {
    backgroundColor: "#34C759",
    marginVertical: 10,
  },
  datePickerText: {
    color: "#8B5CF6",
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
  },
  selectedDateText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  editButtonContainer: {
    marginTop: 30,
    gap: 10,
  },
  saveButton: {
    backgroundColor: "#8B5CF6",
  },
  saveButtonText: {
    color: "#FFFFFF",
  },
  cancelButton: {
    borderColor: "#8B5CF6",
  },
  cancelButtonText: {
    color: "#8B5CF6",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    width: "95%",
    height: "90%",
    borderRadius: 10,
    padding: 20,
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  closeButton: {
    color: "#8B5CF6",
    textAlign: "right",
    marginBottom: 10,
    fontSize: 16,
  },
  noRequestsText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginVertical: 20,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  acceptButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  closeRequestsButton: {
    marginTop: 20,
    backgroundColor: "#8B5CF6",
    color:'white',
  },
  taskDaysContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 4,
  },
  taskDayIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  taskDayIndicatorEnabled: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  taskDayIndicatorCurrent: {
    borderColor: "#FFD700",
    borderWidth: 2,
  },
  taskDayIndicatorText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  taskDayIndicatorTextEnabled: {
    color: "#8B5CF6",
    fontWeight: "bold",
  },
  taskDayIndicatorTextCurrent: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  menuContainer: {
    position: "absolute",
    // top: 20,
    right: 20,
    zIndex: 1000,
  },
  taskModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  taskModalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  taskModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  taskModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  taskModalContent: {
    padding: 20,
  },
  taskDetailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  taskDetailSection: {
    marginBottom: 0,
  },
  taskDetailLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  taskDetailText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  taskDetailDays: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  taskDetailDay: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  taskDetailDayActive: {
    backgroundColor: "#8B5CF6",
    borderColor: "#8B5CF6",
  },
  taskDetailDayText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  taskDetailDayTextActive: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  taskModalActions: {
    marginTop: 20,
  },
  taskCompletionSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    marginBottom: 15,
  },
  taskCompletionLeft: {
    flex: 1,
  },
  taskCompletionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  taskCompletionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  taskCheckboxChecked: {
    backgroundColor: "#8B5CF6",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: "#E8F5E8",
    borderRadius: 12,
    gap: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34C759",
  },
  notTodayBadge: {
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    alignItems: "center",
  },
  notTodayText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  proofUploadSection: {
    marginBottom: 15,
  },
  uploadButton: {
    marginBottom: 10,
    borderColor: "#8B5CF6",
  },
  proofImagesScroll: {
    maxHeight: 120,
  },
  completeButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 8,
  },
});

export default GroupDetailsScreen;
