interface Submission {
  submissionId: number;
  fileUri: string;
  targetLocaleExternalId: string;
  outdated: boolean;
  submitted: string;
  translationRequestId: number;
  status: string;
  title: string;
  wordCount: number;
  progress: number;
  assetType: string;
}

interface SmartlingContentfulEntry {
  id: string;
  assetType: string;
  title: string;
  folderId: string | null;
  updatedAt: string;
  contentfulStatus: string;
  contentType: string;
  assetStatus: string;
  translationSubmissions: Submission[];
}

interface SmartlingJobsResponse {
  code: 'SUCCESS' | 'AUTHENTICATION_ERROR';
  data: SmartlingContentfulEntry;
}

interface SmartlingParameters {
  projectId: string;
}
