import axios from 'axios';
import { API } from '../../env';

export default function CandidateService() {
    const baseUrl = `${API}candidates`;
    
    return {
        all: async (page = 0, search = '') => {
            try {
                const url = `${baseUrl}?page=${page}${search ? `&search=${search}` : ''}`;
                return await axios.get(url);
            } catch (error) {
                console.error('Error fetching candidates:', error);
                return { data: { error: error.message } };
            }
        },
        
        getById: async (id, callback) => {
            try {
                const { data } = await axios.get(`${baseUrl}/${id}`);
                callback(data);
            } catch (error) {
                console.error('Error fetching candidate by ID:', error);
            }
        },
        
        upsert: async (candidate, callback) => {
            try {
                const method = candidate.id ? 'put' : 'post';
                const url = candidate.id ? `${baseUrl}/${candidate.id}` : baseUrl;
                const { data } = await axios[method](url, candidate);
                callback(data);
            } catch (error) {
                console.error('Error saving candidate:', error);
            }
        },
        
        delete: async (id, callback) => {
            try {
                const { data } = await axios.delete(`${baseUrl}/${id}`);
                callback(data);
            } catch (error) {
                console.error('Error deleting candidate:', error);
            }
        },
        
        getPagesLength: async () => {
            try {
                return await axios.get(`${baseUrl}/pages`);
            } catch (error) {
                console.error('Error fetching pages length:', error);
                return { data: { error: error.message } };
            }
        }
    };
}