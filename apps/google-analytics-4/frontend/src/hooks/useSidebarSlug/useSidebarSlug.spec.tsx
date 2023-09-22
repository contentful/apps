import React from 'react';
import { useSidebarSlug } from './useSidebarSlug';
import { render, screen } from '@testing-library/react';
import * as useSDK from '@contentful/react-apps-toolkit';
import { ContentTypeValue } from 'types';
import * as getFieldValue from '../useGetFieldValue';
import { EntrySys } from '@contentful/app-sdk';

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
      <div>slugFieldValue: {slugFieldValue.toString()}</div>
      <div>isContentTypeWarning: {isContentTypeWarning.toString()}</div>
    </>
  );
};

const { getByText, findByText } = screen;

const mockInstallationParams = {
  parameters: {
    installation: {
      forceTrailingSlash: false,
    },
  },
};

describe('useSidebarSlug hook', () => {
  it('returns slug info and status when content types are configured correctly', () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        ...jest.requireActual('@contentful/react-apps-toolkit').entry,
        fields: { slugField: {} },
        onSysChanged: jest.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as EntrySys)
        ),
      },
    }));
    jest.spyOn(getFieldValue, 'default').mockImplementation(() => '/fieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: true')).toBeVisible();
    expect(getByText('contentTypeHasSlugField: true')).toBeVisible();
    expect(getByText('isPublished: true')).toBeVisible();
    expect(getByText('reportSlug: /en-US/fieldValue')).toBeVisible();
    expect(getByText('slugFieldValue: /fieldValue')).toBeVisible();
    expect(getByText('isContentTypeWarning: false')).toBeVisible();
  });

  it('returns slug info and status when content types not configured correctly', () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        ...jest.requireActual('@contentful/react-apps-toolkit').entry,
        fields: {},
        onSysChanged: jest.fn((cb) =>
          cb({
            publishedAt: '',
          } as unknown as EntrySys)
        ),
      },
    }));
    jest.spyOn(getFieldValue, 'default').mockImplementation(() => '');

    const slugFieldInfo = { slugField: '', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: false')).toBeVisible();
    expect(getByText('contentTypeHasSlugField: false')).toBeVisible();
    expect(getByText('isPublished: false')).toBeVisible();
    expect(getByText('reportSlug: /en-US')).toBeVisible();
    expect(getByText('slugFieldValue:')).toBeVisible();
    expect(getByText('isContentTypeWarning: true')).toBeVisible();
  });

  it('returns slug info and status when field value is updated', async () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        ...jest.requireActual('@contentful/react-apps-toolkit').entry,
        fields: { slugField: {} },
        onSysChanged: jest.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as EntrySys)
        ),
      },
    }));
    jest
      .spyOn(getFieldValue, 'default')
      .mockImplementationOnce(() => '/fieldValue')
      .mockImplementationOnce(() => '/differentFieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: true')).toBeVisible();
    expect(getByText('contentTypeHasSlugField: true')).toBeVisible();
    expect(getByText('isPublished: true')).toBeVisible();
    expect(getByText('reportSlug: /en-US/fieldValue')).toBeVisible();
    expect(getByText('slugFieldValue: /fieldValue')).toBeVisible();
    expect(getByText('isContentTypeWarning: false')).toBeVisible();

    const newSlugFieldValue = await findByText('slugFieldValue: /differentFieldValue');

    expect(newSlugFieldValue).toBeVisible();
    expect(getByText('reportSlug: /en-US/differentFieldValue')).toBeVisible();
  });

  it('returns slug info and status when a short text list field is selected and no URL prefix', async () => {
    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        ...jest.requireActual('@contentful/react-apps-toolkit').entry,
        fields: { slugField: {} },
        onSysChanged: jest.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as EntrySys)
        ),
      },
    }));
    jest.spyOn(getFieldValue, 'default').mockImplementation(() => ['category', 'pants', 'jeans']);
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: true')).toBeVisible();
    expect(getByText('contentTypeHasSlugField: true')).toBeVisible();
    expect(getByText('isPublished: true')).toBeVisible();
    expect(getByText('reportSlug: /category/pants/jeans')).toBeVisible();
    expect(getByText('slugFieldValue: category,pants,jeans')).toBeVisible();
    expect(getByText('isContentTypeWarning: false')).toBeVisible();
  });

  it('returns slug info and status with trailing slash', async () => {
    mockInstallationParams.parameters.installation.forceTrailingSlash = true;

    jest.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...jest.requireActual('@contentful/react-apps-toolkit'),
      entry: {
        ...jest.requireActual('@contentful/react-apps-toolkit').entry,
        fields: { slugField: {} },
        onSysChanged: jest.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as EntrySys)
        ),
      },
    }));
    jest.spyOn(getFieldValue, 'default').mockImplementation(() => '/fieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: true')).toBeVisible();
    expect(getByText('contentTypeHasSlugField: true')).toBeVisible();
    expect(getByText('isPublished: true')).toBeVisible();
    expect(getByText('reportSlug: /en-US/fieldValue/')).toBeVisible();
    expect(getByText('slugFieldValue: /fieldValue')).toBeVisible();
    expect(getByText('isContentTypeWarning: false')).toBeVisible();
  });
});
