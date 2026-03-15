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
        appState.designName      = design.name;
        appState.currentRoom     = design.room
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


// ── Furniture placement helpers ───────────────────────────────────────────────

let furnitureUidCounter = Date.now();

function addFurnitureToState(catalogItem) {
    const uid  = 'f_' + (furnitureUidCounter++);
    const item = {
        id:        uid,
        catalogId: catalogItem.id,
        name:      catalogItem.name,
        category:  catalogItem.category,
        color:     catalogItem.defaultColor,
        x:         0.5 + Math.random() * 0.2,
        y:         0.5 + Math.random() * 0.2,
        width:     catalogItem.width,
        depth:     catalogItem.depth,
        height:    catalogItem.height,
        rotation:  0,
        scale:     1.0,
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
            catalog:    typeof FURNITURE_CATALOG    !== 'undefined' ? FURNITURE_CATALOG    : [],
            categories: typeof CATALOG_CATEGORIES   !== 'undefined' ? CATALOG_CATEGORIES   : []
        };
    }
}
