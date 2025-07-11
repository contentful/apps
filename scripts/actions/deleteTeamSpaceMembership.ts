import contentful from 'contentful-management';
import { createCMAClient } from './createCMAClient.ts';

interface DeleteTeamSpaceMembershipProps {
  client?: any;
  organizationId: string;
  spaceId: string;
  teamId: string;
}

export async function deleteTeamSpaceMemberShip({
  client,
  organizationId,
  spaceId,
  teamId,
}: DeleteTeamSpaceMembershipProps): Promise<void> {
  try {
    if (!client) {
      client = await createCMAClient();
    }

    const organization = await client.getOrganization(organizationId);
    const team = await organization.getTeam(teamId);
    const space = await client.getSpace(spaceId);

    // Get team space memberships for this specific space
    const teamSpaceMemberships = await space.getTeamSpaceMemberships();

    const team_membership = teamSpaceMemberships.items.find(
      (membership) => membership.sys.team.sys.id === teamId
    );

    if (team_membership) {
      console.log(
        'deleting team space membership: ',
        team.name +
          ' (' +
          team.sys.id +
          ')' +
          ' in space: ' +
          space.name +
          ' (' +
          space.sys.id +
          ')'
      );
      await team_membership.delete();
      console.log('deleted team space membership successfully');
    } else {
      console.log('No team membership found to delete for team:', teamId);
    }
  } catch (error) {
    console.error('❌ Failed to delete team space membership:', error.message || error);
    throw error;
  }
}
