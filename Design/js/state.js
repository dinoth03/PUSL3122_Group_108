// state.js — Application state + DB-backed persistence

// ── Current editor state ──────────────────────────────────────────────────────
let appState = {
    currentDesignId: null,
    designName: 'New Design',
    currentRoom: {
        name: 'New Room',
        width: 5,
        length: 5,
        height: 3,
        wallColor: '#FFFFFF',
        floorColor: '#D2848C',
        windows: [
            { wall: 'back', x: 0.5, y: 1.5, width: 1.2, height: 1.2 },
            { wall: 'left', z: 0.5, y: 1.5, width: 1.2, height: 1.2 }
        ]
    },
    placedFurniture: []   // { id, catalogId, name, category, color, x, y, width, depth, height, rotation, scale }
};

// ── Designs (DB-backed) ───────────────────────────────────────────────────────

/**
 * Load all designs for the current user from the database.
 * Returns a Promise<Array>.
 */
async function loadDesigns() {
    try {
        return await ApiClient.loadDesigns();
    } catch (err) {
        console.error('[state] loadDesigns failed:', err);
        return [];
    }
}

/**
 * Save the current appState design to the database.
 * Returns a Promise<{ success, id }>.
 */
async function saveDesign(name) {
    const id = appState.currentDesignId || ('d_' + Date.now());
    appState.currentDesignId = id;
    appState.designName = name || appState.designName;

    try {
        const result = await ApiClient.saveDesign(
            id,
            appState.designName,
            appState.currentRoom,
            appState.placedFurniture
        );
        return result;
    } catch (err) {
        console.error('[state] saveDesign failed:', err);
        throw err;
    }
}

/**
 * Load a single design from the database into appState.
 * Returns a Promise<boolean>.
 */
async function loadDesignIntoState(id) {
    try {
        const design = await ApiClient.loadDesign(id);
        if (!design || design.error) return false;
        appState.currentDesignId = design.id;
        appState.designName = design.name;
        appState.currentRoom = design.room
            ? JSON.parse(JSON.stringify(design.room))
            : appState.currentRoom;
        appState.placedFurniture = design.furniture
            ? JSON.parse(JSON.stringify(design.furniture))
            : [];
        return true;
    } catch (err) {
        console.error('[state] loadDesignIntoState failed:', err);
        return false;
    }
}

/**
 * Delete a design from the database.
 */
async function deleteDesign(id) {
    try {
        return await ApiClient.deleteDesign(id);
    } catch (err) {
        console.error('[state] deleteDesign failed:', err);
        throw err;
    }
}

// ── Room Config Persistence (localStorage) ─────────────────────────────────────

const ROOM_CONFIG_STORAGE_KEY = 'editor_room_config_temp';

/**
 * Save the current room configuration to localStorage.
 * Call this whenever room settings are updated.
 */
function saveRoomConfigToStorage() {
    try {
        localStorage.setItem(ROOM_CONFIG_STORAGE_KEY, JSON.stringify(appState.currentRoom));
        console.log('[state] Room config saved to localStorage', appState.currentRoom);
    } catch (err) {
        console.warn('[state] Failed to save room config to localStorage:', err);
    }
}

/**
 * Load the room configuration from localStorage (if it exists).
 * Returns true if loaded from storage, false if storage is empty.
 * Only call this if no design ID was passed in URL (i.e., not loading a saved design).
 */
function loadRoomConfigFromStorage() {
    try {
        const stored = localStorage.getItem(ROOM_CONFIG_STORAGE_KEY);
        if (stored) {
            const config = JSON.parse(stored);
            appState.currentRoom = config;
            console.log('[state] Room config restored from localStorage', config);
            return true;
        }
    } catch (err) {
        console.warn('[state] Failed to load room config from localStorage:', err);
    }
    return false;
}

/**
 * Clear the temporary room configuration from localStorage.
 * Call this when a design is saved to the database.
 */
function clearRoomConfigFromStorage() {
    try {
        localStorage.removeItem(ROOM_CONFIG_STORAGE_KEY);
        console.log('[state] Room config cleared from localStorage');
    } catch (err) {
        console.warn('[state] Failed to clear room config from localStorage:', err);
    }
}

// ── Design ID & Change Tracking (localStorage) ──────────────────────────────────

const CURRENT_DESIGN_ID_KEY = 'editor_current_design_id';
const LAST_SAVED_STATE_KEY = 'editor_last_saved_state';

