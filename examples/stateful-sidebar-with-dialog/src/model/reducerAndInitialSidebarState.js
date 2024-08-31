

export function reducer(state, { type, payload }) {
  if (type === 'SET_TIME') {
    return {
      ...state,
      timestamp: payload,
    };
  }
  if (type === 'SET_WHOLE_STATE') {
    return payload;
  }

  return state;
}

export function initialSidebarState() {
  return {
    timestamp: 'SET ME!'
  };
}