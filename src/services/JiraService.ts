import axios from 'axios';
import { JiraTicket, ApiResponse } from '../types';

const JIRA_API_BASE_URL = process.env.REACT_APP_JIRA_API_URL;
const JIRA_API_TOKEN = process.env.REACT_APP_JIRA_API_TOKEN;

const jiraAxios = axios.create({
  baseURL: JIRA_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${JIRA_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

export const getTicketDetails = async (ticketNumber: string): Promise<ApiResponse<JiraTicket>> => {
  try {
    const response = await jiraAxios.get(`/rest/api/2/issue/${ticketNumber}`);
    const data = response.data;

    // Transform Jira API response to our JiraTicket type
    const ticket: JiraTicket = {
      key: data.key,
      summary: data.fields.summary,
      description: data.fields.description,
      acceptanceCriteria: data.fields.customfield_10000 || '', // Adjust field ID based on your Jira instance
      linkedEpics: data.fields.issuelinks
        .filter((link: any) => link.outwardIssue?.fields?.issuetype?.name === 'Epic')
        .map((link: any) => ({
          key: link.outwardIssue.key,
          summary: link.outwardIssue.fields.summary,
        })),
    };

    return {
      success: true,
      data: ticket,
    };
  } catch (error) {
    console.error('Error fetching Jira ticket:', error);
    return {
      success: false,
      error: 'Failed to fetch Jira ticket details',
    };
  }
};
