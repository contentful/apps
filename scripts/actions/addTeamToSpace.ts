import contentful from 'contentful-management';
import { createCMAClient } from './createCMAClient.ts';

interface AddTeamToSpaceProps {
  client?: any;
  spaceId: string;
  teamId: string;
}

export async function addTeamToSpace({ client, spaceId, teamId }: AddTeamToSpaceProps) {
  try {
    if (!client) {
      client = await createCMAClient();
    }
    const space = await client.getSpace(spaceId);

    // Check if team already has access
    const existingMemberships = await space.getTeamSpaceMemberships();
    const existingMembership = existingMemberships.items.find(
      (membership) => membership.sys.team.sys.id === teamId
    );

    if (existingMembership) {
      console.log('👥 Team already has access to space:', existingMembership.sys.id);
      return existingMembership;
    }

    // Create team space membership with admin privileges
    const teamSpaceMembership = await space.createTeamSpaceMembership(teamId, {
      admin: true,
      roles: [],
    });

    console.log(
      '\n👥 Team',
      ' assigned to space ',
      space.name + ' (' + space.sys.id + ')' + ' successfully:',
      teamSpaceMembership.sys.id
    );
    return teamSpaceMembership;
  } catch (error) {
    console.error('❌ Failed to assign team to space:', error.message);
    throw error;
  }
}
