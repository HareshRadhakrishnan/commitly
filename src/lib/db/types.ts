export type User = {
  id: string;
  auth_id: string;
  email: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  github_repo_id: number;
  repo_name: string;
  created_at: string;
};

export type BrandExample = {
  id: string;
  user_id: string;
  content: string;
  platform: "linkedin" | "twitter" | "changelog";
  created_at: string;
};

export type ReleaseDraft = {
  id: string;
  project_id: string;
  ai_content: {
    changelog?: string;
    linkedin?: string;
    twitter?: string;
  };
  status: "pending" | "approved" | "published";
  commit_shas?: string[] | null;
  created_at: string;
};
