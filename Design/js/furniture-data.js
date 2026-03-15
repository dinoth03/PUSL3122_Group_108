// furniture-data.js — Furniture catalog

const FURNITURE_CATALOG = [
    // Sofas
    { id: 'sofa_3seat', name: 'Living Room Sofa', category: 'Sofa', icon: '🛋️', defaultColor: '#6B8E23', width: 2.2, depth: 0.9, height: 0.85 },
    { id: 'sofa_2seat', name: 'Two-Seat Sofa', category: 'Sofa', icon: '🛋️', defaultColor: '#8B6914', width: 1.6, depth: 0.85, height: 0.8 },
    { id: 'ottoman', name: 'Round Ottoman', category: 'Sofa', icon: '🧶', defaultColor: '#B06A3B', width: 0.6, depth: 0.6, height: 0.45 },
    // Beds
    { id: 'bed_queen', name: 'Queen Bed', category: 'Bed', icon: '🛏️', defaultColor: '#8B7355', width: 1.6, depth: 2.1, height: 0.6 },
    { id: 'bed_single', name: 'Single Bed', category: 'Bed', icon: '🛏️', defaultColor: '#A0856C', width: 1.0, depth: 2.0, height: 0.55 },
    // Tables
    { id: 'dining_table', name: 'Dining Table', category: 'Table', icon: '🪵', defaultColor: '#8B4513', width: 1.8, depth: 0.9, height: 0.76 },
    { id: 'side_table', name: 'Side Table', category: 'Table', icon: '🪵', defaultColor: '#C4975A', width: 0.5, depth: 0.5, height: 0.6 },
    { id: 'coffee_table', name: 'Coffee Table', category: 'Table', icon: '🪵', defaultColor: '#6B4226', width: 1.2, depth: 0.6, height: 0.45 },
    { id: 'bar_table', name: 'High Bar Table', category: 'Table', icon: '🪜', defaultColor: '#333333', width: 0.7, depth: 0.7, height: 1.05 },
    // Chairs
    { id: 'dining_chair', name: 'Dining Chair', category: 'Chair', icon: '🪑', defaultColor: '#4A5568', width: 0.5, depth: 0.5, height: 0.9 },
    { id: 'office_chair', name: 'Office Chair', category: 'Chair', icon: '🪑', defaultColor: '#2D3748', width: 0.6, depth: 0.6, height: 1.0 },
    { id: 'armchair', name: 'Deep Armchair', category: 'Chair', icon: '🛋️', defaultColor: '#B06A3B', width: 0.9, depth: 0.85, height: 0.85 },
    { id: 'bench', name: 'Hallway Bench', category: 'Chair', icon: '🪑', defaultColor: '#6B4226', width: 1.2, depth: 0.4, height: 0.45 },
    // Cabinets & Storage
    { id: 'wardrobe', name: 'Wardrobe', category: 'Cabinet', icon: '🗄️', defaultColor: '#7B5C3E', width: 2.0, depth: 0.6, height: 2.0 },
    { id: 'storage_cab', name: 'Storage Cabinet', category: 'Cabinet', icon: '🗄️', defaultColor: '#5B4636', width: 1.0, depth: 0.5, height: 1.8 },
    { id: 'tv_unit', name: 'TV Unit', category: 'Cabinet', icon: '📺', defaultColor: '#3C3C3C', width: 1.8, depth: 0.45, height: 0.55 },
    { id: 'bookshelf', name: 'Bookshelf', category: 'Cabinet', icon: '📚', defaultColor: '#8B7355', width: 1.0, depth: 0.35, height: 2.0 },
    { id: 'credenza', name: 'Modern Credenza', category: 'Cabinet', icon: '🗄️', defaultColor: '#A0856C', width: 1.5, depth: 0.4, height: 0.75 },
    // Others
    { id: 'desk', name: 'Work Desk', category: 'Desk', icon: '🖥️', defaultColor: '#C0A882', width: 1.4, depth: 0.7, height: 0.76 },
    { id: 'plant_large', name: 'Large Floor Plant', category: 'Decor', icon: '🪴', defaultColor: '#2D6A4F', width: 0.4, depth: 0.4, height: 1.2 },
    { id: 'plant_small', name: 'Small Table Plant', category: 'Decor', icon: '🌵', defaultColor: '#40916C', width: 0.2, depth: 0.2, height: 0.3 },
    { id: 'lamp_floor', name: 'Floor Lamp', category: 'Decor', icon: '💡', defaultColor: '#F0D060', width: 0.3, depth: 0.3, height: 1.5 },
    { id: 'rug', name: 'Area Rug', category: 'Decor', icon: '🟫', defaultColor: '#C4956A', width: 2.0, depth: 1.5, height: 0.02 },
    { id: 'vase_floor', name: 'Large Decorative Vase', category: 'Decor', icon: '🏺', defaultColor: '#D4A373', width: 0.3, depth: 0.3, height: 0.8 },
    { id: 'mirror_floor', name: 'Leaner Floor Mirror', category: 'Decor', icon: '🪞', defaultColor: '#E9ECEF', width: 0.8, depth: 0.1, height: 1.8 },
    // Windows & Doors
    { id: 'window_single', name: 'Window', category: 'Window & Door', icon: '🪟', defaultColor: '#AED6F1', width: 1.0, depth: 0.1, height: 1.2 },
    { id: 'door_single', name: 'Single Door', category: 'Window & Door', icon: '🚪', defaultColor: '#A0785A', width: 0.9, depth: 0.1, height: 2.1 },
    { id: 'curtain_panel', name: 'Curtain Panel', category: 'Window & Door', icon: '🎭', defaultColor: '#C9ADE7', width: 1.4, depth: 0.08, height: 2.4 },
    // Bedroom Extras
    { id: 'dresser', name: 'Dresser', category: 'Bedroom', icon: '🗃️', defaultColor: '#C8A97E', width: 1.0, depth: 0.5, height: 1.1 },
    { id: 'nightstand', name: 'Nightstand', category: 'Bedroom', icon: '🛋️', defaultColor: '#B89467', width: 0.5, depth: 0.4, height: 0.6 },
    { id: 'vanity_table', name: 'Vanity Table', category: 'Bedroom', icon: '🪞', defaultColor: '#E8D5B7', width: 1.0, depth: 0.45, height: 0.75 },
    // Lighting (wall & floor only)
    { id: 'wall_sconce', name: 'Wall Sconce', category: 'Lighting', icon: '💡', defaultColor: '#FFD580', width: 0.2, depth: 0.15, height: 0.35 },
    { id: 'wall_panel_light', name: 'Wall Panel Light', category: 'Lighting', icon: '🔦', defaultColor: '#FFF3C4', width: 0.6, depth: 0.08, height: 0.12 },
    { id: 'floor_uplighter', name: 'Floor Uplighter', category: 'Lighting', icon: '🕯️', defaultColor: '#FFE599', width: 0.2, depth: 0.2, height: 0.6 },
];

const CATALOG_CATEGORIES = ['Sofa', 'Chair', 'Bed', 'Table', 'Cabinet', 'Desk', 'Decor', 'Window & Door', 'Bedroom', 'Lighting'];
