import { TeamInstallation } from '../../src/types';

export const mockInstallations: TeamInstallation[] = [
  {
    conversationReferenceKey: '333_444@thread.tacv2',
    teamDetails: {
      id: 'ed57f808-c14f-4a53-bf53-e36de0783385',
      name: 'Marketing Team',
    },
    channelInfos: [
      {
        id: '19:e3a386bd1e0f4e00a286b4e86b0cfbe9@thread.tacv2',
        name: 'General',
      },
      {
        id: '19:e2a385bd1e0f4e00a286b4e86b0cfbe9@thread.tacv2',
        name: 'Branding',
      },
      {
        id: '19:39ca79ab85df4520af8a459bd1abaea1@thread.tacv2',
        name: 'Corporate Marketing',
      },
    ],
  },
  {
    conversationReferenceKey: '111_222@thread.tacv2',
    teamDetails: {
      id: '1a91e6ef-ac80-4b9b-9989-d3416c38671c',
      name: 'Sales Team',
    },
    channelInfos: [
      {
        id: '19:3bccfda604454e63bd839399e6752ba3@thread.tacv2',
        name: 'General',
      },
    ],
  },
];
