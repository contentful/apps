import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutomationConfiguration from './AutomationConfiguration';
import MuxAssetConfigurationModal from './MuxAssetConfigurationModal';
import { directiveNamesById, useRobotsDirectiveNames } from '../Robots/useRobotsDirectiveNames';
import { MuxApiService } from '../../util/muxApi';
import { ROBOTS_DIRECTIVES_SET_BY_ADMIN } from '../../util/robotsAccess';

/**
 * The Automation section of the upload modal.
 *
 * It listed raw directive ids — `drv_01H8X...` — as the whole label, next to a checkbox asking
 * the editor whether to spend Mux AI units on this upload. An id is not a question anyone can
 * answer.
 */
describe('AutomationConfiguration', () => {
  it('labels a directive with its name, and keeps the id underneath', () => {
    render(
      <AutomationConfiguration
        availableDirectiveIds={['drv_1']}
        selectedDirectiveIds={['drv_1']}
        directiveNames={{ drv_1: 'Publish pipeline' }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Publish pipeline')).toBeInTheDocument();
    // The id is what the configuration screen and the Mux dashboard identify it by, so it stays.
    expect(screen.getByText('drv_1')).toBeInTheDocument();
  });

  it('falls back to the id when the name cannot be resolved', () => {
    render(
      <AutomationConfiguration
        availableDirectiveIds={['drv_deleted']}
        selectedDirectiveIds={[]}
        directiveNames={{}}
        onChange={vi.fn()}
      />
    );

    // Exactly once: an unresolved directive must not render the id as both label and help text.
    expect(screen.getAllByText('drv_deleted')).toHaveLength(1);
  });

  it('renders with no names at all, because the listing is never waited on', () => {
    render(
      <AutomationConfiguration
        availableDirectiveIds={['drv_1']}
        selectedDirectiveIds={[]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('drv_1')).toBeInTheDocument();
  });
});

/**
 * Someone who cannot run Robots still uploads with the admin's directives: they are listed, not
 * offered. See ADR-0016.
 */
describe('AutomationConfiguration, read-only', () => {
  const renderReadOnly = (onChange = vi.fn()) => {
    render(
      <AutomationConfiguration
        availableDirectiveIds={['drv_1', 'drv_gone']}
        selectedDirectiveIds={['drv_1']}
        missingDirectiveIds={['drv_gone']}
        directiveNames={{ drv_1: 'Publish pipeline', drv_gone: 'drv_gone' }}
        isReadOnly
        onChange={onChange}
      />
    );
    return onChange;
  };

  it('lists the defaults with who set them, and offers no checkbox', () => {
    renderReadOnly();

    expect(screen.getByText(ROBOTS_DIRECTIVES_SET_BY_ADMIN)).toBeInTheDocument();
    expect(screen.getByText('Publish pipeline')).toBeInTheDocument();
    expect(screen.getByText('drv_1')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('still says which of them Mux does not have', () => {
    renderReadOnly();

    expect(
      screen.getByText(/Mux does not have this directive, so it will not run/)
    ).toBeInTheDocument();
  });

  it('never calls onChange', () => {
    const onChange = renderReadOnly();

    fireEvent.click(screen.getByText('Publish pipeline'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('directiveNamesById', () => {
  it('prefers the listed name and keeps every id answerable', () => {
    expect(
      directiveNamesById([{ id: 'drv_1', name: 'Publish pipeline' }], ['drv_1', 'drv_2'])
    ).toEqual({ drv_1: 'Publish pipeline', drv_2: 'drv_2' });
  });

  it('answers an id for a directive whose name Mux left empty', () => {
    expect(directiveNamesById([{ id: 'drv_1', name: '' }], [])).toEqual({ drv_1: 'drv_1' });
  });
});

describe('useRobotsDirectiveNames', () => {
  const Probe = ({
    muxApi,
    ids,
    isEnabled = true,
  }: {
    muxApi?: MuxApiService;
    ids: string[];
    isEnabled?: boolean;
  }) => {
    const names = useRobotsDirectiveNames(muxApi, ids, isEnabled);
    return <span data-testid="names">{JSON.stringify(names)}</span>;
  };

  it('resolves names once and hands back the ids until they arrive', async () => {
    const listRobotsDirectives = vi.fn(async () => ({
      data: [{ id: 'drv_1', name: 'Publish pipeline' }],
    }));
    render(<Probe muxApi={{ listRobotsDirectives } as never} ids={['drv_1']} />);

    // Before the listing resolves, the id is the answer — which is what stops this ever holding
    // an upload up.
    expect(screen.getByTestId('names')).toHaveTextContent('{"drv_1":"drv_1"}');
    await waitFor(() =>
      expect(screen.getByTestId('names')).toHaveTextContent('{"drv_1":"Publish pipeline"}')
    );
    expect(listRobotsDirectives).toHaveBeenCalledTimes(1);
  });

  it('degrades to the id when the listing fails', async () => {
    const listRobotsDirectives = vi.fn(async () => {
      throw new Error('403');
    });
    render(<Probe muxApi={{ listRobotsDirectives } as never} ids={['drv_1']} />);

    await waitFor(() => expect(listRobotsDirectives).toHaveBeenCalled());
    expect(screen.getByTestId('names')).toHaveTextContent('{"drv_1":"drv_1"}');
  });

  it('calls nothing when there is nothing to resolve', () => {
    const listRobotsDirectives = vi.fn(async () => ({ data: [] }));
    render(<Probe muxApi={{ listRobotsDirectives } as never} ids={[]} />);

    expect(listRobotsDirectives).not.toHaveBeenCalled();
  });

  it('calls nothing while disabled, so editing an asset costs no round trip', () => {
    const listRobotsDirectives = vi.fn(async () => ({ data: [] }));
    render(<Probe muxApi={{ listRobotsDirectives } as never} ids={['drv_1']} isEnabled={false} />);

    expect(listRobotsDirectives).not.toHaveBeenCalled();
  });
});

/**
 * The configured ids come from installation parameters, which the web app hands this iframe once,
 * when it loads. A directive deleted in Mux since then — or one from a token that has since been
 * replaced — is still in that snapshot. The listing the names come from is Mux now, through the
 * saved credentials, and says which ones it does not have.
 */
describe('directives Mux does not have', () => {
  const Probe = ({ muxApi, ids }: { muxApi?: MuxApiService; ids: string[] }) => {
    const { missingIds } = useRobotsDirectiveNames(muxApi, ids, true);
    return <span data-testid="missing">{missingIds.join(',')}</span>;
  };

  it('names the configured ids a complete listing does not return', async () => {
    const listRobotsDirectives = vi.fn(async () => ({ data: [{ id: 'drv_live', name: 'Live' }] }));
    render(<Probe muxApi={{ listRobotsDirectives } as never} ids={['drv_live', 'drv_gone']} />);

    await waitFor(() => expect(screen.getByTestId('missing')).toHaveTextContent('drv_gone'));
    expect(screen.getByTestId('missing')).not.toHaveTextContent('drv_live');
  });

  it('names none from a full page, which may not be every directive in the account', async () => {
    const page = Array.from({ length: 100 }, (_, index) => ({ id: `drv_${index}` }));
    const listRobotsDirectives = vi.fn(async () => ({ data: page }));
    render(<Probe muxApi={{ listRobotsDirectives } as never} ids={['drv_gone']} />);

    await waitFor(() => expect(listRobotsDirectives).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.getByTestId('missing')).toHaveTextContent('');
  });

  it('names none when the listing fails, because that is not evidence of absence', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const listRobotsDirectives = vi.fn(async () => {
      throw new Error('403');
    });
    render(<Probe muxApi={{ listRobotsDirectives } as never} ids={['drv_gone']} />);

    await waitFor(() => expect(listRobotsDirectives).toHaveBeenCalled());
    expect(screen.getByTestId('missing')).toHaveTextContent('');
    consoleError.mockRestore();
  });

  it('shows a missing directive as unavailable rather than as a choice', () => {
    render(
      <AutomationConfiguration
        availableDirectiveIds={['drv_live', 'drv_gone']}
        selectedDirectiveIds={['drv_live', 'drv_gone']}
        missingDirectiveIds={['drv_gone']}
        directiveNames={{ drv_live: 'Live', drv_gone: 'drv_gone' }}
        onChange={vi.fn()}
      />
    );

    const gone = screen.getByRole('checkbox', { name: 'drv_gone' });
    expect(gone).toBeDisabled();
    expect(gone).not.toBeChecked();
    expect(
      screen.getByText(/Mux does not have this directive, so it will not run/)
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Live' })).toBeChecked();
  });

  it('wraps a long id rather than letting it widen the modal', () => {
    const long = `drv_${'x'.repeat(90)}`;
    render(
      <AutomationConfiguration
        availableDirectiveIds={[long, 'drv_named']}
        selectedDirectiveIds={[]}
        directiveNames={{ [long]: long, drv_named: 'Named' }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText(long)).toHaveStyle({ wordBreak: 'break-word' });
    expect(screen.getByText('drv_named')).toHaveStyle({ wordBreak: 'break-word' });
  });

  describe('in the upload modal', () => {
    const sdk = {
      entry: { fields: {}, getSys: () => ({ id: 'entry-1' }) },
      field: { id: 'muxVideo' },
    } as never;

    const upload = async (
      listRobotsDirectives: () => Promise<unknown>,
      canChooseDirectives = true
    ) => {
      const onConfirm = vi.fn();
      render(
        <MuxAssetConfigurationModal
          isShown
          onClose={vi.fn()}
          onConfirm={onConfirm}
          installationParams={{
            muxEnableSignedUrls: false,
            muxDefaultDirectiveIds: ['drv_live', 'drv_gone'],
          }}
          sdk={sdk}
          canChooseDirectives={canChooseDirectives}
          muxApi={{ listRobotsDirectives } as never}
        />
      );
      await waitFor(() => expect(screen.getByRole('button', { name: 'Upload' })).toBeEnabled());
      await new Promise((resolve) => setTimeout(resolve, 20));
      fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
      return onConfirm.mock.calls[0]?.[0]?.directiveIds;
    };

    it('does not attach a directive Mux says it does not have', async () => {
      expect(await upload(async () => ({ data: [{ id: 'drv_live', name: 'Live' }] }))).toEqual([
        'drv_live',
      ]);
    });

    it('attaches everything configured when the listing cannot say', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      expect(
        await upload(async () => {
          throw new Error('403');
        })
      ).toEqual(['drv_live', 'drv_gone']);
      consoleError.mockRestore();
    });

    it('attaches the defaults for someone who cannot choose them', async () => {
      expect(
        await upload(async () => ({ data: [{ id: 'drv_live', name: 'Live' }] }), false)
      ).toEqual(['drv_live']);
    });

    it('lists the defaults instead of offering them, for someone who cannot choose', async () => {
      render(
        <MuxAssetConfigurationModal
          isShown
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          installationParams={{ muxEnableSignedUrls: false, muxDefaultDirectiveIds: ['drv_live'] }}
          sdk={sdk}
          canChooseDirectives={false}
          muxApi={{ listRobotsDirectives: async () => ({ data: [] }) } as never}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Automation' }));

      expect(await screen.findByText(ROBOTS_DIRECTIVES_SET_BY_ADMIN)).toBeInTheDocument();
      expect(screen.queryByRole('checkbox', { name: /drv_live/ })).not.toBeInTheDocument();
    });
  });
});
