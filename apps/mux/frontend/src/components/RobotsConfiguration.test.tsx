import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import RobotsConfiguration from './RobotsConfiguration';
import Config from '../locations/config';

/**
 * The config screen calls `api.mux.com` itself, because it has to work before the app is
 * installed (ADR-0006). It used to classify what came back on its own — every 403 as a missing
 * scope — and so told an account that had only not accepted the Robots terms to throw away a
 * working token. It now asks the Robots tab's classifier and shows the tab's notes.
 */

const COST_WARNING = 'Directives selected here spend Mux AI units on every upload';
const TERMS_PAGE = 'https://dashboard.mux.com/organizations/org-1/environments/env-1/robots/jobs';

/** What `fetch` resolves with, reduced to what the screen reads. */
const answer = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const listWith = (response: ReturnType<typeof answer> | Error) => {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  render(
    <RobotsConfiguration
      tokenId="token-id"
      tokenSecret="token-secret"
      directiveIds={[]}
      onChange={vi.fn()}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'List directives' }));
  return fetchMock;
};

describe('RobotsConfiguration — what a refused listing says', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tells an account that has not accepted the terms to accept them, not to replace its token', async () => {
    listWith(
      answer(403, {
        error: {
          type: 'forbidden',
          messages: [
            `Go to your Robots page in the Mux Dashboard to accept the terms: ${TERMS_PAGE}`,
          ],
        },
      })
    );

    const note = await screen.findByTestId('robots-not-enabled');
    expect(
      within(note).getByRole('link', { name: /Accept the Robots terms in your Mux dashboard/ })
    ).toHaveAttribute('href', TERMS_PAGE);
    expect(screen.queryByTestId('robots-scope-missing')).not.toBeInTheDocument();
    expect(screen.queryByText(/robots:\* scope/)).not.toBeInTheDocument();
    // Nor that the account has no directives, which is not what Mux said.
    expect(screen.queryByText(/has no directives yet/)).not.toBeInTheDocument();
  });

  it('drops the note once a reload succeeds', async () => {
    const fetchMock = listWith(answer(403, { error: { type: 'forbidden', messages: ['No'] } }));
    expect(await screen.findByTestId('robots-not-enabled')).toBeInTheDocument();

    fetchMock.mockImplementation(async () =>
      answer(200, { data: [{ id: 'drv_1', name: 'Ingest' }] })
    );
    fireEvent.click(screen.getByRole('button', { name: 'List directives' }));

    expect(await screen.findByLabelText('Ingest')).toBeInTheDocument();
    expect(screen.queryByTestId('robots-not-enabled')).not.toBeInTheDocument();
  });

  it('says a token without the scope needs a new one', async () => {
    listWith(
      answer(401, {
        error: {
          type: 'unauthorized',
          messages: ["This token hasn't been granted the correct scope for this operation."],
        },
      })
    );

    expect(await screen.findByTestId('robots-scope-missing')).toBeInTheDocument();
    expect(screen.queryByTestId('robots-not-enabled')).not.toBeInTheDocument();
  });

  it('reports anything that says nothing about the account as what Mux returned', async () => {
    listWith(answer(500, { error: { type: 'server_error', messages: ['Down'] } }));

    expect(
      await screen.findByText('Mux returned 500 when listing directives.')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('robots-not-enabled')).not.toBeInTheDocument();
  });

  it('still offers the manual route when the browser cannot reach Mux at all', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    listWith(new TypeError('Failed to fetch'));

    expect(
      await screen.findByText(/Could not reach the Mux Robots API from the browser/)
    ).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('lists the directives when Mux answers', async () => {
    const fetchMock = listWith(answer(200, { data: [{ id: 'drv_1', name: 'Ingest' }] }));

    expect(await screen.findByLabelText('Ingest')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mux.com/robots/v1/directives?limit=100&page=1',
      expect.objectContaining({ method: 'GET' })
    );
  });
});

/**
 * The v1 list returns v0 directives too. One stays on v0 on every upload it is attached to until
 * someone replaces it with a v1 copy, so the screen that attaches it says so (ADR-0017).
 */
