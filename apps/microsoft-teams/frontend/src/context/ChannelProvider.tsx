import { createContext } from 'react';
import useGetTeamsChannels from '@hooks/useGetTeamsChannels';
import { TeamsChannel } from '@customTypes/configPage';

interface ChannelContextValue {
  channels: TeamsChannel[];
  loading: boolean;
  error: Error | undefined;
}

interface ChannelContextProviderProps {
  children: React.ReactNode;
}

export const ChannelContext = createContext({} as ChannelContextValue);

export const ChannelContextProvider = (props: ChannelContextProviderProps) => {
  const { children } = props;
  const { channels, loading, error } = useGetTeamsChannels();

  return (
    <ChannelContext.Provider value={{ channels: channels, loading: loading, error: error }}>
      {children}
    </ChannelContext.Provider>
  );
};
