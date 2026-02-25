// canvas2d.js — 2D Room Editor using HTML5 Canvas

const C2D = (() => {
    let canvas, ctx, container;
    let selectedIndex = -1;
    let dragging = false;
    let dragOffsetX = 0, dragOffsetY = 0;
    const PADDING = 40; // px padding inside canvas

    // ── Init ─────────────────────────────────────────────────
    function init(canvasEl, containerEl) {
        canvas = canvasEl;
        ctx = canvasEl.getContext('2d');
        container = containerEl;
        resize();
        bindEvents();
    }

    function resize() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        render();
    }

    // ── Coordinate helpers ───────────────────────────────────
    function roomToCanvas(fx, fy) {
        const area = getDrawArea();
        return {
            x: area.x + fx * area.w,
            y: area.y + fy * area.h,
        };
    }

    function canvasToRoom(cx, cy) {
        const area = getDrawArea();
        return {
            fx: (cx - area.x) / area.w,
            fy: (cy - area.y) / area.h,
        };
    }

    function getDrawArea() {
        const room = appState.currentRoom;
        const aspect = room.width / room.length;
        const availW = canvas.width - PADDING * 2;
        const availH = canvas.height - PADDING * 2;
        let w = availW, h = availH;
        if (w / h > aspect) w = h * aspect;
        else h = w / aspect;
        return {
            x: (canvas.width - w) / 2,
            y: (canvas.height - h) / 2,
            w, h,
        };
    }

    // Size of furniture in canvas px
    function furniturePx(item) {
        const area = getDrawArea();
        const room = appState.currentRoom;
        const pxPerM = area.w / room.width;
        return {
            w: item.width * item.scale * pxPerM,
            h: item.depth * item.scale * pxPerM,
        };
    }

    // ── Render ───────────────────────────────────────────────
    function render() {
        if (!canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const area = getDrawArea();
        const room = appState.currentRoom;

        // Floor
        ctx.fillStyle = room.floorColor || '#D2848C';
        ctx.fillRect(area.x, area.y, area.w, area.h);

        // Grid
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        const pxPerM = area.w / room.width;
        for (let i = 0; i <= room.width; i++) {
            ctx.beginPath();
            ctx.moveTo(area.x + i * pxPerM, area.y);
            ctx.lineTo(area.x + i * pxPerM, area.y + area.h);
            ctx.stroke();
        }
        const pxPerMY = area.h / room.length;
        for (let j = 0; j <= room.length; j++) {
            ctx.beginPath();
            ctx.moveTo(area.x, area.y + j * pxPerMY);
            ctx.lineTo(area.x + area.w, area.y + j * pxPerMY);
            ctx.stroke();
        }

        // Room border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(area.x, area.y, area.w, area.h);

        // Dimension labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${room.width}m`, area.x + area.w / 2, area.y - 10);
        ctx.save();
        ctx.translate(area.x - 14, area.y + area.h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${room.length}m`, 0, 0);
        ctx.restore();

        // Furniture
        appState.placedFurniture.forEach((item, idx) => {
            drawFurniture(item, idx === selectedIndex);
        });
    }

    function drawFurniture(item, selected) {
        const pos = roomToCanvas(item.x, item.y);
        const size = furniturePx(item);
        const rad = (item.rotation || 0) * Math.PI / 180;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(rad);

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = selected ? 14 : 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Fill
        ctx.fillStyle = item.color || '#888';
        ctx.beginPath();
        ctx.roundRect(-size.w / 2, -size.h / 2, size.w, size.h, 4);
        ctx.fill();

        // Stroke
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = selected ? '#7C3AED' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = selected ? 2.5 : 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = `bold ${Math.max(9, Math.min(12, size.w / 6))}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (size.w > 40 && size.h > 22) {
            ctx.fillText(item.name.substring(0, 12), 0, 0);
        }

        // Selection handles
        if (selected) {
            ctx.fillStyle = '#7C3AED';
            [[-size.w / 2, -size.h / 2], [size.w / 2, -size.h / 2], [-size.w / 2, size.h / 2], [size.w / 2, size.h / 2]]
                .forEach(([hx, hy]) => {
                    ctx.beginPath();
                    ctx.arc(hx, hy, 5, 0, Math.PI * 2);
                    ctx.fill();
                });
        }

        ctx.restore();
    }

    // ── Hit testing ──────────────────────────────────────────
    function hitTest(cx, cy) {
        for (let i = appState.placedFurniture.length - 1; i >= 0; i--) {
            const item = appState.placedFurniture[i];
            const pos = roomToCanvas(item.x, item.y);
            const size = furniturePx(item);
            const rad = -(item.rotation || 0) * Math.PI / 180;
            const dx = cx - pos.x;
            const dy = cy - pos.y;
            const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
            const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
            if (Math.abs(rx) <= size.w / 2 && Math.abs(ry) <= size.h / 2) return i;
        }
        return -1;
    }

    // ── Events ───────────────────────────────────────────────
    function bindEvents() {
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseleave', () => { dragging = false; });
        canvas.addEventListener('dblclick', onDblClick);
    }

    function getCanvasXY(e) {
        const rect = canvas.getBoundingClientRect();
        return { cx: e.clientX - rect.left, cy: e.clientY - rect.top };
    }

    function onMouseDown(e) {
        const { cx, cy } = getCanvasXY(e);
        const hit = hitTest(cx, cy);
        setSelected(hit);
        if (hit >= 0) {
            dragging = true;
            const pos = roomToCanvas(appState.placedFurniture[hit].x, appState.placedFurniture[hit].y);
            dragOffsetX = cx - pos.x;
            dragOffsetY = cy - pos.y;
            canvas.style.cursor = 'grabbing';
        }
    }

    function onMouseMove(e) {
        const { cx, cy } = getCanvasXY(e);
        if (dragging && selectedIndex >= 0) {
            const newCx = cx - dragOffsetX;
            const newCy = cy - dragOffsetY;
            const { fx, fy } = canvasToRoom(newCx, newCy);
            updateFurnitureInState(appState.placedFurniture[selectedIndex].id, {
                x: Math.max(0, Math.min(1, fx)),
                y: Math.max(0, Math.min(1, fy)),
            });
            render();
            if (window._onFurnitureMove) window._onFurnitureMove(selectedIndex);
        } else {
            canvas.style.cursor = hitTest(cx, cy) >= 0 ? 'grab' : 'default';
        }
    }

    function onMouseUp() {
        dragging = false;
        canvas.style.cursor = 'default';
    }

    function onDblClick(e) {
        const { cx, cy } = getCanvasXY(e);
        const hit = hitTest(cx, cy);
        if (hit >= 0 && window._onFurnitureEdit) window._onFurnitureEdit(hit);
    }

    function setSelected(idx) {
        selectedIndex = idx;
        render();
        if (window._onSelectionChange) window._onSelectionChange(idx);
    }

    function getSelectedIndex() { return selectedIndex; }

    function deselectAll() { setSelected(-1); }

    return { init, resize, render, setSelected, getSelectedIndex, deselectAll };
})();