describe('RobotsConfiguration — directives still on Robots v0', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const v0 = {
    id: 'drv_old',
    name: 'Summ and Moderate',
    _links: { self: { href: '/robots/v0/directives/drv_old' } },
  };
  const v1 = {
    id: 'drv_new',
    name: 'Summ and Moderate v1',
    _links: { self: { href: '/robots/v1/directives/drv_new' } },
  };

  const renderSelected = (directiveIds: string[]) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => answer(200, { data: [v0, v1] }))
    );
    render(
      <RobotsConfiguration
        tokenId="token-id"
        tokenSecret="token-secret"
        directiveIds={directiveIds}
        onChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'List directives' }));
  };

  it('marks each v0 directive in the list, selected or not', async () => {
    renderSelected([]);

    const badge = await screen.findByText('v0');
    expect(screen.getAllByText('v0')).toHaveLength(1);
    expect(badge.closest('label')).toHaveTextContent(/^Summ and Moderate\s*v0$/);
    // Nothing selected runs on v0, so there is nothing to ask for yet. The cost warning stays.
    expect(screen.queryByTestId('robots-v0-directives')).not.toBeInTheDocument();
    expect(screen.getByText(COST_WARNING)).toBeInTheDocument();
  });

  it('puts the v0 note right under the cost warning, above the list', async () => {
    renderSelected(['drv_old']);

    const note = await screen.findByTestId('robots-v0-directives');
    const follows = (a: Node, b: Node) =>
      !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(screen.getByText(COST_WARNING), note)).toBe(true);
    expect(follows(note, screen.getByRole('checkbox', { name: /^Summ and Moderate\s*v0$/ }))).toBe(
      true
    );
  });

  it('asks for a v1 copy of a selected v0 directive, and links the migration guide', async () => {
    renderSelected(['drv_old', 'drv_new']);

    const note = await screen.findByTestId('robots-v0-directives');
    expect(note).toHaveTextContent('“Summ and Moderate” runs on Robots v0');
    expect(note).not.toHaveTextContent('Summ and Moderate v1');
    expect(within(note).getByRole('link', { name: /How to migrate directives/ })).toHaveAttribute(
      'href',
      'https://www.mux.com/docs/guides/robots-migrate-directives-to-v1'
    );
  });
});

/**
 * Configured ids that no longer resolve: a directive deleted in Mux, or one chosen under a token
 * that has since been replaced. Either way it cannot run, and it used to sit in the list looking
 * exactly like a directive typed in by hand, surviving every save. See ADR-0009.
 */
