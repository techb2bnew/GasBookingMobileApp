import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  selectAgencies, 
  selectSelectedAgency, 
  selectSelectedAgencyId,
  selectAgenciesLoading,
  selectAgenciesError,
  setAgencies,
  setSelectedAgency,
  setLoading,
  setError,
  clearAgencies
} from '../redux/slices/agenciesSlice';
import apiClient from '../utils/apiConfig';

export const useAgencies = () => {
  const dispatch = useDispatch();
  const agencies = useSelector(selectAgencies);
  const selectedAgency = useSelector(selectSelectedAgency);
  const selectedAgencyId = useSelector(selectSelectedAgencyId);
  const isLoading = useSelector(selectAgenciesLoading);
  const error = useSelector(selectAgenciesError);

  // Fetch agencies from API
  const fetchAgencies = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      console.log('🔍 Fetching agencies from API...');
      const response = await apiClient.get('/api/agencies/active');
      
      console.log('=== AGENCIES API RESPONSE ===');
      console.log('Full Response:', response);
      console.log('Response Data:', response.data);
      console.log('Success Status:', response.data?.success);
      console.log('Agencies Data:', response.data?.data);
      console.log('Agencies Array:', response.data?.data?.agencies);
      console.log('=============================');

      if (response.data?.success) {
        const list = response.data.data?.agencies || [];
        console.log('*** AGENCIES LOADED ***', list.length, list.map(a => a.name));
        dispatch(setAgencies(list));
        
        // Try to restore previously selected agency
        try {
          const storedAgencyId = await AsyncStorage.getItem('selectedAgencyId');
          if (storedAgencyId && list.find(agency => agency.id === storedAgencyId)) {
            const agency = list.find(agency => agency.id === storedAgencyId);
            dispatch(setSelectedAgency(agency));
            console.log('🔄 Restored selected agency:', agency.name);
          } else if (list.length > 0) {
            // Auto-select first agency if none selected
            dispatch(setSelectedAgency(list[0]));
            await AsyncStorage.setItem('selectedAgencyId', list[0].id);
            console.log('🔄 Auto-selected first agency:', list[0].name);
          }
        } catch (storageError) {
          console.log('⚠️ Error handling agency selection:', storageError);
        }
      } else {
        console.log('❌ Failed to fetch agencies:', response.data?.message);
        dispatch(setError(response.data?.message || 'Failed to fetch agencies'));
      }
    } catch (err) {
      console.error('❌ Error fetching agencies:', err);
      dispatch(setError(err.message || 'Failed to fetch agencies'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Select an agency
  const selectAgency = useCallback(async (agency) => {
    try {
      dispatch(setSelectedAgency(agency));
      await AsyncStorage.setItem('selectedAgencyId', agency.id);
      console.log('✅ Agency selected:', agency.name);
    } catch (error) {
      console.error('❌ Error saving selected agency:', error);
    }
  }, [dispatch]);

  // Clear agencies (on logout)
  const clearAgenciesData = useCallback(() => {
    dispatch(clearAgencies());
    AsyncStorage.removeItem('selectedAgencyId');
  }, [dispatch]);

  // Get agency by ID
  const getAgencyById = useCallback((agencyId) => {
    return agencies.find(agency => agency.id === agencyId);
  }, [agencies]);

  // Check if agency is available
  const isAgencyAvailable = useCallback((agencyId) => {
    return agencies.some(agency => agency.id === agencyId && agency.status === 'active');
  }, [agencies]);

  return {
    // State
    agencies,
    selectedAgency,
    selectedAgencyId,
    isLoading,
    error,
    
    // Actions
    fetchAgencies,
    selectAgency,
    clearAgencies: clearAgenciesData,
    getAgencyById,
    isAgencyAvailable,
    
    // Computed values
    hasAgencies: agencies.length > 0,
    hasSelectedAgency: !!selectedAgency,
  };
};
