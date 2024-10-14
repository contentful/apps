import React from 'react';
import { useSidebarSlug } from './useSidebarSlug';
import { render, screen } from '@testing-library/react';
import * as useSDK from '@contentful/react-apps-toolkit';
import { ContentTypeValue } from 'types';
import * as getFieldValue from '../useGetFieldValue';
import { EntrySys } from '@contentful/app-sdk';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({ useSDK: vi.fn() }));

vi.mock('../useGetFieldValue', () => ({ default: vi.fn() }));

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
    vi.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...(vi.importActual('@contentful/react-apps-toolkit') as any as any),
      entry: {
        ...(vi.importActual('@contentful/react-apps-toolkit') as any as any).entry,
        fields: { slugField: {} },
        onSysChanged: vi.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as EntrySys)
        ),
      },
    }));
    vi.spyOn(getFieldValue, 'default').mockImplementation(() => '/fieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: true')).toBeDefined();
    expect(getByText('contentTypeHasSlugField: true')).toBeDefined();
    expect(getByText('isPublished: true')).toBeDefined();
    expect(getByText('reportSlug: /en-US/fieldValue')).toBeDefined();
    expect(getByText('slugFieldValue: /fieldValue')).toBeDefined();
    expect(getByText('isContentTypeWarning: false')).toBeDefined();
  });

  it('returns slug info and status when content types not configured correctly', () => {
    vi.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...(vi.importActual('@contentful/react-apps-toolkit') as any as any),
      entry: {
        ...(vi.importActual('@contentful/react-apps-toolkit') as any as any).entry,
        fields: {},
        onSysChanged: vi.fn((cb) =>
          cb({
            publishedAt: '',
          } as unknown as EntrySys)
        ),
      },
    }));
    vi.spyOn(getFieldValue, 'default').mockImplementation(() => '');

    const slugFieldInfo = { slugField: '', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: false')).toBeDefined();
    expect(getByText('contentTypeHasSlugField: false')).toBeDefined();
    expect(getByText('isPublished: false')).toBeDefined();
    expect(getByText('reportSlug: /en-US')).toBeDefined();
    expect(getByText('slugFieldValue:')).toBeDefined();
    expect(getByText('isContentTypeWarning: true')).toBeDefined();
  });

  it('returns slug info and status when field value is updated', async () => {
    vi.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...(vi.importActual('@contentful/react-apps-toolkit') as any),
      entry: {
        ...(vi.importActual('@contentful/react-apps-toolkit') as any).entry,
        fields: { slugField: {} },
        onSysChanged: vi.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as EntrySys)
        ),
      },
    }));
    vi.spyOn(getFieldValue, 'default')
      .mockImplementationOnce(() => '/fieldValue')
      .mockImplementationOnce(() => '/differentFieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: true')).toBeDefined();
    expect(getByText('contentTypeHasSlugField: true')).toBeDefined();
    expect(getByText('isPublished: true')).toBeDefined();
    expect(getByText('reportSlug: /en-US/fieldValue')).toBeDefined();
    expect(getByText('slugFieldValue: /fieldValue')).toBeDefined();
    expect(getByText('isContentTypeWarning: false')).toBeDefined();

    const newSlugFieldValue = await findByText('slugFieldValue: /differentFieldValue');

    expect(newSlugFieldValue).toBeDefined();
    expect(getByText('reportSlug: /en-US/differentFieldValue')).toBeDefined();
  });

  it('returns slug info and status when a short text list field is selected and no URL prefix', async () => {
    vi.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...(vi.importActual('@contentful/react-apps-toolkit') as any),
      entry: {
        ...(vi.importActual('@contentful/react-apps-toolkit') as any).entry,
        fields: { slugField: {} },
        onSysChanged: vi.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as EntrySys)
        ),
      },
    }));
    vi.spyOn(getFieldValue, 'default').mockImplementation(() => ['category', 'pants', 'jeans']);
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: true')).toBeDefined();
    expect(getByText('contentTypeHasSlugField: true')).toBeDefined();
    expect(getByText('isPublished: true')).toBeDefined();
    expect(getByText('reportSlug: /category/pants/jeans')).toBeDefined();
    expect(getByText('slugFieldValue: category,pants,jeans')).toBeDefined();
    expect(getByText('isContentTypeWarning: false')).toBeDefined();
  });

  it('returns slug info and status with trailing slash', async () => {
    mockInstallationParams.parameters.installation.forceTrailingSlash = true;

    vi.spyOn(useSDK, 'useSDK').mockImplementation(() => ({
      ...mockInstallationParams,
      ...(vi.importActual('@contentful/react-apps-toolkit') as any),
      entry: {
        ...(vi.importActual('@contentful/react-apps-toolkit') as any).entry,
        fields: { slugField: {} },
        onSysChanged: vi.fn((cb) =>
          cb({
            publishedAt: '2020202',
          } as unknown as EntrySys)
        ),
      },
    }));
    vi.spyOn(getFieldValue, 'default').mockImplementation(() => '/fieldValue');
    const slugFieldInfo = { slugField: 'slugField', urlPrefix: '/en-US' };

    render(<TestComponent slugFieldInfo={slugFieldInfo} />);

    expect(getByText('slugFieldIsConfigured: true')).toBeDefined();
    expect(getByText('contentTypeHasSlugField: true')).toBeDefined();
    expect(getByText('isPublished: true')).toBeDefined();
    expect(getByText('reportSlug: /en-US/fieldValue/')).toBeDefined();
    expect(getByText('slugFieldValue: /fieldValue')).toBeDefined();
    expect(getByText('isContentTypeWarning: false')).toBeDefined();
  });
});
