import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import axios from 'axios';
import {API_URL} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from './AuthContext';

interface GroupContextType {
  groups: any[];
  userGroups: any[];
  loading: boolean;
  createGroup: any;
  deleteGroup: (id: string) => Promise<void>;
  fetchGroups: () => void;
  fetchUserGroups: () => void;
  createTodoForGroup: (groupId: string, tasks: string[]) => Promise<void>;
  markTaskComplete: (
    groupId: string,
    taskId: string,
    images: any,
  ) => Promise<void>;
  getLeaderboard: (groupId: string) => void;
  handleUpdateGroup: any;
  group: any;
  fetchGroupById: any;
  handleDeleteGroup: (groupId: string) => Promise<void>;
  setLoading: any;
  updateTodo: any;
  leaderboard: any;
  loadingLeaderboard: any;
  fetchLeaderboard: any;
  handleJoinRequest: any;
  setHasRequested: any;
  hasRequested: any;
  handleAcceptRequest: any;
  pendingRequests: any;
  isGroupUpdated: any;
  fetchAnalytics: any;
  analytics: any;
  MemberAnalytics: any;
  memberData: any;
  comparisonData: any;
  createLoading:any;
  ComparisonAnalytisc: any;
}
export type RootStackParamList = {
  Home: undefined;
  CreateGroup: undefined;
};

