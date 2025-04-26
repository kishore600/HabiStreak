import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';

interface GroupContextType {
  groups: any[];
  userGroups: any[];
  loading: boolean;
  createGroup: (newGroup: { title: string; members: string[]; goal: string }) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  fetchGroups: () => void;
  fetchUserGroups: () => void;
  createTodoForGroup: (groupId: string, tasks: string[]) => Promise<void>;
  markTaskComplete: (groupId: string, taskId: string) => Promise<void>;
  getLeaderboard: (groupId: string) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider = ({ children }: any) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/groups`, headers);
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
      const response = await axios.get(`${API_BASE_URL}/groups/user`, headers);
      setUserGroups(response.data);
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to load your groups',
      });
    } finally {
      setLoading(false);
    }
  },[]);

  const createGroup = async (newGroup: { title: string; members: string[]; goal: string }) => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`${API_BASE_URL}/groups`, newGroup, headers);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: 'Group created successfully!',
      });
      fetchGroups(); // Re-fetch groups after creation
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to create group',
      });
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/groups/${id}`, headers);
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
      await axios.post(`${API_BASE_URL}/groups/${groupId}/todos`, { tasks }, headers);
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
    try {
      const headers = await getAuthHeaders();
      await axios.patch(`${API_BASE_URL}/groups/${groupId}/todos/${taskId}/complete`, {}, headers);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: 'Task marked as complete',
      });
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to mark task as complete',
      });
    }
  };

  const getLeaderboard = async (groupId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/groups/${groupId}/leaderboard`, headers);
      console.log(response.data); // Handle leaderboard data (e.g., display in UI)
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to fetch leaderboard',
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
      }}
    >
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
