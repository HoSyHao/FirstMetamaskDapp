import { createSlice } from '@reduxjs/toolkit';

const loadFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return [];
  }
};

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    events: loadFromStorage('contractEvents'),
  },
  reducers: {
    addEvent: (state, action) => {
      state.events.unshift(action.payload);
      localStorage.setItem('contractEvents', JSON.stringify(state.events));
    },
    setEvents: (state, action) => {
      state.events = action.payload;
    },
  },
});

export const { addEvent, setEvents } = eventsSlice.actions;
export default eventsSlice.reducer;