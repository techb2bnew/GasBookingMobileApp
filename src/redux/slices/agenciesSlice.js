import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  agencies: [],
  isLoading: false,
  error: null,
  selectedAgencyId: null,
  lastUpdated: null,
};

const agenciesSlice = createSlice({
  name: 'agencies',
  initialState,
  reducers: {
    // Set agencies list
    setAgencies: (state, action) => {
      state.agencies = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },
    
    // Add single agency
    addAgency: (state, action) => {
      const agency = action.payload;
      const existingIndex = state.agencies.findIndex(a => a.id === agency.id);
      if (existingIndex === -1) {
        state.agencies.push(agency);
      } else {
        state.agencies[existingIndex] = agency;
      }
      state.lastUpdated = new Date().toISOString();
    },
    
    // Update single agency
    updateAgency: (state, action) => {
      const updatedAgency = action.payload;
      const index = state.agencies.findIndex(a => a.id === updatedAgency.id);
      if (index !== -1) {
        state.agencies[index] = { ...state.agencies[index], ...updatedAgency };
        state.lastUpdated = new Date().toISOString();
      }
    },
    
    // Remove agency (when it becomes inactive)
    removeAgency: (state, action) => {
      const agencyId = action.payload;
      state.agencies = state.agencies.filter(agency => agency.id !== agencyId);
      state.lastUpdated = new Date().toISOString();
      
      // Clear selected agency if it was removed
      if (state.selectedAgencyId === agencyId) {
        state.selectedAgencyId = null;
      }
    },
    
    // Set selected agency
    setSelectedAgency: (state, action) => {
      state.selectedAgencyId = action.payload?.id || action.payload;
    },
    
    // Set loading state
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    
    // Clear agencies
    clearAgencies: (state) => {
      state.agencies = [];
      state.selectedAgencyId = null;
      state.error = null;
      state.lastUpdated = null;
    },
    
    // Handle agency status change (from socket)
    handleAgencyStatusChange: (state, action) => {
      const { agencyId, status, agencyData } = action.payload;
      
      if (status === 'inactive') {
        // Remove inactive agency
        state.agencies = state.agencies.filter(agency => agency.id !== agencyId);
        
        // Clear selected agency if it was the one that became inactive
        if (state.selectedAgencyId === agencyId) {
          state.selectedAgencyId = null;
        }
      } else if (status === 'active') {
        // Agency became active - add it back to the list if it's not already there
        const existingIndex = state.agencies.findIndex(agency => agency.id === agencyId);
        
        if (existingIndex === -1 && agencyData) {
          // Agency not in list and we have data - add it
          state.agencies.push(agencyData);
          state.agencies.sort((a, b) => a.name.localeCompare(b.name)); // Keep sorted
        } else if (existingIndex !== -1 && agencyData) {
          // Agency exists in list - update it
          state.agencies[existingIndex] = { ...state.agencies[existingIndex], ...agencyData };
        }
        
        state.lastUpdated = new Date().toISOString();
      }
    },
  },
});

export const {
  setAgencies,
  addAgency,
  updateAgency,
  removeAgency,
  setSelectedAgency,
  setLoading,
  setError,
  clearAgencies,
  handleAgencyStatusChange,
} = agenciesSlice.actions;

// Selectors
export const selectAgencies = (state) => state.agencies.agencies;
export const selectSelectedAgency = (state) => {
  const selectedId = state.agencies.selectedAgencyId;
  return state.agencies.agencies.find(agency => agency.id === selectedId);
};
export const selectSelectedAgencyId = (state) => state.agencies.selectedAgencyId;
export const selectAgenciesLoading = (state) => state.agencies.isLoading;
export const selectAgenciesError = (state) => state.agencies.error;
export const selectAgenciesLastUpdated = (state) => state.agencies.lastUpdated;

export default agenciesSlice.reducer;
