import axios from 'axios';
import { JiraTicket, ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const getTicketDetails = async (ticketNumber: string): Promise<ApiResponse<JiraTicket>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/jira/ticket/${ticketNumber.trim()}`);
    const data = response.data;

    // Enhanced ticket with more fields if needed
    const ticket: JiraTicket = {
      key: data.key,
      summary: data.fields.summary,
      description: data.fields.description || '',
      // Add any other fields you need from the Jira response
    };

    return {
      success: true,
      data: ticket,
    };
  } catch (error: any) {
    console.error('Error fetching Jira ticket:', {
      message: error.message,
      response: error.response?.data
    });
    
    return {
      success: false,
      error: error.response?.data?.details || error.message || 'Failed to fetch Jira ticket details',
    };
  }
};
