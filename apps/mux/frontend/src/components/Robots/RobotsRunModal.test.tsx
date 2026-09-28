import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RobotsRunModal from './RobotsRunModal';
import { Track } from '../../util/types';
import { ROBOTS_WORKFLOWS } from '../../util/robotsTypes';

const captionTrack: Track = {
  type: 'text',
  id: 'track-1',
  name: 'US English',
  language_code: 'en-US',
  text_type: 'subtitles',
  closed_captions: true,
} as Track;

const renderModal = (overrides: Record<string, unknown> = {}) => {
  const onRun = vi.fn(async () => undefined);
  const onClose = vi.fn();
  render(
    <RobotsRunModal
      isShown
      onClose={onClose}
      onRun={onRun}
      assetId="asset-1"
      captions={[captionTrack]}
      audioTracks={[]}
      isRunDisabled={false}
      {...overrides}
    />
  );
  return { onRun, onClose };
};

// Note: cases that switch workflow by firing a `change` on the F36 `Select` are deliberately not
// here — the event does not reach the controlled component under jsdom, so they would be testing
// the harness. The behaviour they would cover (per-workflow validation, and which parameters
// actually get sent) is covered directly in `util/robotsCatalog.test.ts`.
describe('RobotsRunModal', () => {
  it('offers every workflow in the catalog', () => {
    renderModal();
    const select = screen.getByLabelText('Workflow') as HTMLSelectElement;
    const values = Array.from(select.querySelectorAll('option')).map((option) => option.value);
    expect(values.sort()).toEqual([...ROBOTS_WORKFLOWS].sort());
  });

  it('groups them by category', () => {
    renderModal();
    const select = screen.getByLabelText('Workflow');
    const groups = Array.from(select.querySelectorAll('optgroup')).map((group) =>
      group.getAttribute('label')
    );
    expect(groups).toEqual(['Accessibility', 'Insights', 'Structure', 'Trust & Safety']);
  });

  it('says so rather than offering an empty picker when there is no track', () => {
    render(
      <RobotsRunModal
        isShown
        onClose={vi.fn()}
        onRun={vi.fn(async () => undefined)}
        assetId="asset-1"
        captions={[]}
        audioTracks={[]}
        isRunDisabled={false}
        initialWorkflow="translate-captions"
      />
    );

    expect(screen.getByText(/This asset has no caption track to use/)).toBeInTheDocument();
  });

  it('keeps Run unavailable when the caller says so', () => {
    renderModal({ isRunDisabled: true, runDisabledReason: 'Nope' });
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('closes on confirm without waiting for the run to start', async () => {
    // The job table shows the run from here on, including while it waits behind a publish.
    const onRun = vi.fn(() => new Promise<void>(() => undefined));
    const { onClose } = renderModal({ onRun });

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Run Summarize' }));

    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

/**
 * The cases below do switch workflow, via `userEvent.selectOptions` rather than
 * `fireEvent.change` — the latter does not reach the F36 `Select`'s controlled state under jsdom,
 * which is what the note above is about.
 */
describe('RobotsRunModal form widgets', () => {
  const pick = async (workflow: string) => {
    await userEvent.selectOptions(screen.getByLabelText('Workflow'), workflow);
  };

  it('shows a blocking validation message while the editor is still filling the form', async () => {
    // Not on the confirm step. "Needs at least one replacement rule" used to be a `notes` entry,
    // which renders after Continue — i.e. after the editor has committed to a billable run.
    renderModal();
    await pick('edit-captions');

    expect(await screen.findByText(/Add at least one replacement rule/)).toBeInTheDocument();
    // And Continue is disabled, not merely inert. It used to look available and silently do
    // nothing, which reads as a broken button rather than as a reason to scroll up.
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    // Still on the form: Continue did not advance to the confirm step.
    expect(screen.queryByText(/consume Mux AI units/)).not.toBeInTheDocument();
    expect(screen.getByText(/Add at least one replacement rule/)).toBeInTheDocument();
  });

  it('states the chapters transcript requirement on the form, and blocks Continue', async () => {
    // Reported: the editor found out a chapters run needed a transcript only when the job
    // failed. Same mechanism `find-key-moments` already used — a precondition checked against
    // the asset context, surfaced before Continue rather than after it.
    render(
      <RobotsRunModal
        isShown
        onClose={vi.fn()}
        onRun={vi.fn(async () => undefined)}
        assetId="asset-1"
        captions={[]}
        audioTracks={[]}
        isRunDisabled={false}
        initialWorkflow="generate-chapters"
      />
    );

    expect(await screen.findByText(/no caption track/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('lets a chapters run through once the video has captions', async () => {
    renderModal({ initialWorkflow: 'generate-chapters' });
    expect(screen.queryByText(/no caption track/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  /**
   * A parameter that can make the video unplayable is armed on the form and explained on the
   * confirm step. The point of the two screens is that the second one is where the editor learns
   * what the first one did — see ADR-0014.
   */
  describe("moderate's playback-ID deletion", () => {
    const arm = async () => {
      const rendered = renderModal({ initialWorkflow: 'moderate' });
      await userEvent.selectOptions(
        screen.getByLabelText('If the video is flagged'),
        'delete_playback_ids'
      );
      return rendered;
    };

    it('does not warn about a run that only records scores', async () => {
      renderModal({ initialWorkflow: 'moderate' });
      expect((screen.getByLabelText('If the video is flagged') as HTMLSelectElement).value).toBe(
        ''
      );

      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(await screen.findByText(/consume Mux AI units/)).toBeInTheDocument();
      expect(screen.queryByTestId('robots-confirm-warning')).not.toBeInTheDocument();
    });

    it('names the consequence on the confirm step before the job is created', async () => {
      await arm();
      // Nothing on the form screen has run anything yet, and the warning belongs where the
      // decision is committed.
      expect(screen.queryByTestId('robots-confirm-warning')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
      const warning = await screen.findByTestId('robots-confirm-warning');
      expect(warning).toHaveTextContent('unplayable');
      expect(warning).toHaveTextContent('Playback tab');
    });

    it('drops the warning again when the editor goes back and disarms it', async () => {
      const { onRun } = await arm();
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(await screen.findByTestId('robots-confirm-warning')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Back' }));
      await userEvent.selectOptions(screen.getByLabelText('If the video is flagged'), '');
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

      expect(await screen.findByText(/consume Mux AI units/)).toBeInTheDocument();
      expect(screen.queryByTestId('robots-confirm-warning')).not.toBeInTheDocument();
      expect(onRun).not.toHaveBeenCalled();
    });

    it('sends the action Mux documents when the run is confirmed', async () => {
      const { onRun } = await arm();
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await userEvent.click(screen.getByRole('button', { name: 'Run Moderate' }));

      expect(onRun).toHaveBeenCalledWith('moderate', {
        asset_id: 'asset-1',
        on_flagged: { action: 'delete_playback_ids' },
      });
    });
  });

  it('keeps the profanity fields — and the request — behind one explicit opt-in', async () => {
    renderModal();
    await pick('edit-captions');

    expect(screen.queryByLabelText('How to censor')).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Censor profanity'));
    expect(await screen.findByLabelText('How to censor')).toBeInTheDocument();
    // And the documented default is what is preselected, not a synthetic "leave as is".
    expect((screen.getByLabelText('How to censor') as HTMLSelectElement).value).toBe('blank');
  });

  it('lets a phrase hint contain spaces, and a list contain more than one line', async () => {
    // The reported bug, at its root: the textarea was controlled off the *parsed* array, so every
    // keystroke was trimmed and blank-filtered before it came back — a trailing space vanished
    // before a second word could be typed, and Enter never produced a second line.
    renderModal();
    await pick('generate-premium-captions');

    const textarea = screen.getByLabelText('Phrase hints') as HTMLTextAreaElement;
    await userEvent.type(textarea, 'Mux Video{enter}Contentful App');

    expect(textarea.value).toBe('Mux Video\nContentful App');
  });

  it('keeps a trailing space the editor is in the middle of typing', async () => {
    renderModal();
    await pick('generate-premium-captions');

    const textarea = screen.getByLabelText('Phrase hints') as HTMLTextAreaElement;
    await userEvent.type(textarea, 'Acme ');
    expect(textarea.value).toBe('Acme ');
  });

  it('never truncates an over-long entry mid-word; it says so instead', async () => {
    renderModal();
    await pick('generate-premium-captions');

    const textarea = screen.getByLabelText('Phrase hints') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'a'.repeat(60) } });

    expect(textarea.value).toHaveLength(60);
    expect(await screen.findByText(/at most 49 characters/)).toBeInTheDocument();
  });

  it('offers rubric priorities as checkboxes over the documented enum, capped at four', async () => {
    renderModal({ initialWorkflow: 'find-key-moments' });

    // A free-text list is how the guide's own example produces invalid members.
    expect(screen.getByLabelText('Novelty')).toBeInTheDocument();
    expect(screen.getByText('0 of 4 chosen.')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Novelty'));
    expect(screen.getByText('1 of 4 chosen.')).toBeInTheDocument();
  });

  it('lets a question be answered freely, which disables its options box', async () => {
    renderModal({ initialWorkflow: 'ask-questions' });

    const options = screen.getByLabelText('Answer options for question 1');
    expect(options).not.toBeDisabled();

    await userEvent.selectOptions(screen.getByLabelText('How question 1 is answered'), 'free_form');
    expect(screen.getByLabelText('Answer options for question 1')).toBeDisabled();
  });

  it('drops the two find-key-moments banners', async () => {
    renderModal({ initialWorkflow: 'find-key-moments' });
    expect(screen.queryByText(/the API requires them together/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Generate captions first, or turn visual evidence on/)).toBeNull();
    // The useful half lives with the fields it concerns, once.
    expect(screen.getAllByText(/Set both bounds, or neither\./)).toHaveLength(1);
  });

  it('lists the workflows an audio-only video cannot run, disabled and saying why', () => {
    renderModal({ isAudioOnly: true });
    const option = (value: string) =>
      screen
        .getByLabelText('Workflow')
        .querySelector(`option[value="${value}"]`) as HTMLOptionElement;

    for (const value of ['find-scenes', 'find-best-thumbnails']) {
      expect(option(value)).toBeDisabled();
      expect(option(value).textContent).toMatch(/\(not available for audio-only\)$/);
    }
    // Every other workflow is still on offer.
    expect(option('find-key-moments')).toBeEnabled();
    expect(option('moderate')).toBeEnabled();
    expect(screen.getByLabelText('Workflow').querySelectorAll('option:disabled')).toHaveLength(2);
  });

  it('disables nothing when the asset kind is unknown or has pictures', () => {
    for (const isAudioOnly of [undefined, false]) {
      const { unmount } = render(
        <RobotsRunModal
          isShown
          onClose={vi.fn()}
          onRun={vi.fn(async () => undefined)}
          assetId="asset-1"
          captions={[captionTrack]}
          audioTracks={[]}
          isAudioOnly={isAudioOnly}
          isRunDisabled={false}
        />
      );
      expect(screen.getByLabelText('Workflow').querySelectorAll('option:disabled')).toHaveLength(0);
      unmount();
    }
  });

  it('opens on the default rather than on a workflow this video cannot run', () => {
    renderModal({ isAudioOnly: true, initialWorkflow: 'find-scenes' });
    expect((screen.getByLabelText('Workflow') as HTMLSelectElement).value).toBe('summarize');
    expect(screen.getByLabelText('Tone')).toBeInTheDocument();
  });

  it('moves off a workflow that turns out to be unavailable while the form is open', async () => {
    // An entry whose value predates `audioOnly` learns it on the next asset read, which can land
    // after the editor picked find-scenes.
    const props = {
      isShown: true,
      onClose: vi.fn(),
      onRun: vi.fn(async () => undefined),
      assetId: 'asset-1',
      captions: [captionTrack],
      audioTracks: [],
      isRunDisabled: false,
    };
    const { rerender } = render(<RobotsRunModal {...props} />);
    await userEvent.selectOptions(screen.getByLabelText('Workflow'), 'find-scenes');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('button', { name: 'Run Find scenes' })).toBeInTheDocument();

    rerender(<RobotsRunModal {...props} isAudioOnly />);

    // Off the confirm step it was on, and onto a workflow it can run — never "Run Find scenes".
    expect(screen.queryByRole('button', { name: /Run Find scenes/ })).not.toBeInTheDocument();
    expect((screen.getByLabelText('Workflow') as HTMLSelectElement).value).toBe('summarize');

    // And it stays there if the kind goes unknown again, rather than bringing find-scenes back.
    rerender(<RobotsRunModal {...props} />);
    expect((screen.getByLabelText('Workflow') as HTMLSelectElement).value).toBe('summarize');
  });

  it('does not block find-scenes when the caller does not know the asset kind', async () => {
    renderModal({ initialWorkflow: 'find-scenes' });
    expect(screen.queryByText(/audio-only/)).not.toBeInTheDocument();
  });

  it('takes the replace-existing checkbox away with the upload it depends on', async () => {
    // The documented pair — "When false, no track is created and `replace_existing` must also be
    // false" — used to be two boxes the editor could tick before being refused.
    renderModal({ initialWorkflow: 'generate-premium-captions' });

    expect(screen.getByLabelText('Replace the existing caption track')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Attach the result to the Mux asset'));
    expect(screen.queryByLabelText('Replace the existing caption track')).not.toBeInTheDocument();
    // And no error where the impossible combination used to produce one.
    expect(screen.queryByText(/Fix these before running/)).not.toBeInTheDocument();
  });

  it('takes the delete-original checkbox away for the same reason', async () => {
    renderModal({ initialWorkflow: 'edit-captions' });

    expect(screen.getByLabelText('Delete the original track')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Attach the result to the Mux asset'));
    expect(screen.queryByLabelText('Delete the original track')).not.toBeInTheDocument();
  });

  it("hides moderate's language picker once the asset is known to have pictures", () => {
    renderModal({ initialWorkflow: 'moderate', isAudioOnly: false });
    expect(screen.queryByLabelText('Captions to read')).not.toBeInTheDocument();
  });

  it('shows it for an audio-only asset', () => {
    renderModal({ initialWorkflow: 'moderate', isAudioOnly: true });
    expect(screen.getByLabelText('Captions to read')).toBeInTheDocument();
  });

  it('shows it when the asset kind is unknown, rather than hiding a usable control', () => {
    renderModal({ initialWorkflow: 'moderate' });
    expect(screen.getByLabelText('Captions to read')).toBeInTheDocument();
  });

  it('refuses a scope that ends before it starts, before Continue', async () => {
    renderModal({ initialWorkflow: 'summarize' });
    fireEvent.change(screen.getByLabelText('Start time (seconds)'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('End time (seconds)'), { target: { value: '30' } });

    expect(
      await screen.findByText('The start time must be before the end time.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('End time (seconds)'), { target: { value: '120' } });
    expect(screen.queryByText(/must be before the end time/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('refuses a start past the end of a video whose length it was given', async () => {
    renderModal({ initialWorkflow: 'moderate', duration: 60 });
    fireEvent.change(screen.getByLabelText('Start time (seconds)'), { target: { value: '75' } });
    expect(
      await screen.findByText(/past the end of the video, which is 60 seconds long/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('draws a section as one labelled group holding exactly its fields', () => {
    renderModal({ initialWorkflow: 'summarize' });
    const tags = screen.getByRole('group', { name: 'Tags' });
    expect(within(tags).getByLabelText('Number of tags')).toBeInTheDocument();
    expect(within(tags).getByText('Tag taxonomy')).toBeInTheDocument();
    expect(within(tags).queryByLabelText('Tone')).not.toBeInTheDocument();

    const scope = screen.getByRole('group', { name: 'Part of the video' });
    expect(within(scope).getByLabelText('Start time (seconds)')).toBeInTheDocument();
    expect(within(scope).getByLabelText('End time (seconds)')).toBeInTheDocument();
    expect(within(scope).getByText(/Leave both empty to use all of it/)).toBeInTheDocument();
  });

  it('says what an empty premium-captions track name becomes, with no template in the box', () => {
    renderModal({ initialWorkflow: 'generate-premium-captions' });
    const trackName = screen.getByLabelText('Track name') as HTMLInputElement;
    expect(trackName.placeholder).toBe('');
    expect(screen.getByText(/"English \(Generated\)" for English audio/)).toBeInTheDocument();
  });

  it("centres each replacement row's case-sensitivity box in its cell", async () => {
    renderModal({ initialWorkflow: 'edit-captions' });
    await userEvent.click(screen.getByRole('button', { name: 'Add replacement' }));

    const checkbox = screen.getByLabelText('Case sensitive 1');
    const cell = checkbox.closest('td') as HTMLElement;
    expect(cell).toHaveStyle({ verticalAlign: 'middle', textAlign: 'center' });
    // F36's Checkbox pins its box to the left of a full-width column, so the cell's alignment
    // alone would not move it; the wrapper directly inside the cell is what centres it.
    expect(cell.firstElementChild).toHaveStyle({ justifyContent: 'center' });
  });

  it('middle-aligns the other row editors too', async () => {
    const { unmount } = render(
      <RobotsRunModal
        isShown
        onClose={vi.fn()}
        onRun={vi.fn(async () => undefined)}
        assetId="asset-1"
        captions={[captionTrack]}
        audioTracks={[]}
        isRunDisabled={false}
        initialWorkflow="ask-questions"
      />
    );
    expect(screen.getByLabelText('Question 1').closest('td')).toHaveStyle({
      verticalAlign: 'middle',
    });
    unmount();

    renderModal({ initialWorkflow: 'summarize' });
    await userEvent.click(screen.getByRole('button', { name: 'Add value' }));
    expect(screen.getByLabelText('Taxonomy value 1').closest('td')).toHaveStyle({
      verticalAlign: 'middle',
    });
  });

  it('never draws the confirm step for a workflow the editor did not continue with', async () => {
    // The swap to the default happens in render; a confirm flag reset by an effect would draw one
    // frame of Summarize's confirm step in between, with the old workflow's values behind it.
    const props = {
      isShown: true,
      onClose: vi.fn(),
      onRun: vi.fn(async () => undefined),
      assetId: 'asset-1',
      captions: [captionTrack],
      audioTracks: [],
      isRunDisabled: false,
    };
    const { rerender } = render(<RobotsRunModal {...props} />);
    await userEvent.selectOptions(screen.getByLabelText('Workflow'), 'find-scenes');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Everything that reached the DOM, including what was taken out of it again: a step drawn
    // for one frame and then removed still says what it said when it went.
    const drawn: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => drawn.push(node.textContent ?? ''));
        record.removedNodes.forEach((node) => drawn.push(node.textContent ?? ''));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    rerender(<RobotsRunModal {...props} isAudioOnly />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    observer.disconnect();

    expect(drawn.some((text) => /This will run Summarize/.test(text))).toBe(false);
    expect(props.onRun).not.toHaveBeenCalled();
  });

  it('keeps only the two translate-audio notes an editor can act on', () => {
    renderModal({ initialWorkflow: 'translate-audio' });
    expect(screen.getByText(/no audio track/)).toBeInTheDocument();
    expect(screen.getByText('Dubbing may not be enabled on every account.')).toBeInTheDocument();
    expect(screen.queryByText(/Experimental/)).not.toBeInTheDocument();
    expect(screen.queryByText(/no way to check/)).not.toBeInTheDocument();
  });
});

/**
 * The controlled-vocabulary editor. The conversion these rows go through is covered without a DOM
 * in `util/robotsCatalog.test.ts`; what is here is what only a mounted component can show — that
 * the rows exist, are editable, and start empty rather than pre-seeded.
 */
describe('RobotsRunModal taxonomy editor', () => {
  it('offers a tag taxonomy on summarize, starting with no rows', async () => {
    renderModal({ initialWorkflow: 'summarize' });

    expect(screen.getByText('Tag taxonomy')).toBeInTheDocument();
    expect(screen.queryByLabelText('Taxonomy value 1')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add value' }));
    expect(screen.getByLabelText('Taxonomy value 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Description for taxonomy value 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Aliases for taxonomy value 1')).toBeInTheDocument();
  });

  it('keeps every keystroke of a multi-word label', async () => {
    renderModal({ initialWorkflow: 'summarize' });
    await userEvent.click(screen.getByRole('button', { name: 'Add value' }));

    const label = screen.getByLabelText('Taxonomy value 1') as HTMLInputElement;
    await userEvent.type(label, 'Product demo');
    expect(label.value).toBe('Product demo');
  });

  it('removes a row without disturbing the others', async () => {
    renderModal({ initialWorkflow: 'summarize' });
    await userEvent.click(screen.getByRole('button', { name: 'Add value' }));
    await userEvent.type(screen.getByLabelText('Taxonomy value 1'), 'First');
    await userEvent.click(screen.getByRole('button', { name: 'Add value' }));
    await userEvent.type(screen.getByLabelText('Taxonomy value 2'), 'Second');

    await userEvent.click(screen.getByRole('button', { name: 'Remove taxonomy value 1' }));
    expect((screen.getByLabelText('Taxonomy value 1') as HTMLInputElement).value).toBe('Second');
    expect(screen.queryByLabelText('Taxonomy value 2')).not.toBeInTheDocument();
  });

  it('offers a topic taxonomy on find-scenes with no count to spend', () => {
    // `summarize` documents "Supports 1-50 values" and shows the counter; `find-scenes` documents
    // no cap at all, so there is nothing honest to count against.
    renderModal({ initialWorkflow: 'find-scenes' });
    expect(screen.getByText('Topic taxonomy')).toBeInTheDocument();
    expect(screen.queryByText(/of 50 used\./)).not.toBeInTheDocument();
  });

  it('offers one on find-key-moments too', () => {
    renderModal({ initialWorkflow: 'find-key-moments' });
    expect(screen.getByText('Topic taxonomy')).toBeInTheDocument();
  });

  it('offers "allow values outside this list" as a checkbox, ticked, with no third state', async () => {
    // It was a three-option select whose empty member omitted `allow_other`. The API rejects the
    // taxonomy object without it, so there is no "no preference" to offer — and the remaining
    // default has to be the permissive one, since clearing it filters the output.
    renderModal({ initialWorkflow: 'summarize' });
    const checkbox = screen.getByLabelText('Allow values outside this list') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(screen.queryByLabelText('Values outside this list')).not.toBeInTheDocument();

    await userEvent.click(checkbox);
    expect(
      (screen.getByLabelText('Allow values outside this list') as HTMLInputElement).checked
    ).toBe(false);
  });

  it('will not run a taxonomy that has a name but nothing in it', async () => {
    renderModal({ initialWorkflow: 'summarize' });
    await userEvent.type(screen.getByLabelText('Taxonomy name'), 'Content pillars');

    expect(
      await screen.findByText('Tag taxonomy: add at least one value, or clear the taxonomy name.')
    ).toBeInTheDocument();
  });
});
