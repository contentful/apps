import { SegmentAppData } from '@configs/segment/segmentEvent';
import { BaseAppSDK } from '@contentful/app-sdk';

const getTrackedAppData = (sdk: BaseAppSDK): SegmentAppData => {
  const { installation } = sdk.parameters;
};
