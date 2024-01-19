import {
  ProfileFields,
  ProfileType,
} from "@components/config/appInstallationParameters";

const generateBrandProfile = (profile: ProfileType) => {
  const { PROFILE, ADDITIONAL, VALUES, TONE, AUDIENCE, EXCLUDE, INCLUDE } =
    ProfileFields;

  const profilePromptParts = [];

  if (profile[PROFILE]) {
    profilePromptParts.push(
      `You are working for a company with the following profile: ${profile[PROFILE]}. `,
    );
  }

  if (profile[ADDITIONAL]) {
    profilePromptParts.push(
      `It is important that you also know the following details about the company: ${profile[ADDITIONAL]}. `,
    );
  }

  if (profile[VALUES]) {
    profilePromptParts.push(
      `Your company's brand has the following values and attributes: ${profile[VALUES]}. `,
    );
  }

  if (profile[TONE]) {
    profilePromptParts.push(
      `Your company's voice can be described as ${profile[TONE]}. `,
    );
  }

  if (profile[AUDIENCE]) {
    profilePromptParts.push(
      `Your company's target audience is: ${profile[AUDIENCE]}. `,
    );
  }

  if (profile[EXCLUDE]) {
    profilePromptParts.push(
      `Your company's brand states that you should never use the following words: ${profile[EXCLUDE]} . `,
    );
  }

  if (profile[INCLUDE]) {
    profilePromptParts.push(
      `Your company's brand commonly uses these words: ${profile[INCLUDE]} . `,
    );
  }
  const profilePrompt = profilePromptParts.join(" ");

  return profilePrompt;
};

const baseSystemPrompt = (profile: ProfileType, locale: string): string =>
  `You're a professional content editor. ${generateBrandProfile(profile)}

Your response should not include any harmful, unethical, racist, sexist, toxic, dangerous, or illegal content. 

Your response should only be in the following language: ${locale}.

If you don't have enough context to respond, be creative and don't say that you cannot answer.

Output your answer without an introduction or summary.`;

export default baseSystemPrompt;
