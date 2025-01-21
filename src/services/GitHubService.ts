import { Octokit } from '@octokit/rest';
import { GitHubPR, ApiResponse } from '../types';

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const REPO_OWNER = process.env.REACT_APP_GITHUB_OWNER;
const REPO_NAME = process.env.REACT_APP_GITHUB_REPO;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

export const getPullRequestDetails = async (
  prNumber: number,
  owner: string,
  repo: string
): Promise<ApiResponse<GitHubPR>> => {
  console.log('GitHub API Config:', {
    hasToken: !!GITHUB_TOKEN,
    owner,
    repo,
    prNumber
  });

  try {
    // Fetch PR details
    const { data: prData } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Fetch PR files
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    const pullRequest: GitHubPR = {
      number: prData.number,
      title: prData.title,
      description: prData.body || '',
      repo: { owner, name: repo },
      changedFiles: files.map(file => ({
        filename: file.filename,
        status: file.status as 'added' | 'modified' | 'removed',
        patch: file.patch,
      })),
    };

    return {
      success: true,
      data: pullRequest,
    };
  } catch (error) {
    console.error('Error fetching GitHub PR:', error);
    return {
      success: false,
      error: 'Failed to fetch GitHub pull request details',
    };
  }
};

export const getFileContent = async (filePath: string, ref: string): Promise<ApiResponse<string>> => {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER!,
      repo: REPO_NAME!,
      path: filePath,
      ref,
    });

    if ('content' in data) {
      const content = Buffer.from(data.content, 'base64').toString();
      return {
        success: true,
        data: content,
      };
    }

    throw new Error('Not a file');
  } catch (error) {
    console.error('Error fetching file content:', error);
    return {
      success: false,
      error: 'Failed to fetch file content',
    };
  }
};
