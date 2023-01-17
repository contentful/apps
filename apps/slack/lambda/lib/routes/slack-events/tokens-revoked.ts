import { AuthTokenRepository } from '../auth-token';
import { TokensRevokedEvent } from './types';

export async function handleTokensRevokedEvent(
  authTokenRepository: AuthTokenRepository,
  event: TokensRevokedEvent
) {
  await authTokenRepository.deleteByWorkspaceId(event.team_id);
}
