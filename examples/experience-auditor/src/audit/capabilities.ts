import type { ExoSDK } from '@contentful/app-sdk';
import type { Capabilities } from './types';

/**
 * Probes which optional host surfaces the live `sdk.exo` actually backs.
 *
 * The toolbar host bridge intentionally degrades some surfaces (notably
 * selection) to "not supported" until later host work lands. Rather than call
 * an unsupported method and catch, the app asks this probe up front and renders
 * an informative, disabled affordance instead. This is the pattern a
 * well-behaved app uses when a host capability is still rolling out.
 */
export function detectCapabilities(exo: ExoSDK): Capabilities {
  const selection = exo.experience?.selection;
  return {
    selection: typeof selection?.set === 'function' && typeof selection?.highlight === 'function',
  };
}
