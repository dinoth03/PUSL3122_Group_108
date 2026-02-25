// editor.js — Orchestrates all editor panels and canvas interactions

(function () {
    'use strict';

    // ── State & refs ──────────────────────────────────────────
    let currentView = '2d'; // '2d' | '3d'
    let selectedFurnitureIndex = -1;

    // ── DOM refs ──────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    // ── Init ─────────────────────────────────────────────────
    function init() {
        if (!authGuard()) return;

        // Load design from URL param if present
        const params = new URLSearchParams(window.location.search);
        const did = params.get('design');
        if (did) loadDesignIntoState(did);

        renderDesignTitle();
        initRoomPanel();
        initFurnitureCatalog();
        initTabSwitching();
        initViewToggle();
        initCanvas2D();
        renderPlacedFurnitureList();
        initSaveDesign();
        initSignOut();
        setupCanvasCallbacks();

        // Window resize
        window.addEventListener('resize', () => {
            if (currentView === '2d') C2D.resize();
            else C3D.resize();
        });
    }

    // ── Title ─────────────────────────────────────────────────
    function renderDesignTitle() {
        const el = $('design-title');
        if (el) el.textContent = appState.designName;
    }

    // ── Room Panel ───────────────────────────────────────────
    function initRoomPanel() {
        const fields = ['room-name', 'room-width', 'room-length', 'room-height', 'room-wall-color', 'room-floor-color'];
        loadRoomIntoForm();

        $('update-room-btn').addEventListener('click', () => {
            const prev = JSON.stringify(appState.currentRoom);
            appState.currentRoom.name = $('room-name').value;
            appState.currentRoom.width = parseFloat($('room-width').value) || 5;
            appState.currentRoom.length = parseFloat($('room-length').value) || 5;
            appState.currentRoom.height = parseFloat($('room-height').value) || 3;
            appState.currentRoom.wallColor = $('room-wall-color').value;
            appState.currentRoom.floorColor = $('room-floor-color').value;
            if (currentView === '2d') C2D.render();
            else C3D.refresh();
            showToast('Room updated!', 'success');
        });

        // Live preview for color changes
        $('room-wall-color').addEventListener('input', updateColorPreview.bind(null, 'room-wall-color', 'wall-color-hex'));
        $('room-floor-color').addEventListener('input', updateColorPreview.bind(null, 'room-floor-color', 'floor-color-hex'));
    }

    function loadRoomIntoForm() {
        const r = appState.currentRoom;
        $('room-name').value = r.name;
        $('room-width').value = r.width;
        $('room-length').value = r.length;
        $('room-height').value = r.height;
        $('room-wall-color').value = r.wallColor;
        $('room-floor-color').value = r.floorColor;
        updateColorPreview('room-wall-color', 'wall-color-hex');
        updateColorPreview('room-floor-color', 'floor-color-hex');
    }

    function updateColorPreview(inputId, hexId) {
        const el = $(hexId);
        if (el) el.textContent = $(inputId).value.toUpperCase();
    }

    // ── Furniture Catalog ────────────────────────────────────
    function initFurnitureCatalog() {
        const container = $('catalog-container');
        if (!container) return;

        CATALOG_CATEGORIES.forEach(cat => {
            const items = FURNITURE_CATALOG.filter(i => i.category === cat);
            if (!items.length) return;

            const section = document.createElement('div');
            section.className = 'catalog-section';
            section.innerHTML = `<h3>${cat}</h3><div class="catalog-grid"></div>`;
            const grid = section.querySelector('.catalog-grid');

            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'catalog-item';
                div.title = `Add ${item.name}`;
                div.innerHTML = `<div class="catalog-item-icon">${item.icon}</div><div class="catalog-item-name">${item.name}</div>`;
                div.addEventListener('click', () => addFurniture(item));
                grid.appendChild(div);
            });
            container.appendChild(section);
        });
    }

    function addFurniture(catalogItem) {
        const item = addFurnitureToState(catalogItem);
        if (currentView === '2d') {
            C2D.render();
            C2D.setSelected(appState.placedFurniture.length - 1);
        } else {
            C3D.addFurnitureMesh(item);
        }
        renderPlacedFurnitureList();
        setSelectedFurniture(appState.placedFurniture.length - 1);
        showToast(`${item.name} added!`, 'success');
    }

    // ── Canvas2D Setup ────────────────────────────────────────
    function initCanvas2D() {
        const canvas = $('canvas2d');
        const container = $('canvas2d-container');
        if (!canvas || !container) return;
        C2D.init(canvas, container);
    }

    function setupCanvasCallbacks() {
        window._onSelectionChange = (idx) => {
            selectedFurnitureIndex = idx;
            highlightPlacedItem(idx);
        };
        window._onFurnitureMove = (idx) => {
            // Could update coords in right panel if needed
        };
        window._onFurnitureEdit = (idx) => {
            setSelectedFurniture(idx);
        };
    }

    // ── View Toggle (2D / 3D) ─────────────────────────────────
    function initViewToggle() {
        $('btn-view-2d').addEventListener('click', () => switchView('2d'));
        $('btn-view-3d').addEventListener('click', () => switchView('3d'));
        // Also icon buttons inside canvas header
        const ic2 = $('icon-btn-2d'), ic3 = $('icon-btn-3d');
        if (ic2) ic2.addEventListener('click', () => switchView('2d'));
        if (ic3) ic3.addEventListener('click', () => switchView('3d'));
    }

    function switchView(view) {
        currentView = view;
        const c2 = $('canvas2d-container');
        const c3 = $('canvas3d-container');

        if (view === '2d') {
            c2.style.display = 'block';
            c3.style.display = 'none';
            $('btn-view-2d').classList.add('active');
            $('btn-view-3d').classList.remove('active');
            if ($('icon-btn-2d')) { $('icon-btn-2d').classList.add('active'); $('icon-btn-3d').classList.remove('active'); }
            C2D.render();
        } else {
            c2.style.display = 'none';
            c3.style.display = 'block';
            $('btn-view-2d').classList.remove('active');
            $('btn-view-3d').classList.add('active');
            if ($('icon-btn-2d')) { $('icon-btn-2d').classList.remove('active'); $('icon-btn-3d').classList.add('active'); }
            C3D.init($('canvas3d-container'));
            initLightingPanel();
        }
    }

    // ── Lighting Panel ────────────────────────────────────────
    function initLightingPanel() {
        const btn = $('lighting-btn');
        const panel = $('lighting-panel');
        if (!btn || !panel) return;

        btn.addEventListener('click', () => panel.classList.toggle('open'));

        $('ambient-slider').addEventListener('input', e => C3D.setAmbientIntensity(parseFloat(e.target.value)));
        $('dir-slider').addEventListener('input', e => C3D.setDirIntensity(parseFloat(e.target.value)));
        $('shadow-toggle').addEventListener('change', e => C3D.setShadowsEnabled(e.target.checked));
        $('light-color').addEventListener('input', e => C3D.setLightColor(e.target.value));
    }

    // ── Tab Switching ─────────────────────────────────────────
    function initTabSwitching() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                $(`tab-${tab}`).classList.add('active');
            });
        });
    }

    // ── Placed Furniture List ─────────────────────────────────
    function renderPlacedFurnitureList() {
        const list = $('placed-list');
        if (!list) return;
        list.innerHTML = '';

        if (appState.placedFurniture.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛋️</div><p>No furniture placed yet.<br>Click items in the Furniture tab.</p></div>`;
            return;
        }

        appState.placedFurniture.forEach((item, idx) => {
            const el = document.createElement('div');
            el.className = 'placed-item' + (idx === selectedFurnitureIndex ? ' selected' : '');
            el.id = `placed-item-${item.id}`;
            el.innerHTML = `
        <div class="placed-item-header">
          <div class="placed-item-swatch" style="background:${item.color}"></div>
          <div class="placed-item-info">
            <div class="placed-item-name">${item.name}</div>
            <div class="placed-item-cat">${item.category}</div>
          </div>
          <div class="placed-item-actions">
            <button class="icon-btn" title="Edit" onclick="selectPlacedItem(${idx})">✏️</button>
            <button class="icon-btn danger" title="Delete" onclick="deletePlacedItem('${item.id}')">🗑️</button>
          </div>
        </div>
        <div class="placed-item-controls" id="controls-${item.id}" style="display:${idx === selectedFurnitureIndex ? 'flex' : 'none'}">
          <div class="control-row">
            <span class="control-label">Color</span>
            <div class="control-value">
              <input type="color" value="${item.color}" onchange="updateItemColor('${item.id}', this.value)" oninput="updateItemColor('${item.id}', this.value)">
              <span class="color-hex">${item.color.toUpperCase()}</span>
            </div>
          </div>
          <div class="form-row-2">
            <div class="control-row">
              <span class="control-label">Rotation (°)</span>
              <div class="control-value">
                <input type="number" value="${item.rotation}" min="0" max="360" step="15" onchange="updateItemRotation('${item.id}', this.value)">
              </div>
            </div>
            <div class="control-row">
              <span class="control-label">Scale</span>
              <div class="control-value">
                <input type="number" value="${item.scale}" min="0.1" max="5" step="0.1" onchange="updateItemScale('${item.id}', this.value)">
              </div>
            </div>
          </div>
        </div>
      `;
            el.querySelector('.placed-item-header').addEventListener('click', () => selectPlacedItem(idx));
            list.appendChild(el);
        });
    }

    function selectPlacedItem(idx) {
        setSelectedFurniture(idx);
        if (currentView === '2d') C2D.setSelected(idx);
    }

    function setSelectedFurniture(idx) {
        selectedFurnitureIndex = idx;
        renderPlacedFurnitureList();
        // Switch to Items tab
        const itemsTab = document.querySelector('[data-tab="items"]');
        if (itemsTab) itemsTab.click();
    }

    function highlightPlacedItem(idx) {
        document.querySelectorAll('.placed-item').forEach(el => el.classList.remove('selected'));
        const item = appState.placedFurniture[idx];
        if (!item) return;
        const el = $(`placed-item-${item.id}`);
        if (el) {
            el.classList.add('selected');
            document.getElementById(`controls-${item.id}`).style.display = 'flex';
        }
    }

    window.selectPlacedItem = selectPlacedItem;

    window.deletePlacedItem = function (id) {
        const name = appState.placedFurniture.find(f => f.id === id)?.name;
        removeFurnitureFromState(id);
        if (currentView === '2d') { C2D.deselectAll(); C2D.render(); }
        else C3D.removeFurnitureMesh(id);
        selectedFurnitureIndex = -1;
        renderPlacedFurnitureList();
        showToast(`${name || 'Item'} removed`, 'success');
    };

    window.updateItemColor = function (id, color) {
        updateFurnitureInState(id, { color });
        const swatch = document.querySelector(`#placed-item-${id} .placed-item-swatch`);
        const hex = document.querySelector(`#placed-item-${id} .color-hex`);
        if (swatch) swatch.style.background = color;
        if (hex) hex.textContent = color.toUpperCase();
        if (currentView === '2d') C2D.render();
        else { const item = appState.placedFurniture.find(f => f.id === id); if (item) C3D.updateFurnitureMesh(item); }
    };

    window.updateItemRotation = function (id, val) {
        updateFurnitureInState(id, { rotation: parseFloat(val) || 0 });
        if (currentView === '2d') C2D.render();
        else { const item = appState.placedFurniture.find(f => f.id === id); if (item) C3D.updateFurnitureMesh(item); }
    };

    window.updateItemScale = function (id, val) {
        updateFurnitureInState(id, { scale: Math.max(0.1, parseFloat(val) || 1) });
        if (currentView === '2d') C2D.render();
        else { const item = appState.placedFurniture.find(f => f.id === id); if (item) C3D.updateFurnitureMesh(item); }
    };

    // ── Save Design ───────────────────────────────────────────
    function initSaveDesign() {
        $('save-design-btn').addEventListener('click', () => {
            const name = $('design-name-input').value.trim() || appState.designName;
            appState.designName = name;
            saveDesign(name);
            $('design-name-input').value = '';
            renderDesignTitle();
            showToast('Design saved!', 'success');
        });
    }

    // ── Sign Out ──────────────────────────────────────────────
    function initSignOut() {
        const btn = $('signout-btn');
        if (btn) btn.addEventListener('click', authLogout);
    }

    // ── Toast ─────────────────────────────────────────────────
    window.showToast = function (msg, type = '') {
        const container = $('toast-container') || (() => {
            const el = document.createElement('div');
            el.id = 'toast-container';
            el.className = 'toast-container';
            document.body.appendChild(el);
            return el;
        })();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️' };
        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut .25s ease forwards';
            setTimeout(() => toast.remove(), 260);
        }, 2800);
    };

    // ── Startup ───────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);
})();