/**
 * Save the current design ID to localStorage so it persists when navigating.
 * Call this when a design is loaded.
 */
function saveCurrentDesignIdToStorage(id) {
    try {
        if (id) {
            localStorage.setItem(CURRENT_DESIGN_ID_KEY, id);
            console.log('[state] Current design ID saved to localStorage:', id);
        }
    } catch (err) {
        console.warn('[state] Failed to save design ID to localStorage:', err);
    }
}

/**
 * Load the current design ID from localStorage (if it exists).
 * Returns the design ID or null if not found.
 */
function loadCurrentDesignIdFromStorage() {
    try {
        const id = localStorage.getItem(CURRENT_DESIGN_ID_KEY);
        if (id) {
            console.log('[state] Loaded design ID from localStorage:', id);
            return id;
        }
    } catch (err) {
        console.warn('[state] Failed to load design ID from localStorage:', err);
    }
    return null;
}

/**
 * Save the last saved state snapshot for change detection.
 * Call this after successfully saving a design.
 */
function saveLastSavedState() {
    try {
        const snapshot = {
            designName: appState.designName,
            room: JSON.stringify(appState.currentRoom),
            furniture: JSON.stringify(appState.placedFurniture)
        };
        localStorage.setItem(LAST_SAVED_STATE_KEY, JSON.stringify(snapshot));
        console.log('[state] Last saved state snapshot saved');
    } catch (err) {
        console.warn('[state] Failed to save last saved state:', err);
    }
}

/**
 * Check if there are unsaved changes.
 * Returns true if current state differs from last saved state.
 */
function hasUnsavedChanges() {
    try {
        const saved = localStorage.getItem(LAST_SAVED_STATE_KEY);
        if (!saved) return false;

        const snapshot = JSON.parse(saved);
        const current = {
            designName: appState.designName,
            room: JSON.stringify(appState.currentRoom),
            furniture: JSON.stringify(appState.placedFurniture)
        };

        return snapshot.designName !== current.designName ||
            snapshot.room !== current.room ||
            snapshot.furniture !== current.furniture;
    } catch (err) {
        console.warn('[state] Error checking unsaved changes:', err);
        return false;
    }
}

/**
 * Clear the design ID from localStorage.
 */
function clearCurrentDesignIdFromStorage() {
    try {
        localStorage.removeItem(CURRENT_DESIGN_ID_KEY);
        console.log('[state] Design ID cleared from localStorage');
    } catch (err) {
        console.warn('[state] Failed to clear design ID from localStorage:', err);
    }
}


// ── Furniture placement helpers ───────────────────────────────────────────────

let furnitureUidCounter = Date.now();

function addFurnitureToState(catalogItem) {
    const uid = 'f_' + (furnitureUidCounter++);
    const item = {
        id: uid,
        catalogId: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category,
        color: catalogItem.defaultColor,
        x: 0.5 + Math.random() * 0.2,
        y: 0.5 + Math.random() * 0.2,
        width: catalogItem.width,
        depth: catalogItem.depth,
        height: catalogItem.height,
        rotation: 0,
        scale: 1.0,
    };
    appState.placedFurniture.push(item);
    return item;
}

function removeFurnitureFromState(id) {
    appState.placedFurniture = appState.placedFurniture.filter(f => f.id !== id);
}

function updateFurnitureInState(id, changes) {
    const idx = appState.placedFurniture.findIndex(f => f.id === id);
    if (idx >= 0) Object.assign(appState.placedFurniture[idx], changes);
}

// ── Furniture Catalog (DB-backed) ─────────────────────────────────────────────

/**
 * Load furniture catalog from the DB.
 * Returns a Promise resolving to { catalog: Array, categories: Array }.
 */
async function loadFurnitureCatalogFromDB() {
    try {
        const [catalog, categories] = await Promise.all([
            ApiClient.loadFurnitureCatalog(),
            ApiClient.loadFurnitureCategories()
        ]);
        return { catalog, categories };
    } catch (err) {
        console.error('[state] loadFurnitureCatalogFromDB failed, using static fallback:', err);
        // Fall back to static FURNITURE_CATALOG if DB is unavailable
        return {
            catalog: typeof FURNITURE_CATALOG !== 'undefined' ? FURNITURE_CATALOG : [],
            categories: typeof CATALOG_CATEGORIES !== 'undefined' ? CATALOG_CATEGORIES : []
        };
    }
}
