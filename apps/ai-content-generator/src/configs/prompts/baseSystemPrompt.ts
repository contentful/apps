import { ChatCompletionRequestMessage } from 'openai';
import { ProfileFields } from '@components/config/configText';
import { ProfileType } from '@locations/ConfigScreen';

const generateBrandProfile = (profile: ProfileType) => {
  let profilePrompt = '';

  if (profile[ProfileFields.PROFILE]) {
    profilePrompt += `You are working for a company with the following profile: ${
      profile[ProfileFields.PROFILE]
    }. `;
  }

  if (profile[ProfileFields.ADDITIONAL]) {
    profilePrompt += `It is important that you also know the following details about the company: ${
      profile[ProfileFields.ADDITIONAL]
    }. `;
  }

  if (profile[ProfileFields.VALUES]) {
    profilePrompt += `Your company's brand has the following values and attributes: ${
      profile[ProfileFields.VALUES]
    }. `;
  }

  if (profile[ProfileFields.TONE]) {
    profilePrompt += `Your company's voice can be described as ${profile[ProfileFields.TONE]}. `;
  }

  if (profile[ProfileFields.AUDIENCE]) {
    profilePrompt += `Your company's target audience is: ${profile[ProfileFields.AUDIENCE]}. `;
  }

  if (profile[ProfileFields.EXCLUDE]) {
    profilePrompt += `Your company's brand states that you should never use the following words: ${
      profile[ProfileFields.EXCLUDE]
    } . `;
  }

  if (profile[ProfileFields.INCLUDE]) {
    profilePrompt += `Your company's brand commonly uses these words: ${
      profile[ProfileFields.INCLUDE]
    } . `;
  }
  console.log(profilePrompt);

  return profilePrompt;
};

const baseSystemPrompt = (profile: ProfileType, locale: string): ChatCompletionRequestMessage[] => [
  {
    role: 'system',
    content: `Forget everything from the previous conversation. `,
  },
  {
    role: 'system',
    content: generateBrandProfile(profile),
  },
  {
    role: 'system',
    content: `Your response should only be in the following language: ${locale}.`,
  },
];

export default baseSystemPrompt;
