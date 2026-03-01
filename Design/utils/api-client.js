/**
 * api-client.js — Frontend communication with PHP logic
 */

const ApiClient = {
    async request(url, options = {}) {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText} at ${url}`);
        }
        return response.json();
    },

    async post(url, data) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(data)) {
            params.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
        return this.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params
        });
    },

    // Authentication
    async login(email, password) {
        return this.post('api/auth.php?action=login', { email, password });
    },

    async register(name, email, password) {
        return this.post('api/auth.php?action=register', { name, email, password });
    },

    async logout() {
        return this.request('api/auth.php?action=logout');
    },

    async checkSession() {
        return this.request('api/auth.php?action=check');
    },

    // Designs
    async saveDesignToServer(id, name, room, furniture) {
        return this.post('api/designs.php?action=save', {
            id,
            name,
            room_data: room,
            furniture_data: furniture
        });
    },

    async loadDesignsFromServer() {
        return this.request('api/designs.php?action=load');
    },

    async deleteDesignFromServer(id) {
        return this.post('api/designs.php?action=delete', {
            id
        });
    }
};

window.ApiClient = ApiClient;
