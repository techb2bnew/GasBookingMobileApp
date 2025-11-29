import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
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
  handleAgencyStatusChange
} from '../redux/slices/agenciesSlice';
import apiClient from '../utils/apiConfig';

// Simple test hook to verify Redux integration
export const useAgenciesTest = () => {
  const dispatch = useDispatch();
  const agencies = useSelector(selectAgencies);
  const selectedAgency = useSelector(selectSelectedAgency);
  const selectedAgencyId = useSelector(selectSelectedAgencyId);
  const isLoading = useSelector(selectAgenciesLoading);
  const error = useSelector(selectAgenciesError);

  // Test function to simulate agency status change
  const testAgencyRemoval = (agencyId) => {
    console.log('🧪 Testing agency removal for ID:', agencyId);
    dispatch(handleAgencyStatusChange({
      agencyId: agencyId,
      status: 'inactive'
    }));
  };

  // Test function to simulate agency reactivation
  const testAgencyReactivation = (agencyId, agencyData) => {
    console.log('🧪 Testing agency reactivation for ID:', agencyId);
    dispatch(handleAgencyStatusChange({
      agencyId: agencyId,
      status: 'active',
      agencyData: agencyData
    }));
  };

  // Test function to fetch agencies
  const testFetchAgencies = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      console.log('🧪 Testing agencies fetch...');
      const response = await apiClient.get('/api/agencies/active');
      
      if (response.data?.success) {
        const list = response.data.data?.agencies || [];
        console.log('🧪 Test: Agencies loaded:', list.length, list.map(a => a.name));
        dispatch(setAgencies(list));
      } else {
        dispatch(setError('Failed to fetch agencies'));
      }
    } catch (err) {
      console.error('🧪 Test: Error fetching agencies:', err);
      dispatch(setError(err.message || 'Failed to fetch agencies'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    // State
    agencies,
    selectedAgency,
    selectedAgencyId,
    isLoading,
    error,
    
    // Test functions
    testFetchAgencies,
    testAgencyRemoval,
    testAgencyReactivation,
    
    // Computed values
    hasAgencies: agencies.length > 0,
    hasSelectedAgency: !!selectedAgency,
  };
};
