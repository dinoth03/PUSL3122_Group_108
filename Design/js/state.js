// state.js — Application state management

const DESIGNS_KEY = 'wala_designs';
const ROOMS_KEY = 'wala_rooms';

// ── Current editor state ──────────────────────────────────
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
    },
    placedFurniture: [],   // { id, catalogId, name, category, color, x, y, width, depth, height, rotation, scale }
};

// ── Designs storage ───────────────────────────────────────
function loadDesigns() {
    try { return JSON.parse(localStorage.getItem(DESIGNS_KEY)) || []; }
    catch { return []; }
}

function saveDesignsToStorage(designs) {
    localStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
}

function saveDesign(name) {
    const designs = loadDesigns();
    const id = appState.currentDesignId || ('d_' + Date.now());
    const existing = designs.findIndex(d => d.id === id);
    const record = {
        id,
        name: name || appState.designName,
        room: JSON.parse(JSON.stringify(appState.currentRoom)),
        furniture: JSON.parse(JSON.stringify(appState.placedFurniture)),
        updatedAt: new Date().toISOString(),
    };
    if (existing >= 0) designs[existing] = record;
    else designs.push(record);
    saveDesignsToStorage(designs);
    appState.currentDesignId = id;
    appState.designName = record.name;
    return id;
}

function deleteDesign(id) {
    const designs = loadDesigns().filter(d => d.id !== id);
    saveDesignsToStorage(designs);
}

function loadDesignIntoState(id) {
    const design = loadDesigns().find(d => d.id === id);
    if (!design) return false;
    appState.currentDesignId = design.id;
    appState.designName = design.name;
    appState.currentRoom = JSON.parse(JSON.stringify(design.room));
    appState.placedFurniture = JSON.parse(JSON.stringify(design.furniture));
    return true;
}

// ── Rooms storage ─────────────────────────────────────────
function loadRooms() {
    try { return JSON.parse(localStorage.getItem(ROOMS_KEY)) || []; }
    catch { return []; }
}

function saveRoom(room) {
    const rooms = loadRooms();
    const id = room.id || ('r_' + Date.now());
    const existing = rooms.findIndex(r => r.id === id);
    const record = { ...room, id, updatedAt: new Date().toISOString() };
    if (existing >= 0) rooms[existing] = record;
    else rooms.push(record);
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
    return id;
}

function deleteRoom(id) {
    const rooms = loadRooms().filter(r => r.id !== id);
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

// ── Furniture placement helpers ───────────────────────────
let furnitureUidCounter = Date.now();

function addFurnitureToState(catalogItem) {
    const uid = 'f_' + (furnitureUidCounter++);
    const item = {
        id: uid,
        catalogId: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category,
        color: catalogItem.defaultColor,
        x: 0.5 + Math.random() * 0.2,   // 0-1 normalised room fraction
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
