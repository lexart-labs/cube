import axios from 'axios';
import { APP_NAME, API } from '../../env';

const CandidateService = () => {
    const generateHeader = () => {
        const token = localStorage.getItem(`token-app-${APP_NAME}`);
      	const userId = localStorage.getItem(`id-${APP_NAME}`);
        return {
            token,
            'user-id': userId,
        };
    };

    return {
        all: async (page = 0, searchQuery = '') => {
            const headers = generateHeader();
            return await axios.get(`${API}candidates?page=${page}&search=${searchQuery}`, { headers });
        },
        getById: async (id, callback) => {
            const headers = generateHeader();
            const { data } = await axios.get(`${API}candidates/${id}`, { headers });
            callback(data);
        },
        upsert: async (candidate, callback) => {
            const headers = generateHeader();
            const method = candidate.id ? 'put' : 'post';
            const url = candidate.id ? `${API}candidates/${candidate.id}` : `${API}candidates`;
            const { data } = await axios[method](url, candidate, { headers });
            callback(data);
        },
        delete: async (id, callback) => {
            const headers = generateHeader();
            const { data } = await axios.delete(`${API}candidates/${id}`, { headers });
            callback(data);
        },
        getPagesLength: async () => {
            const headers = generateHeader();
            return await axios.get(`${API}candidates/pages`, { headers });
        }
    };
};

export default CandidateService;
