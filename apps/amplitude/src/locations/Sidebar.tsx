import { useEffect, useState } from 'react';
import { Button, Paragraph, Stack, Badge, Card } from '@contentful/f36-components';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';

const Sidebar = () => {
  console.log('📊 Amplitude Sidebar: Initializing analytics sidebar');
  
  const sdk = useSDK<SidebarAppSDK>();
  const [isTracking, setIsTracking] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);

  useAutoResizer();

  console.log('🔗 Amplitude Sidebar: SDK initialized with entry ID:', sdk.entry.getSys().id);
  console.log('🏷️ Amplitude Sidebar: Entry content type:', sdk.contentType.sys.id);

  useEffect(() => {
    console.log('⚡ Amplitude Sidebar: Setting up entry change listeners...');
    
    const unsubscribe = sdk.entry.onSysChanged(() => {
      console.log('📝 Amplitude Sidebar: Entry system data changed');
      trackEntryUpdate();
    });

    return () => {
      console.log('🧹 Amplitude Sidebar: Cleaning up entry listeners');
      unsubscribe();
    };
  }, [sdk.entry]);

  const trackEntryUpdate = () => {
    console.log('📈 Amplitude Sidebar: Tracking entry update event...');
    
    const eventData = {
      eventType: 'content_entry_updated',
      entryId: sdk.entry.getSys().id,
      contentType: sdk.contentType.sys.id,
      timestamp: new Date().toISOString(),
      userId: sdk.user.sys.id,
    };

    console.log('📊 Amplitude Sidebar: Event data prepared:', eventData);
    
    // Simulate tracking (in real app, this would call Amplitude API)
    setEventCount(prev => {
      const newCount = prev + 1;
      console.log('📊 Amplitude Sidebar: Event count updated to:', newCount);
      return newCount;
    });
    
    setLastEventTime(new Date().toLocaleTimeString());
    console.log('✅ Amplitude Sidebar: Entry update event tracked successfully');
  };

  const handleTrackPageView = async () => {
    console.log('👁️ Amplitude Sidebar: Manual page view tracking initiated...');
    setIsTracking(true);
    
    try {
      const pageViewData = {
        eventType: 'content_page_view',
        entryId: sdk.entry.getSys().id,
        contentType: sdk.contentType.sys.id,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: sdk.user.sys.id,
        sessionId: Date.now().toString(),
      };

      console.log('👁️ Amplitude Sidebar: Page view data prepared:', pageViewData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEventCount(prev => {
        const newCount = prev + 1;
        console.log('📊 Amplitude Sidebar: Event count updated to:', newCount);
        return newCount;
      });
      
      setLastEventTime(new Date().toLocaleTimeString());
      
      console.log('✅ Amplitude Sidebar: Page view tracking completed successfully');
      sdk.notifier.success('Page view tracked in Amplitude!');
      
    } catch (error) {
      console.error('❌ Amplitude Sidebar: Error tracking page view:', error);
      sdk.notifier.error('Failed to track page view');
    } finally {
      setIsTracking(false);
      console.log('🏁 Amplitude Sidebar: Page view tracking process finished');
    }
  };

  const handleTrackCustomEvent = async () => {
    console.log('🎯 Amplitude Sidebar: Custom event tracking initiated...');
    setIsTracking(true);
    
    try {
      const customEventData = {
        eventType: 'content_interaction',
        action: 'sidebar_button_click',
        entryId: sdk.entry.getSys().id,
        contentType: sdk.contentType.sys.id,
        timestamp: new Date().toISOString(),
        userId: sdk.user.sys.id,
        properties: {
          buttonType: 'custom_tracking',
          location: 'entry_sidebar',
        }
      };

      console.log('🎯 Amplitude Sidebar: Custom event data prepared:', customEventData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setEventCount(prev => {
        const newCount = prev + 1;
        console.log('📊 Amplitude Sidebar: Event count updated to:', newCount);
        return newCount;
      });
      
      setLastEventTime(new Date().toLocaleTimeString());
      
      console.log('✅ Amplitude Sidebar: Custom event tracking completed successfully');
      sdk.notifier.success('Custom event tracked in Amplitude!');
      
    } catch (error) {
      console.error('❌ Amplitude Sidebar: Error tracking custom event:', error);
      sdk.notifier.error('Failed to track custom event');
    } finally {
      setIsTracking(false);
      console.log('🏁 Amplitude Sidebar: Custom event tracking process finished');
    }
  };

  console.log('🎨 Amplitude Sidebar: Rendering sidebar with event count:', eventCount);

  return (
    <Stack spacing="spacingM" flexDirection="column">
      <Card padding="spacingM">
        <Stack spacing="spacingS" flexDirection="column">
          <Paragraph>
            <strong>Amplitude Analytics</strong>
          </Paragraph>
          
          <Stack spacing="spacingXs" flexDirection="row">
            <Badge variant="secondary">Events: {eventCount}</Badge>
            {lastEventTime && (
              <Badge variant="positive">Last: {lastEventTime}</Badge>
            )}
          </Stack>
        </Stack>
      </Card>

      <Button
        variant="primary"
        isFullWidth={true}
        isLoading={isTracking}
        isDisabled={isTracking}
        onClick={handleTrackPageView}>
        {isTracking ? 'Tracking...' : 'Track Page View'}
      </Button>

      <Button
        variant="secondary"
        isFullWidth={true}
        isLoading={isTracking}
        isDisabled={isTracking}
        onClick={handleTrackCustomEvent}>
        {isTracking ? 'Tracking...' : 'Track Custom Event'}
      </Button>

      <Paragraph style={{ fontSize: '12px', color: '#6b7280' }}>
        Entry ID: {sdk.entry.getSys().id.substring(0, 8)}...
      </Paragraph>
    </Stack>
  );
};

export default Sidebar;