const GroupContext = createContext<GroupContextType | undefined>(undefined);
export const GroupProvider = ({children}: any) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<any>();
  const [group, setGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const {user}: any = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isGroupUpdated, setIsGroupUpdated] = useState(false);
  const [analytics, setAnalytics] = useState<any>([]);
  const [memberData, setMemberData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [createLoading,setCreateLoading] = useState(false)

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {headers: {Authorization: `Bearer ${token}`}};
  };

  const fetchAnalytics = async (type: string) => {
    try {
      const headers = await getAuthHeaders();

      const response = await axios.post(
        `${API_URL}/users/type/analytics`,
        {
          type: type,
        },
        headers,
      );
      const result = await response;

      console.log(result);
      if (result) {
        setAnalytics(result);
      }
    } catch (error) {
      console.log('❌ Failed to fetch analytics:', error);
    }
  };

  const MemberAnalytics = async (id: string) => {
    try {
      const headers = await getAuthHeaders();

      const response = await axios.get(
        `${API_URL}/groups/${id}/members`,
        headers,
      );
      const result = await response;

      console.log(result);
      if (result) {
        setMemberData(result.data);
      }
    } catch (error) {
      console.log('❌ Failed to fetch analytics:', error);
    }
  };

  const ComparisonAnalytisc = async (id: string) => {
    try {
      const headers = await getAuthHeaders();

      const response = await axios.get(
        `${API_URL}/groups/${id}/comparison`,
        headers,
      );
      const result = await response;

      console.log(result);
      if (result) {
        setComparisonData(result.data);
      }
    } catch (error) {
      console.log('❌ Failed to fetch analytics:', error);
    }
  };

  const fetchGroupById = async (groupId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(
        `${API_URL}/groups/${groupId}`,
        headers,
      );
      setPendingRequests(res?.data?.joinRequests);
      const hasrequested_ingroup = res?.data?.joinRequests?.some(
        (req: any) => req._id === user?._id,
      );
      setHasRequested(hasrequested_ingroup);
      setGroup(res.data);
      setLoading(false);
    } catch (error: any) {
      console.error(
        '❌ Failed to fetch group:',
        error?.response?.data || error.message || error,
      );
      setLoading(false);
    }
  };

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/groups`, headers);
      setGroups(response.data);
      setIsGroupUpdated(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);

      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to load groups',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserGroups = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_URL}/groups/user`, headers);
      console.log(response);
      setUserGroups(response.data.usergroups);
      setIsGroupUpdated(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to load your groups',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroup = async (formData: FormData) => {
    try {
      setCreateLoading(true);
      console.log(formData, API_URL);
      const headers = await getAuthHeaders();
      await axios.post(`${API_URL}/groups`, formData, {
        ...headers,
        headers: {
          ...headers.headers,
          'Content-Type': 'multipart/form-data', // very important
        },
      });
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: 'Group created successfully!',
      });
      navigation.navigate('Home'); // <--- Make sure you have access to navigation prop
      setIsGroupUpdated(true);
      await fetchGroups();
    } catch (error: any) {
      console.error('Create group error:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: error.data.message || 'Failed to create group',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const fetchLeaderboard = async (groupId: any) => {
    setLoadingLeaderboard(true);
    const headers = await getAuthHeaders();

    try {
      const {data} = await axios.get(
        `${API_URL}/groups/${groupId}/leaderboard`,
        headers,
      );
      setLeaderboard(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_URL}/groups/${id}`, headers);
      setIsGroupUpdated(true);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Deleted',
        textBody: 'Group deleted successfully!',
      });
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to delete group',
      });
    }
  };

  const createTodoForGroup = async (groupId: string, tasks: string[]) => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`${API_URL}/groups/${groupId}/todos`, {tasks}, headers);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: 'Todo created successfully!',
      });
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to create todo',
      });
    }
  };

  const getAuthHeaders1 = async () => {
    const token = await AsyncStorage.getItem('token');
    return {Authorization: `Bearer ${token}`};
  };

const markTaskComplete = async (groupId:any, taskId:any, imageUrls:any) => {
  const authHeaders = await getAuthHeaders1();

  try {
    const response = await axios.put(
      `${API_URL}/groups/${groupId}/todos/${taskId}/complete`,
      { proofUrls: imageUrls },
      { headers: authHeaders }
    );

    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to mark complete:', error);
  }
};

  const getLeaderboard = async (groupId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/leaderboard`,
        headers,
      );
      console.log(response.data); // Handle leaderboard data (e.g., display in UI)
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to fetch leaderboard',
      });
    }
  };

  const handleUpdateGroup = async (
    groupId: string,
    title: string,
    goal: string,
    members: any[],
    image: any,
    endDate: any,
    selectedCategories: any,
  ) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('goal', goal);
      formData.append('members', JSON.stringify(members));
      formData.append('endDate', endDate);
      formData.append('categories', selectedCategories);

      if (image && image.uri) {
        const imageFile = {
          uri: image.uri,
          name: image.fileName || 'photo.jpg',
          type: image.type || 'image/jpeg',
        };

        formData.append('image', imageFile as any);
      }

      const headers = await getAuthHeaders();

      const response = await axios.put(
        `${API_URL}/groups/${groupId}`,
        formData,
        {
          headers: {
            ...headers.headers,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      console.log('✅ Response message:', response.data.message);

      // Just show success if status is 200 or message contains "success"
      if (
        response.status === 200 &&
        response.data.message?.toLowerCase().includes('success')
      ) {
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Success',
          textBody: 'Group updated successfully!',
          button: 'OK',
        });

        // Refresh data
        fetchGroups();
        fetchUserGroups();

        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Profile');
        }
      } else {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: response.data.message || 'Group update failed!',
          button: 'OK',
        });
      }
    } catch (error: any) {
      console.error('❌ Error during group update:', error.message);
      console.error('❌ Full error object:', error);

      if (error.response) {
        console.error('❌ error.response.data:', error.response.data);
        console.error('❌ error.response.status:', error.response.status);
      }

      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Update Failed',
        textBody:
          error.response?.data?.message ||
          error.message ||
          'Something went wrong',
        button: 'OK',
      });
    }
  };

  const updateTodo = async (groupId: any, tasks: any) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(
        `${API_URL}/groups/${groupId}/todo`,
        {tasks},
        headers,
      );
      console.log(response);

      fetchGroups();
      fetchUserGroups();
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: 'Group Todo updated successfully!',
        button: 'OK',
      });
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Profile'); // or do nothing
      }
    } catch (error) {
      console.log(error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Group update failed! asde',
        button: 'OK',
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_URL}/groups/${groupId}`, headers);

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Deleted',
        textBody: 'Group deleted successfully!',
      });

      fetchGroups();
      fetchUserGroups();
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to delete group',
      });
    }
  };

  const handleJoinRequest = async (groupId: string) => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders(); // your function to get headers

      const res = await axios.post(
        `${API_URL}/groups/${groupId}/join-request`,
        {},
        headers,
      );

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Group Request',
        textBody: res?.data?.message || 'Group Request has send Sucessfully!',
      });
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Server error';
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: errorMsg || 'Failed to delete group',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (groupId: string, userId: string) => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders(); // your function to get headers
      console.log(groupId, userId);
      const res = await axios.post(
        `${API_URL}/groups/${groupId}/accept-request`,
        {userId: userId},
        headers,
      );

      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Group Request',
        textBody: res?.data?.message || 'Group Request has send Sucessfully!',
      });
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Server error';
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: errorMsg || 'Failed to delete group',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchUserGroups();
  }, [fetchGroups, fetchUserGroups, hasRequested]);

  return (
    <GroupContext.Provider
      value={{
        groups,
        userGroups,
        loading,
        createGroup,
        deleteGroup,
        fetchGroups,
        fetchUserGroups,
        createTodoForGroup,
        markTaskComplete,
        getLeaderboard,
        handleDeleteGroup,
        handleUpdateGroup,
        group,
        fetchGroupById,
        setLoading,
        updateTodo,
        leaderboard,
        loadingLeaderboard,
        fetchLeaderboard,
        handleJoinRequest,
        setHasRequested,
        hasRequested,
        handleAcceptRequest,
        pendingRequests,
        isGroupUpdated,
        fetchAnalytics,
        analytics,
        MemberAnalytics,
        memberData,
        ComparisonAnalytisc,
        comparisonData,
        createLoading
      }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
