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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

interface GroupContextType {
  groups: any[];
  userGroups: any[];
  loading: boolean;
  createGroup: any;
  deleteGroup: (id: string) => Promise<void>;
  fetchGroups: () => void;
  fetchUserGroups: () => void;
  createTodoForGroup: (groupId: string, tasks: string[]) => Promise<void>;
  markTaskComplete: (groupId: string, taskId: string) => Promise<void>;
  getLeaderboard: (groupId: string) => void;
  handleUpdateGroup:any;
  group: any;
  fetchGroupById: any;
  handleDeleteGroup: (groupId: string) => Promise<void>;
  setLoading: any;
  updateTodo:any;
  leaderboard:any;
  loadingLeaderboard:any;
  fetchLeaderboard:any;
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [group, setGroup] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // 192.168.1.6
  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {headers: {Authorization: `Bearer ${token}`}};
  };

  const fetchGroupById = async (groupId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${API_URL}/groups/${groupId}`, headers);
      console.log('sd')
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
    } catch (error) {
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
      setUserGroups(response.data.usergroups);
    } catch (error) {
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
      setLoading(true);
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

      fetchGroups();
      fetchUserGroups();
    } catch (error:any) {
      console.error('Create group error:', error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: error.data.message || 'Failed to create group',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (groupId:any) => {
    setLoadingLeaderboard(true);
    const headers = await getAuthHeaders();

    try {
      const { data } = await axios.get(
        `${API_URL}/groups/${groupId}/leaderboard`,
        headers
      );
      setLeaderboard(data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };
  
  const deleteGroup = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_URL}/groups/${id}`, headers);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Deleted',
        textBody: 'Group deleted successfully!',
      });
      fetchGroups();
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

  const markTaskComplete = async (groupId: string, taskId: string) => {
    const headers = await getAuthHeaders();
    const response = await axios.put(
      `${API_URL}/groups/${groupId}/todos/${taskId}/complete`,
      {},
      headers
    );
    return response.data;
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
    endDate:any,
    selectedCategories:any
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

      // Ensure the response message matches
      if (response.data.message === 'update successfully') {
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Success',
          textBody: 'Group updated successfully!',
          button: 'OK',
        });

        // Refresh data
        fetchGroups();
        fetchUserGroups();
        navigation.goBack();
      } else {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: 'Error',
          textBody: 'Group update failed!',
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
        textBody: error.response?.data?.message || error.message || 'Something went wrong',
        button: 'OK',
      });
    }
    
  };

  const updateTodo = async (groupId:any, tasks:any) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.put(`${API_URL}/groups/${groupId}/todo`, { tasks },headers);
      console.log(response)
      // Refresh data
      fetchGroups();
      fetchUserGroups();
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Group update failed!',
        button: 'OK',
      });
      navigation.goBack();
    } catch (error) {
      console.log(error)
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Group update failed! asde',
        button: 'OK',
      });
    }
    }

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

  useEffect(() => {
    fetchGroups();
    fetchUserGroups();
  }, [fetchGroups, fetchUserGroups]);

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
