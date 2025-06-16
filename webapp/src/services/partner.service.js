import axios from 'axios';
import { APP_NAME, API } from '../../env';

export default () => {
    const generateHeader = () => {
        const token = localStorage.getItem(`token-app-${APP_NAME}`);
        const userId = localStorage.getItem(`id-${APP_NAME}`);
        const company_slug = localStorage.getItem('_company-slug');

        return { token, 'user-id': userId, company_slug };
    };

    return {
        all: (page = 0, searchQuery = '') => {
            const headers = generateHeader();
            return axios.get(`${API}partners?page=${page}&search=${searchQuery}`, { headers });
        },
        getById: (id, callback) => {
            const headers = generateHeader();
            axios.get(`${API}partners/${id}`, { headers }).then(({ data }) => callback(data));
        },
        create: (partner) => {
            const headers = generateHeader();
            return axios.post(`${API}partners`, partner, { headers });
        },
        update: (id, partner) => {
            const headers = generateHeader();
            return axios.put(`${API}partners/${id}`, partner, { headers });
        },
        getPagesLength: () => {
            const headers = generateHeader();
            return axios.get(`${API}partners/pages`, { headers });
        },
				delete(id) {
					const headers = generateHeader();
					return axios.delete(`${API}partners/${id}`, { headers });
				}
    };
};
