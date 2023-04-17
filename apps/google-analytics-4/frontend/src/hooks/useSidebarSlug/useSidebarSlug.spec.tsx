import React from 'react';
import { useSidebarSlug } from './useSidebarSlug';
import { render, screen } from '@testing-library/react';
import * as useSDK from '@contentful/react-apps-toolkit';
import { ContentTypeValue } from 'types';
import * as getFieldValue from '../useGetFieldValue';
import { ContentEntitySys } from '@contentful/app-sdk';

jest.mock('@contentful/react-apps-toolkit', () => ({ useSDK: jest.fn() }));

jest.mock('../useGetFieldValue', () => jest.fn());

interface Props {
  slugFieldInfo: ContentTypeValue;
}

const TestComponent = (props: Props) => {
  const {
    slugFieldIsConfigured,
    contentTypeHasSlugField,
    isPublished,
    reportSlug,
    slugFieldValue,
    isContentTypeWarning,
  } = useSidebarSlug(props.slugFieldInfo);

  return (
    <>
      <div>slugFieldIsConfigured: {slugFieldIsConfigured.toString()}</div>
      <div>contentTypeHasSlugField: {contentTypeHasSlugField.toString()}</div>
      <div>isPublished: {isPublished.toString()}</div>
      <div>reportSlug: {reportSlug}</div>
      <div>slugFieldValue: {slugFieldValue}</div>
      <div>isContentTypeWarning: {isContentTypeWarning.toString()}</div>
    </>
  );
};

describe('useSidebarSlug hook', () => {
  it('returns slug info and status when content types are configured correctly', () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        fields: { slugField: {} },
        onSysChanged: jest.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as ContentEntitySys)
        ),
      },
    }));
    jest.spyOn(getFieldValue, 'default').mockImplementation(() => '/fieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(screen.getByText('slugFieldIsConfigured: true')).toBeVisible();
    expect(screen.getByText('contentTypeHasSlugField: true')).toBeVisible();
    expect(screen.getByText('isPublished: true')).toBeVisible();
    expect(screen.getByText('reportSlug: /en-US/fieldValue')).toBeVisible();
    expect(screen.getByText('slugFieldValue: /fieldValue')).toBeVisible();
    expect(screen.getByText('isContentTypeWarning: false')).toBeVisible();
  });

  it('returns slug info and status when content types not configured correctly', () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        fields: {},
        onSysChanged: jest.fn((cb) =>
          cb({
            publishedAt: '',
          } as unknown as ContentEntitySys)
        ),
      },
    }));
    jest.spyOn(getFieldValue, 'default').mockImplementation(() => '');

    const slugFieldInfo = { slugField: '', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(screen.getByText('slugFieldIsConfigured: false')).toBeVisible();
    expect(screen.getByText('contentTypeHasSlugField: false')).toBeVisible();
    expect(screen.getByText('isPublished: false')).toBeVisible();
    expect(screen.getByText('reportSlug: /en-US')).toBeVisible();
    expect(screen.getByText('slugFieldValue:')).toBeVisible();
    expect(screen.getByText('isContentTypeWarning: true')).toBeVisible();
  });

  it('returns slug info and status when field value is updated', async () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        fields: { slugField: {} },
        onSysChanged: jest.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as ContentEntitySys)
        ),
      },
    }));
    jest
      .spyOn(getFieldValue, 'default')
      .mockImplementationOnce(() => '/fieldValue')
      .mockImplementationOnce(() => '/differentFieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);
    await screen.findByText('reportSlug: /en-US/fieldValue');
    await screen.findByText('slugFieldValue: /differentFieldValue');

    expect(screen.getByText('slugFieldIsConfigured: true')).toBeVisible();
    expect(screen.getByText('contentTypeHasSlugField: true')).toBeVisible();
    expect(screen.getByText('isPublished: true')).toBeVisible();
    expect(screen.getByText('slugFieldValue: /fieldValue')).toBeVisible();
    expect(screen.getByText('isContentTypeWarning: false')).toBeVisible();

    expect(screen.getByText('slugFieldValue: /differentFieldValue')).toBeVisible();
    expect(screen.getByText('reportSlug: /en-US/differentFieldValue')).toBeVisible();
  });
});