describe('RobotsConfiguration — selected ids this account does not have', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const LIVE = { id: 'drv_live', name: 'Ingest' };

  const renderWith = (
    props: Partial<Parameters<typeof RobotsConfiguration>[0]> = {},
    fetchImpl: () => Promise<unknown> = async () => answer(200, { data: [LIVE] })
  ) => {
    const fetchMock = vi.fn(fetchImpl);
    vi.stubGlobal('fetch', fetchMock);
    const onChange = vi.fn();
    const all = {
      tokenId: 'token-id',
      tokenSecret: 'token-secret',
      savedTokenId: 'token-id',
      savedTokenSecret: 'token-secret',
      directiveIds: ['drv_live', 'drv_deleted'],
      onChange,
      ...props,
    };
    const view = render(<RobotsConfiguration {...all} />);
    return { onChange, fetchMock, all, ...view };
  };

  const list = () => fireEvent.click(screen.getByRole('button', { name: /List directives/ }));

  it('marks a selected id a complete listing lacks, and offers to remove it', async () => {
    const { onChange } = renderWith();
    list();

    const missing = await screen.findByTestId('robots-directives-missing');
    expect(missing).toHaveTextContent('drv_deleted');
    expect(missing).not.toHaveTextContent('drv_live');
    // The live one is an ordinary checkbox again.
    expect(screen.getByLabelText('Ingest')).toBeChecked();

    fireEvent.click(within(missing).getByRole('button', { name: 'Remove drv_deleted' }));
    expect(onChange).toHaveBeenCalledWith(['drv_live']);
  });

  it('says nothing is missing before anything was listed — the ids are only unchecked', () => {
    renderWith();
    expect(screen.queryByTestId('robots-directives-missing')).not.toBeInTheDocument();
    expect(screen.getByText('Selected by ID')).toBeInTheDocument();
    expect(screen.getByText(/Not checked against this Mux account yet/)).toBeInTheDocument();
  });

  it('draws no conclusion from a listing that did not finish', async () => {
    // Page 1 full, page 2 refused: the deleted-looking id may simply be on a page never read.
    const fullPage = Array.from({ length: 100 }, (_, index) => ({
      id: `drv_${index}`,
      name: `D${index}`,
    }));
    let calls = 0;
    renderWith({}, async () => {
      calls += 1;
      return calls === 1
        ? answer(200, { data: fullPage })
        : answer(500, { error: { messages: ['Down'] } });
    });
    list();

    expect(
      await screen.findByText('Mux returned 500 when listing directives.')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('robots-directives-missing')).not.toBeInTheDocument();
    expect(screen.getByText('Selected by ID')).toBeInTheDocument();
  });

  it('stops trusting a listing once the form holds a different token', async () => {
    const { rerender, all } = renderWith();
    list();
    expect(await screen.findByTestId('robots-directives-missing')).toBeInTheDocument();

    rerender(<RobotsConfiguration {...all} tokenId="other-token" />);

    // Neither what it listed nor what it failed to list says anything about this token.
    expect(screen.queryByTestId('robots-directives-missing')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ingest')).not.toBeInTheDocument();
    expect(screen.getByText(/The Mux token has changed/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'List directives' })).toBeInTheDocument();
  });

  it('checks again with the new token, and the warning goes once it has', async () => {
    const { rerender, all, fetchMock } = renderWith();
    rerender(<RobotsConfiguration {...all} tokenId="other-token" />);
    expect(screen.getByText(/The Mux token has changed/)).toBeInTheDocument();

    fetchMock.mockImplementation(async () => answer(200, { data: [] }));
    list();

    const missing = await screen.findByTestId('robots-directives-missing');
    // Nothing selected exists under the new token: both are marked, and the warning is done.
    expect(missing).toHaveTextContent('drv_live');
    expect(missing).toHaveTextContent('drv_deleted');
    expect(screen.queryByText(/The Mux token has changed/)).not.toBeInTheDocument();
  });

  it('ignores an answer that arrives for a token the form no longer holds', async () => {
    let release: (value: unknown) => void = () => undefined;
    const { rerender, all } = renderWith({}, () => new Promise((resolve) => (release = resolve)));
    list();
    rerender(<RobotsConfiguration {...all} tokenId="other-token" />);

    await act(async () => {
      release(answer(200, { data: [LIVE] }));
    });

    expect(screen.queryByLabelText('Ingest')).not.toBeInTheDocument();
    expect(screen.queryByTestId('robots-directives-missing')).not.toBeInTheDocument();
  });

  it('does not call a first token "changed"', () => {
    renderWith({ savedTokenId: undefined, savedTokenSecret: undefined });
    expect(screen.queryByText(/The Mux token has changed/)).not.toBeInTheDocument();
  });

  it('has nothing to warn about when nothing is selected', () => {
    renderWith({ tokenId: 'other-token', directiveIds: [] });
    expect(screen.queryByText(/The Mux token has changed/)).not.toBeInTheDocument();
  });

  it('wraps every rendering of a long id rather than letting it run out', async () => {
    const long = `drv_${'x'.repeat(90)}`;
    renderWith({ directiveIds: [long, 'drv_named_elsewhere'] }, async () =>
      answer(200, {
        data: [
          { id: 'drv_named_elsewhere', name: 'Named' },
          { id: 'drv_unnamed', name: '' },
        ],
      })
    );
    // Before listing: under "Selected by ID".
    expect(screen.getByText(long)).toHaveStyle({ wordBreak: 'break-word' });

    list();
    // After: in the missing note, as an unnamed directive's label, and as a named one's id line.
    const missing = await screen.findByTestId('robots-directives-missing');
    expect(within(missing).getByText(long)).toHaveStyle({ wordBreak: 'break-word' });
    expect(screen.getByText('drv_unnamed')).toHaveStyle({ wordBreak: 'break-word' });
    expect(screen.getByText('drv_named_elsewhere')).toHaveStyle({ wordBreak: 'break-word' });
  });
});

describe('the config screen, wired', () => {
  it('flags the selected directives once the token they were chosen with is replaced', async () => {
    const sdk = {
      ids: { app: 'app-1' },
      app: {
        onConfigure: vi.fn(),
        getParameters: async () => ({
          muxAccessTokenId: 'token-one',
          muxAccessTokenSecret: 'secret-one',
          muxDefaultDirectiveIds: ['drv_1'],
        }),
        setReady: vi.fn(),
      },
      space: {
        getEditorInterfaces: async () => ({ items: [] }),
        getContentTypes: async () => ({ items: [] }),
      },
      notifier: { error: vi.fn(), success: vi.fn() },
    };
    render(<Config sdk={sdk as never} />);
    await waitFor(() => expect(sdk.app.setReady).toHaveBeenCalled());
    expect(screen.queryByText(/The Mux token has changed/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Mux access token/), { target: { value: 'token-two' } });

    expect(await screen.findByText(/The Mux token has changed/)).toBeInTheDocument();
  });
});
