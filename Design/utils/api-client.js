/**
 * api-client.js — Frontend communication with PHP backend
 * All persistence goes through these methods (no direct localStorage in new code).
 */

const ApiClient = {

    // ── Core HTTP helpers ─────────────────────────────────────────────────────

    async request(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} at ${url}`);
            }
            return response.json();
        } catch (err) {
            console.error('[ApiClient]', err);
            throw err;
        }
    },

    async post(url, data) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(data)) {
            params.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
        return this.request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });
    },

    // ── Authentication ────────────────────────────────────────────────────────

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

    // ── Furniture Catalog ─────────────────────────────────────────────────────

    /** Returns all active furniture items from the DB */
    async loadFurnitureCatalog() {
        return this.request('api/furniture.php?action=list');
    },

    /** Returns ordered list of category names from the DB */
    async loadFurnitureCategories() {
        return this.request('api/furniture.php?action=categories');
    },

    // ── Designs ───────────────────────────────────────────────────────────────

    async saveDesign(id, name, room, furniture) {
        return this.post('api/designs.php?action=save', {
            id,
            name,
            room_data: JSON.stringify(room),
            furniture_data: JSON.stringify(furniture)
        });
    },

    async loadDesigns() {
        return this.request('api/designs.php?action=load');
    },

    async loadDesign(id) {
        return this.request(`api/designs.php?action=get&id=${encodeURIComponent(id)}`);
    },

    async deleteDesign(id) {
        return this.post('api/designs.php?action=delete', { id });
    },


    // ── Legacy aliases (backwards compatibility) ──────────────────────────────
    async saveDesignToServer(id, name, room, furniture) {
        return this.saveDesign(id, name, room, furniture);
    },
    async loadDesignsFromServer() {
        return this.loadDesigns();
    },
    async deleteDesignFromServer(id) {
        return this.deleteDesign(id);
    }
};

window.ApiClient = ApiClient;
