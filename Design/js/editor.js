// editor.js — Orchestrates all editor panels and canvas interactions

(function () {
    'use strict';

    // ── State & refs ──────────────────────────────────────────────────────────
    let currentView = '2d';
    let selectedFurnitureIndex = -1;

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    // ── Init ──────────────────────────────────────────────────────────────────
    async function init() {
        if (!authGuard()) return;

        // Show loading indicator
        showToast('Loading catalog…', '');

        // Load design from URL param first (async)
        const params = new URLSearchParams(window.location.search);
        const did = params.get('design');
        const isNewDesign = params.get('new') === 'true';

        if (isNewDesign) {
            // User clicked "New Design" - clear any stored design ID
            clearCurrentDesignIdFromStorage();
            clearRoomConfigFromStorage();
            // Load default room config
            loadRoomConfigFromStorage();
        } else if (did) {
            await loadDesignIntoState(did);
            // Save this design ID for when user navigates away and comes back
            saveCurrentDesignIdToStorage(did);
        } else {
            // Check if there's a design ID in localStorage from previous session
            const storedDesignId = loadCurrentDesignIdFromStorage();
            if (storedDesignId) {
                // Try to load the previously edited design
                const loaded = await loadDesignIntoState(storedDesignId);
                if (!loaded) {
                    // If loading failed, fall back to loading room config
                    clearCurrentDesignIdFromStorage();
                    loadRoomConfigFromStorage();
                }
            } else {
                // No saved design — try to restore room config from localStorage
                loadRoomConfigFromStorage();
            }
        }

        // Save the initial state as the "last saved" state for change tracking
        saveLastSavedState();

        renderDesignTitle();
        initRoomPanel();
        await initFurnitureCatalog();   // async — loads from DB
        initTabSwitching();
        initViewToggle();
        initCanvas2D();
        renderPlacedFurnitureList();
        initSaveDesign();
        initNewDesignBtn();
        initSignOut();
        setupCanvasCallbacks();
        setupKeyboardShortcuts();

        window.addEventListener('resize', () => {
            if (currentView === '2d') C2D.resize();
            else C3D.resize();
        });

        // ── Warn before leaving with unsaved changes ───────────────────────────────
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') && link.getAttribute('href') !== 'editor.html') {
                link.addEventListener('click', (e) => {
                    if (hasUnsavedChanges()) {
                        e.preventDefault();
                        const targetUrl = link.getAttribute('href');
                        showUnsavedChangesWarning((saved) => {
                            window.location.href = targetUrl;
                        });
                    }
                });
            }
        });

        // ── Warn before browser back/forward with unsaved changes ──────────────────
        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    }

    // ── Title ─────────────────────────────────────────────────────────────────
    function renderDesignTitle() {
        const el = $('design-title');
        if (el) el.textContent = appState.designName;
    }

    // ── Room Panel ────────────────────────────────────────────────────────────
    function initRoomPanel() {
        loadRoomIntoForm();

        $('update-room-btn').addEventListener('click', () => {
            appState.currentRoom.name = $('room-name').value;
            appState.currentRoom.width = parseFloat($('room-width').value) || 5;
            appState.currentRoom.length = parseFloat($('room-length').value) || 5;
            appState.currentRoom.height = parseFloat($('room-height').value) || 3;
            appState.currentRoom.wallColor = $('room-wall-color').value;
            appState.currentRoom.floorColor = $('room-floor-color').value;

            // Save room config to localStorage for persistence across page refreshes
            saveRoomConfigToStorage();

            if (currentView === '2d') C2D.render();
            else C3D.refresh();
            showToast('Room updated!', 'success');
        });

        $('room-wall-color').addEventListener('input', updateColorPreview.bind(null, 'room-wall-color', 'wall-color-hex'));
        $('room-floor-color').addEventListener('input', updateColorPreview.bind(null, 'room-floor-color', 'floor-color-hex'));

        // Hex input listeners for typing color codes
        $('wall-color-hex').addEventListener('input', syncHexToColor.bind(null, 'wall-color-hex', 'room-wall-color'));
        $('floor-color-hex').addEventListener('input', syncHexToColor.bind(null, 'floor-color-hex', 'room-floor-color'));
        $('wall-color-hex').addEventListener('blur', validateAndSyncHex.bind(null, 'wall-color-hex', 'room-wall-color'));
        $('floor-color-hex').addEventListener('blur', validateAndSyncHex.bind(null, 'floor-color-hex', 'room-floor-color'));
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
        if (el) el.value = $(inputId).value.toUpperCase();
    }

    function syncHexToColor(hexId, colorId) {
        const hexInput = $(hexId);
        const colorInput = $(colorId);
        if (!hexInput || !colorInput) return;

        let hex = hexInput.value.trim();
        // Add # if missing
        if (!hex.startsWith('#')) hex = '#' + hex;
        // Validate hex format
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            colorInput.value = hex.toUpperCase();
        }
    }

    function validateAndSyncHex(hexId, colorId) {
        const hexInput = $(hexId);
        const colorInput = $(colorId);
        if (!hexInput || !colorInput) return;

        let hex = hexInput.value.trim();
        if (!hex.startsWith('#')) hex = '#' + hex;

        // Validate hex format (must be #RRGGBB)
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            colorInput.value = hex.toUpperCase();
            hexInput.value = hex.toUpperCase();
            showToast('Color updated!', 'success');
        } else {
            // Invalid format, reset to current color
            hexInput.value = colorInput.value.toUpperCase();
            showToast('Invalid hex code. Use format: #RRGGBB', 'error');
        }
    }

    // ── Furniture Catalog (async, DB-backed) ──────────────────────────────────
    async function initFurnitureCatalog() {
        const container = $('catalog-container');
        if (!container) return;

        // Show loading skeleton
        container.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);">Loading catalog…</div>';

        let catalog, categories;
        try {
            const result = await loadFurnitureCatalogFromDB();
            catalog = result.catalog;
            categories = result.categories;
        } catch (err) {
            // Hard fallback to static data
            catalog = typeof FURNITURE_CATALOG !== 'undefined' ? FURNITURE_CATALOG : [];
            categories = typeof CATALOG_CATEGORIES !== 'undefined' ? CATALOG_CATEGORIES : [];
        }

        container.innerHTML = '';

        categories.forEach(cat => {
            const items = catalog.filter(i => i.category === cat);
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

    // ── Canvas2D Setup ────────────────────────────────────────────────────────
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
        window._onFurnitureMove = () => { };
        window._onFurnitureEdit = (idx) => setSelectedFurniture(idx);
    }

    // ── View Toggle (2D / 3D) ─────────────────────────────────────────────────
    function initViewToggle() {
        $('btn-view-2d').addEventListener('click', () => switchView('2d'));
        $('btn-view-3d').addEventListener('click', () => switchView('3d'));
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

    // ── Lighting Panel ────────────────────────────────────────────────────────
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

    // ── Tab Switching ─────────────────────────────────────────────────────────
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
    // ── Unsaved Changes Warning Modal ─────────────────────────────────────────────
    function showUnsavedChangesWarning(callback) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.zIndex = '1000';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>⚠️ Unsaved Changes</h2>
                </div>
                <p>You have unsaved changes. Do you want to save them before leaving?</p>
                <div class="modal-footer">
                    <button class="btn btn-ghost" id="warn-discard-btn">Don't Save</button>
                    <button class="btn btn-primary" id="warn-save-btn">Save Now</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.classList.add('open');

        const cleanup = () => {
            modal.remove();
        };

        modal.querySelector('#warn-discard-btn').addEventListener('click', () => {
            cleanup();
            clearCurrentDesignIdFromStorage();
            callback(false);
        });

        modal.querySelector('#warn-save-btn').addEventListener('click', async () => {
            const name = $('design-name-input').value.trim() || appState.designName;
            if (!name || name === 'New Design') {
                showToast('⚠️ Please enter a design name before saving', 'error');
                return;
            }
            try {
                await saveDesign(name);
                clearRoomConfigFromStorage();
                saveLastSavedState();
                cleanup();
                callback(true);
            } catch (err) {
                showToast('Save failed — check your connection.', 'error');
            }
        });
    }
    // ── Placed Furniture List ─────────────────────────────────────────────────
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
            <div class="control-value" style="display:flex;gap:8px;align-items:center;">
              <input type="color" value="${item.color}" onchange="updateItemColor('${item.id}', this.value)" oninput="updateItemColor('${item.id}', this.value)">
              <input type="text" class="color-hex-input" id="hex-${item.id}" value="${item.color.toUpperCase()}" placeholder="#FFFFFF" maxlength="7" style="flex:0.6;font-family:monospace;">
            </div>
          </div>
          <div class="form-row-2">
            <div class="control-row">
              <span class="control-label">Rotation (°)</span>
              <div class="control-value" style="display:flex;gap:6px;align-items:center;">
                <button class="icon-btn" title="Rotate 90° (R+1)" onclick="rotateItemBy('${item.id}', 90)" style="padding:4px 8px;font-size:0.85rem;">↻</button>
                <input type="number" value="${item.rotation}" min="0" max="360" step="15" onchange="updateItemRotation('${item.id}', this.value)" style="width:60px;">
                <button class="icon-btn" title="Rotate -90° (R+3)" onclick="rotateItemBy('${item.id}', -90)" style="padding:4px 8px;font-size:0.85rem;">↺</button>
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

            // Add hex input event listeners
            const hexInput = el.querySelector(`#hex-${item.id}`);
            if (hexInput) {
                hexInput.addEventListener('input', () => syncFurnitureHexToColor(item.id));
                hexInput.addEventListener('blur', () => validateAndSyncFurnitureHex(item.id));
            }
        });
    }

    function selectPlacedItem(idx) {
        setSelectedFurniture(idx);
        if (currentView === '2d') C2D.setSelected(idx);
    }

    function setSelectedFurniture(idx) {
        selectedFurnitureIndex = idx;
        renderPlacedFurnitureList();
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
        const hexInput = document.querySelector(`#hex-${id}`);
        if (swatch) swatch.style.background = color;
        if (hexInput) hexInput.value = color.toUpperCase();
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

    window.rotateItemBy = function (id, degrees) {
        const item = appState.placedFurniture.find(f => f.id === id);
        if (!item) return;
        const newRotation = (item.rotation + degrees) % 360;
        updateFurnitureInState(id, { rotation: newRotation >= 0 ? newRotation : newRotation + 360 });
        if (currentView === '2d') C2D.render();
        else C3D.updateFurnitureMesh(appState.placedFurniture.find(f => f.id === id));
        renderPlacedFurnitureList();
    };

    function syncFurnitureHexToColor(id) {
        const hexInput = document.querySelector(`#hex-${id}`);
        const colorInput = document.querySelector(`#placed-item-${id} input[type="color"]`);
        if (!hexInput || !colorInput) return;

        let hex = hexInput.value.trim();
        // Add # if missing
        if (!hex.startsWith('#')) hex = '#' + hex;
        // Validate hex format
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            colorInput.value = hex.toUpperCase();
            window.updateItemColor(id, hex.toUpperCase());
        }
    }

    function validateAndSyncFurnitureHex(id) {
        const hexInput = document.querySelector(`#hex-${id}`);
        const colorInput = document.querySelector(`#placed-item-${id} input[type="color"]`);
        if (!hexInput || !colorInput) return;

        let hex = hexInput.value.trim();
        if (!hex.startsWith('#')) hex = '#' + hex;

        // Validate hex format (must be #RRGGBB)
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            colorInput.value = hex.toUpperCase();
            window.updateItemColor(id, hex.toUpperCase());
            hexInput.value = hex.toUpperCase();
            showToast('Color updated!', 'success');
        } else {
            // Invalid format, reset to current color
            const item = appState.placedFurniture.find(f => f.id === id);
            if (item) {
                hexInput.value = item.color.toUpperCase();
                showToast('Invalid hex code. Use format: #RRGGBB', 'error');
            }
        }
    }

    // ── Save Design (async, DB-backed) ────────────────────────────────────────
    function initSaveDesign() {
        $('save-design-btn').addEventListener('click', async () => {
            const btn = $('save-design-btn');
            const nameInput = $('design-name-input');
            let name = nameInput.value.trim();

            // If user didn't type a new name, use the current design name (for existing designs)
            if (!name) {
                name = appState.designName;
            }

            // Only require a new name if this is a brand new design (name is still "New Design")
            if (name === 'New Design' || !name) {
                showToast('❌ Design name is required! Please enter a name for new designs.', 'error');
                nameInput.focus();
                nameInput.style.borderColor = '#ff6b6b';
                setTimeout(() => nameInput.style.borderColor = '', 2000);
                return;
            }

            btn.disabled = true;
            btn.textContent = '💾 Saving…';

            try {
                await saveDesign(name);

                // Clear temporary room config from localStorage since design is now saved to DB
                clearRoomConfigFromStorage();

                // Save the new "last saved" state after successful save
                saveLastSavedState();

                $('design-name-input').value = '';
                renderDesignTitle();
                showToast('✅ Design saved successfully!', 'success');
            } catch (err) {
                showToast('❌ Save failed — check your connection.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '💾 Save Current Design';
            }
        });
    }

    // ── Sign Out ──────────────────────────────────────────────────────────────
    function initSignOut() {
        const btn = $('signout-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                // Check for unsaved changes before signing out
                if (hasUnsavedChanges()) {
                    showUnsavedChangesWarning((saved) => {
                        clearCurrentDesignIdFromStorage();
                        authLogout();
                    });
                } else {
                    clearCurrentDesignIdFromStorage();
                    authLogout();
                }
            });
        }
    }

    // ── New Design Button ──────────────────────────────────────────────────────
    function initNewDesignBtn() {
        const btn = $('new-design-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                // Check for unsaved changes before starting a new design
                if (hasUnsavedChanges()) {
                    showUnsavedChangesWarning((saved) => {
                        // Navigate to new design page
                        window.location.href = 'editor.html?new=true';
                    });
                } else {
                    // No unsaved changes, go directly to new design
                    window.location.href = 'editor.html?new=true';
                }
            });
        }
    }

    // ── Keyboard Shortcuts ────────────────────────────────────────────────────
    function setupKeyboardShortcuts() {
        let rotateKey = false;

        // Help button click handler
        const helpBtn = $('help-btn');
        if (helpBtn) {
            helpBtn.title = 'Press ? key to view keyboard shortcuts';

            helpBtn.addEventListener('click', () => {
                const panel = $('shortcuts-panel');
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                    if (panel.style.display === 'block') {
                        showToast('📖 Keyboard shortcuts displayed! (Press ? or Shift+/ to toggle)', '');
                        hideShortcutsIndicator();
                    }
                }
            });
        }

        // Create a prominent indicator for keyboard shortcuts at bottom-right
        const indicator = document.createElement('div');
        indicator.id = 'shortcuts-indicator';
        indicator.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:10px 14px;background:linear-gradient(135deg, #ff6b6b, #ee5a6f);color:#fff;border-radius:8px;font-size:0.85rem;font-weight:500;cursor:pointer;z-index:500;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(255,107,107,0.4);display:flex;align-items:center;gap:6px;';
        indicator.innerHTML = '❓ Press <kbd style="background:rgba(0,0,0,0.2);padding:2px 6px;border-radius:3px;font-size:0.8rem;font-family:monospace;margin:0 2px;">?</kbd> for shortcuts';
        indicator.addEventListener('mouseover', () => {
            indicator.style.background = 'linear-gradient(135deg, #ff6b6b, #ff5252)';
            indicator.style.transform = 'scale(1.05)';
            indicator.style.boxShadow = '0 6px 16px rgba(255,107,107,0.5)';
        });
        indicator.addEventListener('mouseout', () => {
            indicator.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a6f)';
            indicator.style.transform = 'scale(1)';
            indicator.style.boxShadow = '0 4px 12px rgba(255,107,107,0.4)';
        });
        indicator.addEventListener('click', () => {
            const panel = $('shortcuts-panel');
            if (panel) {
                panel.style.display = 'block';
                hideShortcutsIndicator();
                showToast('📖 Keyboard shortcuts opened!', '');
            }
        });

        // Close indicator when user presses ?
        const hideShortcutsIndicator = () => {
            indicator.style.display = 'none';
        };

        const showShortcutsIndicator = () => {
            indicator.style.display = 'flex';
        };

        document.body.appendChild(indicator);

        window.addEventListener('keydown', (e) => {
            // ? key to show help (Shift+/)
            if (e.key === '?' || (e.shiftKey && e.key === '/')) {
                const panel = $('shortcuts-panel');
                if (panel) {
                    const isHidden = panel.style.display === 'none' || !panel.style.display;
                    panel.style.display = isHidden ? 'block' : 'none';
                    if (isHidden) {
                        hideShortcutsIndicator();
                    }
                }
                e.preventDefault();
            }

            // Ctrl+S for save (check this first, before rotation mode)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                $('save-design-btn').click();
                e.preventDefault();
                return;
            }

            // R key for rotation mode
            if (e.key.toLowerCase() === 'r' && selectedFurnitureIndex >= 0) {
                rotateKey = true;
                showToast('Press 1-4 for rotation (1=90°, 2=180°, 3=-90°, 4=0°)', '');
                e.preventDefault();
                return;
            }

            // Number keys while in rotation mode
            if (rotateKey && selectedFurnitureIndex >= 0) {
                const item = appState.placedFurniture[selectedFurnitureIndex];
                if (!item) {
                    rotateKey = false;
                    return;
                }

                const key = e.key;
                if (key === '1') {
                    rotateItemBy(item.id, 90);
                    e.preventDefault();
                } else if (key === '2') {
                    rotateItemBy(item.id, 180);
                    e.preventDefault();
                } else if (key === '3') {
                    rotateItemBy(item.id, -90);
                    e.preventDefault();
                } else if (key === '4') {
                    updateFurnitureInState(item.id, { rotation: 0 });
                    renderPlacedFurnitureList();
                    if (currentView === '2d') C2D.render();
                    else C3D.updateFurnitureMesh(item);
                    e.preventDefault();
                } else if (key === 'Escape') {
                    // Exit rotation mode with Escape
                    rotateKey = false;
                    showToast('Rotation mode cancelled', '');
                    e.preventDefault();
                } else if (key !== 'Shift' && key !== 'Control' && key !== 'Alt' && key !== 'Meta') {
                    // Reset rotation mode if other key pressed
                    rotateKey = false;
                }
                return;
            }

            // Delete key to remove selected
            if (e.key === 'Delete' && selectedFurnitureIndex >= 0) {
                const item = appState.placedFurniture[selectedFurnitureIndex];
                if (item) window.deletePlacedItem(item.id);
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'r') rotateKey = false;
        });
    }

    // ── Toast ─────────────────────────────────────────────────────────────────
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

    // ── Startup ───────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', init);
})();
