import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ALERT_TYPE, Dialog} from 'react-native-alert-notification';
import {API_BASE_URL} from '@env'; // Import environment variable

interface ConvoContextType {
  convos: any[];
  userConvos:any[];
  loading: boolean;
  deleteConvo: (id: string) => Promise<void>;
  createConvo: (newConvo: {
    image: string;
    description: string;
  }) => Promise<void>;
  editConvo: (
    id: string,
    updatedConvo: {image?: string; description?: string},
  ) => Promise<void>;
  fetchUserConversations:() => void
}

const ConvoContext = createContext<ConvoContextType | undefined>(undefined);

export const ConvoProvider = ({children}: any) => {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const[userConvos,setUserConvos] = useState([])
  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {headers: {Authorization: `Bearer ${token}`}};
  };

  const fetchConvos = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/convos`, headers);
      setConvos(response.data);
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to load convos',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConvos();
  }, [fetchConvos]);

  const deleteConvo = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${API_BASE_URL}/convos/${id}`, headers);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Deleted',
        textBody: 'Convo has been deleted successfully',
      });
      fetchConvos();
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to delete convo',
      });
    }
  };

  const createConvo = async (newConvo: {
    image: string;
    description: string;
  }) => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`${API_BASE_URL}/convos`, newConvo, headers);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: 'New convo created successfully!',
      });
      fetchConvos();
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to create convo',
      });
    }
  };

  const editConvo = async (
    id: string,
    updatedConvo: {image?: string; description?: string},
  ) => {
    try {
      const headers = await getAuthHeaders();
      await axios.put(`${API_BASE_URL}/convos/${id}`, updatedConvo, headers);
      Dialog.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Updated',
        textBody: 'Convo has been updated successfully!',
      });
      fetchConvos();
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to update convo',
      });
    }
  };

  const fetchUserConversations = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();

      const response = await axios.get(
        '/api/convos/user-conversations',
        headers,
      );
      setUserConvos(response.data);
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to Load convo',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConvoContext.Provider
      value={{convos, loading, deleteConvo, createConvo, editConvo,fetchUserConversations,userConvos}}>
      {children}
    </ConvoContext.Provider>
  );
};

export const useConvo = () => {
  const context = useContext(ConvoContext);
  if (!context) {
    throw new Error('useConvo must be used within a ConvoProvider');
  }
  return context;
};
