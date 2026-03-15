// canvas3d.js — Realistic 3D Room Visualization with detailed furniture models

const C3D = (() => {
    'use strict';

    let scene, camera, renderer, controls;
    let container;
    let initialized = false;
    // uid → THREE.Group
    let furnitureMeshes = {};
    // items currently animating in
    let animatingItems = [];

    // ─────────────────────────────────────────────────────────────────────────
    //  HELPER — create a mesh and add to group
    // ─────────────────────────────────────────────────────────────────────────
    const mat = (col, opts = {}) => new THREE.MeshPhongMaterial({ color: new THREE.Color(col), ...opts });
    const mesh = (geo, material) => { const m = new THREE.Mesh(geo, material); m.castShadow = true; m.receiveShadow = true; return m; };

    function darken(hex, factor = 0.6) {
        const c = new THREE.Color(hex);
        return new THREE.Color(c.r * factor, c.g * factor, c.b * factor);
    }
    function lighten(hex, factor = 1.4) {
        const c = new THREE.Color(hex);
        return new THREE.Color(Math.min(c.r * factor, 1), Math.min(c.g * factor, 1), Math.min(c.b * factor, 1));
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FURNITURE FACTORY FUNCTIONS  (all units = metres, origin = floor centre)
    // ─────────────────────────────────────────────────────────────────────────

    // ── DINING CHAIR ─────────────────────────────────────────────────────────
    function makeChair(color) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const darkMat = mat(darken(color));
        const cushMat = mat(lighten(color, 1.6));

        // Seat cushion
        const seat = mesh(new THREE.BoxGeometry(0.42, 0.07, 0.42), cushMat);
        seat.position.set(0, 0.44, 0);
        g.add(seat);

        // Seat frame
        const seatFrame = mesh(new THREE.BoxGeometry(0.46, 0.04, 0.46), woodMat);
        seatFrame.position.set(0, 0.40, 0);
        g.add(seatFrame);

        // Back uprights x2
        [-0.17, 0.17].forEach(x => {
            const upright = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.50, 8), woodMat);
            upright.position.set(x, 0.70, -0.19);
            g.add(upright);
        });
        // Back rail
        const rail = mesh(new THREE.BoxGeometry(0.42, 0.06, 0.04), woodMat);
        rail.position.set(0, 0.82, -0.19);
        g.add(rail);
        const midRail = mesh(new THREE.BoxGeometry(0.42, 0.04, 0.04), woodMat);
        midRail.position.set(0, 0.64, -0.19);
        g.add(midRail);

        // 4 Legs
        [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([x, z]) => {
            const leg = mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.42, 8), darkMat);
            leg.position.set(x, 0.21, z);
            g.add(leg);
            // Foot cap
            const foot = mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.02, 8), darkMat);
            foot.position.set(x, 0.01, z);
            g.add(foot);
        });
        return g;
    }

    // ── ARMCHAIR ─────────────────────────────────────────────────────────────
    function makeArmchair(color) {
        const g = new THREE.Group();
        const mainMat = mat(color, { shininess: 30 });
        const darkMat = mat(darken(color, 0.7));

        // Base/bun feet
        const base = mesh(new THREE.BoxGeometry(0.82, 0.14, 0.80), darkMat);
        base.position.set(0, 0.07, 0);
        g.add(base);

        // Seat cushion
        const seat = mesh(new THREE.BoxGeometry(0.76, 0.16, 0.68), mainMat);
        seat.position.set(0, 0.29, 0.04);
        g.add(seat);

        // Seat back cushion
        const back = mesh(new THREE.BoxGeometry(0.76, 0.60, 0.14), mainMat);
        back.position.set(0, 0.57, -0.34);
        g.add(back);

        // Back frame
        const backFrame = mesh(new THREE.BoxGeometry(0.82, 0.66, 0.08), darkMat);
        backFrame.position.set(0, 0.54, -0.40);
        g.add(backFrame);

        // Left arm
        const arm = new THREE.BoxGeometry(0.14, 0.26, 0.72);
        const lArm = mesh(arm, mainMat); lArm.position.set(-0.38, 0.37, -0.02); g.add(lArm);
        const rArm = mesh(arm, mainMat); rArm.position.set(0.38, 0.37, -0.02); g.add(rArm);
        // Arm pads
        const padGeo = new THREE.BoxGeometry(0.16, 0.05, 0.74);
        const lPad = mesh(padGeo, darkMat); lPad.position.set(-0.38, 0.52, -0.02); g.add(lPad);
        const rPad = mesh(padGeo, darkMat); rPad.position.set(0.38, 0.52, -0.02); g.add(rPad);

        return g;
    }

    // ── SOFA (parametric width) ───────────────────────────────────────────────
    function makeSofa(color, width = 2.1) {
        const g = new THREE.Group();
        const mainMat = mat(color, { shininess: 20 });
        const darkMat = mat(darken(color, 0.65));
        const cushMat = mat(lighten(color, 1.25));
        const w = width;

        // Feet (4 block feet)
        [[-w / 2 + 0.12, 0.06], [w / 2 - 0.12, 0.06]].forEach(([x]) => {
            [-0.35, 0.35].forEach(z => {
                const foot = mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), darkMat);
                foot.position.set(x, 0.06, z);
                g.add(foot);
            });
        });

        // Main body base platform
        const plat = mesh(new THREE.BoxGeometry(w, 0.22, 0.88), darkMat);
        plat.position.set(0, 0.17, 0);
        g.add(plat);

        // Seat cushions (split into segments)
        const segCount = Math.round(w / 0.65);
        const segW = (w - 0.28) / segCount;
        for (let i = 0; i < segCount; i++) {
            const sx = -((w - 0.28) / 2) + segW * i + segW / 2;
            const cush = mesh(new THREE.BoxGeometry(segW - 0.03, 0.18, 0.60), cushMat);
            cush.position.set(sx, 0.37, 0.08);
            g.add(cush);
        }

        // Back cushions
        for (let i = 0; i < segCount; i++) {
            const sx = -((w - 0.28) / 2) + segW * i + segW / 2;
            const bcush = mesh(new THREE.BoxGeometry(segW - 0.03, 0.40, 0.18), cushMat);
            bcush.position.set(sx, 0.54, -0.31);
            g.add(bcush);
        }

        // Back frame
        const backF = mesh(new THREE.BoxGeometry(w, 0.50, 0.10), darkMat);
        backF.position.set(0, 0.57, -0.40);
        g.add(backF);

        // Left arm
        const lArm = mesh(new THREE.BoxGeometry(0.14, 0.60, 0.88), mainMat);
        lArm.position.set(-w / 2 + 0.07, 0.47, 0);
        g.add(lArm);
        const lArmTop = mesh(new THREE.BoxGeometry(0.18, 0.06, 0.92), darkMat);
        lArmTop.position.set(-w / 2 + 0.07, 0.79, 0);
        g.add(lArmTop);

        // Right arm
        const rArm = mesh(new THREE.BoxGeometry(0.14, 0.60, 0.88), mainMat);
        rArm.position.set(w / 2 - 0.07, 0.47, 0);
        g.add(rArm);
        const rArmTop = mesh(new THREE.BoxGeometry(0.18, 0.06, 0.92), darkMat);
        rArmTop.position.set(w / 2 - 0.07, 0.79, 0);
        g.add(rArmTop);

        return g;
    }

    // ── QUEEN BED ─────────────────────────────────────────────────────────────
    function makeBed(color, width = 1.6, length = 2.1) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const mattMat = mat('#f5f0eb');
        const pillowMat = mat('#ffffff', { shininess: 40 });
        const sheetMat = mat(lighten(color, 1.8));
        const darkMat = mat(darken(color, 0.55));

        // Bed frame base
        const frame = mesh(new THREE.BoxGeometry(width + 0.10, 0.22, length + 0.10), woodMat);
        frame.position.set(0, 0.11, 0);
        g.add(frame);

        // Slats (decorative)
        for (let i = 0; i < 5; i++) {
            const slat = mesh(new THREE.BoxGeometry(width - 0.08, 0.04, 0.08), darkMat);
            slat.position.set(0, 0.24, -length / 2 + 0.30 + i * (length * 0.17));
            g.add(slat);
        }

        // Mattress
        const matt = mesh(new THREE.BoxGeometry(width - 0.06, 0.22, length - 0.10), mattMat);
        matt.position.set(0, 0.44, 0.02);
        g.add(matt);

        // Sheet / duvet
        const sheet = mesh(new THREE.BoxGeometry(width - 0.08, 0.08, length * 0.55), sheetMat);
        sheet.position.set(0, 0.58, length * 0.15);
        g.add(sheet);

        // Pillows
        const pGeo = new THREE.BoxGeometry(width * 0.36, 0.09, 0.46);
        [-width * 0.18, width * 0.18].forEach(px => {
            const pillow = mesh(pGeo, pillowMat);
            pillow.position.set(px, 0.60, -length * 0.34);
            g.add(pillow);
        });

        // Headboard
        const hbMain = mesh(new THREE.BoxGeometry(width + 0.08, 0.75, 0.10), woodMat);
        hbMain.position.set(0, 0.60, -length / 2 - 0.02);
        g.add(hbMain);

        // Headboard panel detail
        const hbPanel = mesh(new THREE.BoxGeometry(width - 0.12, 0.52, 0.06), darkMat);
        hbPanel.position.set(0, 0.56, -length / 2 + 0.02);
        g.add(hbPanel);

        // Footboard
        const fb = mesh(new THREE.BoxGeometry(width + 0.08, 0.32, 0.10), woodMat);
        fb.position.set(0, 0.28, length / 2 + 0.02);
        g.add(fb);

        // 4 Legs
        [[-width / 2, -length / 2], [width / 2, -length / 2], [-width / 2, length / 2], [width / 2, length / 2]].forEach(([x, z]) => {
            const leg = mesh(new THREE.BoxGeometry(0.08, 0.30, 0.08), darkMat);
            leg.position.set(x, 0.15, z);
            g.add(leg);
        });

        return g;
    }

    // ── DINING TABLE ──────────────────────────────────────────────────────────
    function makeDiningTable(color, width = 1.8, depth = 0.9) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const darkMat = mat(darken(color, 0.6));

        // Table top with edge banding
        const top = mesh(new THREE.BoxGeometry(width, 0.05, depth), woodMat);
        top.position.set(0, 0.755, 0);
        g.add(top);

        const edge = mesh(new THREE.BoxGeometry(width + 0.02, 0.04, depth + 0.02), darkMat);
        edge.position.set(0, 0.73, 0);
        g.add(edge);

        // Apron (frame under table)
        const apronL = mesh(new THREE.BoxGeometry(0.04, 0.10, depth - 0.10), darkMat);
        apronL.position.set(-width / 2 + 0.07, 0.69, 0);
        g.add(apronL);
        const apronR = mesh(new THREE.BoxGeometry(0.04, 0.10, depth - 0.10), darkMat);
        apronR.position.set(width / 2 - 0.07, 0.69, 0);
        g.add(apronR);
        const apronF = mesh(new THREE.BoxGeometry(width - 0.14, 0.10, 0.04), darkMat);
        apronF.position.set(0, 0.69, depth / 2 - 0.07);
        g.add(apronF);
        const apronB = mesh(new THREE.BoxGeometry(width - 0.14, 0.10, 0.04), darkMat);
        apronB.position.set(0, 0.69, -depth / 2 + 0.07);
        g.add(apronB);

        // 4 tapered legs
        [[-width / 2 + 0.09, -depth / 2 + 0.09], [width / 2 - 0.09, -depth / 2 + 0.09],
        [-width / 2 + 0.09, depth / 2 - 0.09], [width / 2 - 0.09, depth / 2 - 0.09]].forEach(([x, z]) => {
            const leg = mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.69, 8), darkMat);
            leg.position.set(x, 0.345, z);
            g.add(leg);
        });
        return g;
    }

    // ── SIDE TABLE ────────────────────────────────────────────────────────────
    function makeSideTable(color) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const darkMat = mat(darken(color, 0.65));

        // Pedestal style
        const topDisc = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 24), woodMat);
        topDisc.position.set(0, 0.60, 0);
        g.add(topDisc);

        const pole = mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.55, 12), darkMat);
        pole.position.set(0, 0.30, 0);
        g.add(pole);

        const base = mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 24), darkMat);
        base.position.set(0, 0.02, 0);
        g.add(base);

        // Small drawer under top
        const drawer = mesh(new THREE.BoxGeometry(0.32, 0.10, 0.26), woodMat);
        drawer.position.set(0, 0.52, 0.07);
        g.add(drawer);
        const handle = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.10, 6), new THREE.MeshPhongMaterial({ color: 0x888888 }));
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, 0.52, 0.21);
        g.add(handle);
        return g;
    }

    // ── COFFEE TABLE ──────────────────────────────────────────────────────────
    function makeCoffeeTable(color) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const darkMat = mat(darken(color, 0.6));
        const glassMat = mat('#a8d8ea', { transparent: true, opacity: 0.55, shininess: 100 });

        // Glass top
        const top = mesh(new THREE.BoxGeometry(1.18, 0.03, 0.60), glassMat);
        top.position.set(0, 0.455, 0);
        g.add(top);

        // Wooden frame
        const frame = mesh(new THREE.BoxGeometry(1.22, 0.05, 0.64), woodMat);
        frame.position.set(0, 0.43, 0);
        g.add(frame);

        // Lower shelf
        const shelf = mesh(new THREE.BoxGeometry(1.08, 0.02, 0.50), woodMat);
        shelf.position.set(0, 0.22, 0);
        g.add(shelf);

        // 4 angled legs
        [[-0.50, -0.26], [0.50, -0.26], [-0.50, 0.26], [0.50, 0.26]].forEach(([x, z]) => {
            const leg = mesh(new THREE.BoxGeometry(0.05, 0.44, 0.05), darkMat);
            leg.position.set(x, 0.22, z);
            g.add(leg);
        });
        return g;
    }

    // ── WARDROBE ──────────────────────────────────────────────────────────────
    function makeWardrobe(color) {
        const g = new THREE.Group();
        const mainMat = mat(color);
        const darkMat = mat(darken(color, 0.65));
        const handleMat = mat('#C0C0C0', { shininess: 80 });

        // Carcase
        const body = mesh(new THREE.BoxGeometry(2.0, 2.0, 0.60), mainMat);
        body.position.set(0, 1.0, 0);
        g.add(body);

        // Top cornice
        const cornice = mesh(new THREE.BoxGeometry(2.08, 0.06, 0.66), darkMat);
        cornice.position.set(0, 2.03, 0);
        g.add(cornice);

        // Base plinth
        const plinth = mesh(new THREE.BoxGeometry(2.04, 0.06, 0.62), darkMat);
        plinth.position.set(0, 0.03, 0);
        g.add(plinth);

        // Door panels (2 doors with recessed panel detail)
        [-0.50, 0.50].forEach(px => {
            const door = mesh(new THREE.BoxGeometry(0.97, 1.88, 0.04), mainMat);
            door.position.set(px, 0.98, 0.32);
            g.add(door);

            // Recessed panel
            const panel = mesh(new THREE.BoxGeometry(0.80, 1.60, 0.02), darkMat);
            panel.position.set(px, 0.98, 0.35);
            g.add(panel);

            // Handle
            const handle = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.13, 8), handleMat);
            handle.rotation.x = Math.PI / 2;
            handle.position.set(px > 0 ? px - 0.28 : px + 0.28, 1.0, 0.37);
            g.add(handle);
        });

        // Vertical divider
        const div = mesh(new THREE.BoxGeometry(0.04, 1.96, 0.58), darkMat);
        div.position.set(0, 0.98, 0);
        g.add(div);

        return g;
    }

    // ── STORAGE CABINET ───────────────────────────────────────────────────────
    function makeStorageCabinet(color) {
        const g = new THREE.Group();
        const mainMat = mat(color);
        const darkMat = mat(darken(color, 0.60));
        const handleMat = mat('#999999', { shininess: 90 });

        // Body
        const body = mesh(new THREE.BoxGeometry(1.0, 1.8, 0.50), mainMat);
        body.position.set(0, 0.90, 0);
        g.add(body);

        // Top
        const top = mesh(new THREE.BoxGeometry(1.04, 0.04, 0.54), darkMat);
        top.position.set(0, 1.82, 0);
        g.add(top);

        // Plinth
        const plinth = mesh(new THREE.BoxGeometry(1.02, 0.05, 0.52), darkMat);
        plinth.position.set(0, 0.025, 0);
        g.add(plinth);

        // 2 drawers at top
        [0.70, 0.52].forEach(y => {
            const drawer = mesh(new THREE.BoxGeometry(0.94, 0.16, 0.04), darkMat);
            drawer.position.set(0, y + 0.80, 0.27);
            g.add(drawer);
            // Handle
            const h = mesh(new THREE.BoxGeometry(0.16, 0.02, 0.03), handleMat);
            h.position.set(0, y + 0.80, 0.29);
            g.add(h);
        });

        // 2 doors for lower section
        [-0.26, 0.26].forEach(px => {
            const door = mesh(new THREE.BoxGeometry(0.46, 0.80, 0.04), mainMat);
            door.position.set(px, 0.42, 0.27);
            g.add(door);
            const panel = mesh(new THREE.BoxGeometry(0.36, 0.66, 0.02), darkMat);
            panel.position.set(px, 0.42, 0.29);
            g.add(panel);
            const h = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), handleMat);
            h.rotation.x = Math.PI / 2;
            h.position.set(px > 0 ? px - 0.16 : px + 0.16, 0.42, 0.30);
            g.add(h);
        });
        return g;
    }

    // ── TV UNIT ───────────────────────────────────────────────────────────────
    function makeTVUnit(color) {
        const g = new THREE.Group();
        const mainMat = mat(color);
        const darkMat = mat(darken(color, 0.55));
        const legMat = mat('#1a1a1a');
        const screenMat = mat('#1a1a2e', { shininess: 120 });

        // Body
        const body = mesh(new THREE.BoxGeometry(1.80, 0.46, 0.45), mainMat);
        body.position.set(0, 0.32, 0);
        g.add(body);

        // Top surface
        const top = mesh(new THREE.BoxGeometry(1.84, 0.03, 0.47), darkMat);
        top.position.set(0, 0.565, 0);
        g.add(top);

        // Compartment dividers + doors
        [-0.65, 0, 0.65].forEach((px, i) => {
            if (i === 1) {
                // Middle open shelf
                const shelf = mesh(new THREE.BoxGeometry(0.50, 0.02, 0.40), darkMat);
                shelf.position.set(px, 0.32, 0);
                g.add(shelf);
            } else {
                const door = mesh(new THREE.BoxGeometry(0.54, 0.42, 0.03), mainMat);
                door.position.set(px, 0.32, 0.24);
                g.add(door);
                const panel = mesh(new THREE.BoxGeometry(0.44, 0.34, 0.02), darkMat);
                panel.position.set(px, 0.32, 0.26);
                g.add(panel);
            }
        });

        // Hairpin legs (4)
        [[-0.80, -0.18], [0.80, -0.18], [-0.80, 0.18], [0.80, 0.18]].forEach(([x, z]) => {
            const leg = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), legMat);
            leg.position.set(x, 0.06, z);
            g.add(leg);
        });
        return g;
    }

    // ── BOOKSHELF ─────────────────────────────────────────────────────────────
    function makeBookshelf(color) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const darkMat = mat(darken(color, 0.60));
        const bookColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

        // Side panels
        [-0.50, 0.50].forEach(x => {
            const side = mesh(new THREE.BoxGeometry(0.04, 2.0, 0.36), woodMat);
            side.position.set(x, 1.0, 0);
            g.add(side);
        });

        // Top + Bottom
        const topP = mesh(new THREE.BoxGeometry(1.04, 0.04, 0.36), darkMat);
        topP.position.set(0, 1.98, 0); g.add(topP);
        const botP = mesh(new THREE.BoxGeometry(1.04, 0.04, 0.36), darkMat);
        botP.position.set(0, 0.02, 0); g.add(botP);
        const back = mesh(new THREE.BoxGeometry(1.0, 1.96, 0.02), darkMat);
        back.position.set(0, 1.0, -0.17); g.add(back);

        // 4 shelves
        [0.46, 0.90, 1.34, 1.78].forEach(y => {
            const shelf = mesh(new THREE.BoxGeometry(1.00, 0.03, 0.36), woodMat);
            shelf.position.set(0, y, 0);
            g.add(shelf);
        });

        // Books on each shelf
        [[0.06, 0.38], [0.50, 0.82], [0.94, 1.26]].forEach(([y0, y1]) => {
            let bx = -0.44;
            while (bx < 0.44) {
                const bw = 0.04 + Math.random() * 0.06;
                const bh = (y1 - y0) * (0.65 + Math.random() * 0.3);
                const bcol = bookColors[Math.floor(Math.random() * bookColors.length)];
                const book = mesh(new THREE.BoxGeometry(bw, bh, 0.24), mat(bcol));
                book.position.set(bx + bw / 2, y0 + 0.03 + bh / 2, 0.04);
                g.add(book);
                bx += bw + 0.008;
            }
        });
        return g;
    }

    // ── DESK ──────────────────────────────────────────────────────────────────
    function makeDesk(color) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const darkMat = mat(darken(color, 0.62));

        // Desktop
        const top = mesh(new THREE.BoxGeometry(1.4, 0.04, 0.70), woodMat);
        top.position.set(0, 0.74, 0);
        g.add(top);

        // Side panel legs
        [-0.64, 0.64].forEach(x => {
            const panel = mesh(new THREE.BoxGeometry(0.04, 0.70, 0.66), darkMat);
            panel.position.set(x, 0.37, 0);
            g.add(panel);
            // Foot bar
            const foot = mesh(new THREE.BoxGeometry(0.08, 0.04, 0.68), darkMat);
            foot.position.set(x, 0.02, 0);
            g.add(foot);
        });

        // Modesty panel / cross bar
        const bar = mesh(new THREE.BoxGeometry(1.30, 0.04, 0.04), darkMat);
        bar.position.set(0, 0.40, -0.30);
        g.add(bar);

        // Small monitor stand
        const mBase = mesh(new THREE.BoxGeometry(0.38, 0.03, 0.22), darkMat);
        mBase.position.set(-0.30, 0.76, -0.16);
        g.add(mBase);
        const mNeck = mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), darkMat);
        mNeck.position.set(-0.30, 0.88, -0.16);
        g.add(mNeck);
        const mScreen = mesh(new THREE.BoxGeometry(0.34, 0.24, 0.02), mat('#1a1a2e'));
        mScreen.position.set(-0.30, 1.01, -0.16);
        g.add(mScreen);

        return g;
    }

    // ── FLOOR LAMP ────────────────────────────────────────────────────────────
    function makeFloorLamp(color) {
        const g = new THREE.Group();
        const poleMat = mat(darken(color, 0.7), { shininess: 60 });
        const shadeMat = mat(color, { emissive: lighten(color, 0.15), shininess: 20 });
        const glareMat = mat('#fffdd0', { emissive: '#fffdd0', emissiveIntensity: 0.6 });

        // Base
        const base = mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.05, 24), poleMat);
        base.position.set(0, 0.025, 0);
        g.add(base);

        // Pole
        const pole = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.40, 12), poleMat);
        pole.position.set(0, 0.75, 0);
        g.add(pole);

        // Pole joint
        const joint = mesh(new THREE.SphereGeometry(0.04, 12, 12), poleMat);
        joint.position.set(0, 1.46, 0);
        g.add(joint);

        // Shade (inverted cone)
        const shade = mesh(new THREE.ConeGeometry(0.28, 0.36, 24, 1, true), shadeMat);
        shade.rotation.x = Math.PI;
        shade.position.set(0, 1.70, 0);
        g.add(shade);

        // Inner glow disc
        const glow = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.01, 24), glareMat);
        glow.position.set(0, 1.53, 0);
        g.add(glow);

        // Point light inside shade (small, local)
        const lamp = new THREE.PointLight(0xfff4cc, 0.8, 3.5);
        lamp.position.set(0, 1.60, 0);
        g.add(lamp);

        return g;
    }

    // ── FLOOR PLANT ───────────────────────────────────────────────────────────
    function makePlant(color) {
        const g = new THREE.Group();
        const potMat = mat('#C05A2A');
        const soilMat = mat('#3B2000');
        const stemMat = mat('#3A5A20');
        const leafMat = mat(color, { shininess: 40 });

        // Pot
        const pot = mesh(new THREE.CylinderGeometry(0.14, 0.10, 0.28, 24), potMat);
        pot.position.set(0, 0.14, 0);
        g.add(pot);

        // Pot rim
        const rim = mesh(new THREE.TorusGeometry(0.145, 0.015, 8, 24), potMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(0, 0.29, 0);
        g.add(rim);

        // Soil
        const soil = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 24), soilMat);
        soil.position.set(0, 0.29, 0);
        g.add(soil);

        // Main stem
        const stem = mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.80, 8), stemMat);
        stem.position.set(0, 0.70, 0);
        g.add(stem);

        // Leaf clusters (multiple spheres at angles)
        [[0, 1.15, 0, 0.22], [0.12, 1.05, 0.12, 0.16], [-0.14, 1.08, -0.10, 0.18],
        [0.18, 0.95, -0.08, 0.14], [-0.10, 0.90, 0.15, 0.15],
        [0.05, 1.22, -0.12, 0.13], [-0.08, 1.18, 0.08, 0.14]].forEach(([x, y, z, r]) => {
            const leaf = mesh(new THREE.SphereGeometry(r, 10, 8), leafMat);
            leaf.position.set(x, y, z);
            leaf.scale.set(1, 0.7 + Math.random() * 0.5, 1);
            g.add(leaf);
        });

        return g;
    }

    // ── AREA RUG ──────────────────────────────────────────────────────────────
    function makeRug(color) {
        const g = new THREE.Group();
        const mainMat = mat(color);
        const borderMat = mat(darken(color, 0.55));
        const patMat = mat(lighten(color, 1.45));

        // Main rug body
        const rug = mesh(new THREE.BoxGeometry(2.0, 0.015, 1.5), mainMat);
        rug.position.set(0, 0.007, 0);
        g.add(rug);

        // Border
        const bTop = mesh(new THREE.BoxGeometry(2.04, 0.016, 0.12), borderMat);
        bTop.position.set(0, 0.007, -0.69); g.add(bTop);
        const bBot = mesh(new THREE.BoxGeometry(2.04, 0.016, 0.12), borderMat);
        bBot.position.set(0, 0.007, 0.69); g.add(bBot);
        const bL = mesh(new THREE.BoxGeometry(0.12, 0.016, 1.50), borderMat);
        bL.position.set(-0.96, 0.007, 0); g.add(bL);
        const bR = mesh(new THREE.BoxGeometry(0.12, 0.016, 1.50), borderMat);
        bR.position.set(0.96, 0.007, 0); g.add(bR);

        // Simple pattern Xs in centre
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const p = mesh(new THREE.BoxGeometry(0.08, 0.017, 0.08), patMat);
                p.position.set(i * 0.55, 0.007, j * 0.40);
                g.add(p);
            }
        }
        return g;
    }

    // ── OFFICE CHAIR ─────────────────────────────────────────────────────────
    function makeOfficeChair(color) {
        const g = new THREE.Group();
        const seatMat = mat(color, { shininess: 30 });
        const metalMat = mat('#555555', { shininess: 80 });
        const wheelMat = mat('#222222');

        // Star base (5 arms)
        for (let i = 0; i < 5; i++) {
            const arm = mesh(new THREE.BoxGeometry(0.32, 0.04, 0.056), metalMat);
            arm.position.set(0.18, 0.06, 0);
            arm.rotation.y = (i / 5) * Math.PI * 2;
            // Wheel at end
            const whl = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 12), wheelMat);
            whl.rotation.z = Math.PI / 2;
            whl.position.set(0.35, 0, 0);
            arm.add(whl);
            g.add(arm);
        }

        // Pneumatic pole
        const pole = mesh(new THREE.CylinderGeometry(0.04, 0.034, 0.42, 12), metalMat);
        pole.position.set(0, 0.27, 0);
        g.add(pole);

        // Seat cushion
        const seat = mesh(new THREE.BoxGeometry(0.50, 0.08, 0.48), seatMat);
        seat.position.set(0, 0.50, 0.02);
        g.add(seat);

        // Back cushion
        const back = mesh(new THREE.BoxGeometry(0.46, 0.58, 0.08), seatMat);
        back.position.set(0, 0.88, -0.22);
        g.add(back);

        // Back support
        const backSup = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.50, 8), metalMat);
        backSup.position.set(0, 0.74, -0.18);
        g.add(backSup);

        // Armrests
        [-0.28, 0.28].forEach(x => {
            const aPost = mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), metalMat);
            aPost.position.set(x, 0.62, 0.04);
            g.add(aPost);
            const aPad = mesh(new THREE.BoxGeometry(0.06, 0.04, 0.22), seatMat);
            aPad.position.set(x, 0.74, 0.04);
            g.add(aPad);
        });
        return g;
    }

    // ── BAR TABLE ─────────────────────────────────────────────────────────────
    function makeBarTable(color) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const metalMat = mat('#333333', { shininess: 80 });

        // Circular top
        const top = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 32), woodMat);
        top.position.set(0, 1.05, 0);
        g.add(top);

        // Pedestal pole
        const pole = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.96, 16), metalMat);
        pole.position.set(0, 0.55, 0);
        g.add(pole);

        // Circular base
        const base = mesh(new THREE.CylinderGeometry(0.28, 0.30, 0.05, 32), metalMat);
        base.position.set(0, 0.025, 0);
        g.add(base);

        return g;
    }

    // ── BENCH ─────────────────────────────────────────────────────────────────
    function makeBench(color) {
        const g = new THREE.Group();
        const woodMat = mat(color);
        const darkMat = mat(darken(color, 0.6));

        // Seat
        const seat = mesh(new THREE.BoxGeometry(1.2, 0.05, 0.4), woodMat);
        seat.position.set(0, 0.45, 0);
        g.add(seat);

        // Legs (u-shaped frames at each end)
        [[-0.5, 0], [0.5, 0]].forEach(([x]) => {
            const leg = mesh(new THREE.BoxGeometry(0.04, 0.42, 0.36), darkMat);
            leg.position.set(x, 0.21, 0);
            g.add(leg);
            // Foot
            const foot = mesh(new THREE.BoxGeometry(0.08, 0.03, 0.38), darkMat);
            foot.position.set(x, 0.015, 0);
            g.add(foot);
        });

        // Supporting rail
        const rail = mesh(new THREE.BoxGeometry(1.0, 0.04, 0.04), darkMat);
        rail.position.set(0, 0.35, 0);
        g.add(rail);

        return g;
    }

    // ── OTTOMAN ───────────────────────────────────────────────────────────────
    function makeOttoman(color) {
        const g = new THREE.Group();
        const mainMat = mat(color, { shininess: 30 });
        const darkMat = mat(darken(color, 0.7));

        // Padded body (cylinder with rounded top)
        const body = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.38, 32), mainMat);
        body.position.set(0, 0.22, 0);
        g.add(body);

        // Padded top cap
        const top = mesh(new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mainMat);
        top.position.set(0, 0.41, 0);
        g.add(top);

        // Base/feet
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const leg = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), darkMat);
            leg.position.set(Math.cos(angle) * 0.22, 0.02, Math.sin(angle) * 0.22);
            g.add(leg);
        }

        return g;
    }

    // ── CREDENZA ──────────────────────────────────────────────────────────────
    function makeCredenza(color) {
        const g = new THREE.Group();
        const mainMat = mat(color);
        const darkMat = mat(darken(color, 0.65));
        const handleMat = mat('#C0C0C0', { shininess: 90 });

        // Main body
        const body = mesh(new THREE.BoxGeometry(1.5, 0.65, 0.4), mainMat);
        body.position.set(0, 0.425, 0);
        g.add(body);

        // Top surface
        const top = mesh(new THREE.BoxGeometry(1.54, 0.03, 0.42), darkMat);
        top.position.set(0, 0.76, 0);
        g.add(top);

        // 3 doors
        [-0.5, 0, 0.5].forEach(x => {
            const door = mesh(new THREE.BoxGeometry(0.48, 0.60, 0.03), mainMat);
            door.position.set(x, 0.425, 0.21);
            g.add(door);
            // Handle
            const h = mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), handleMat);
            h.position.set(x > 0 ? x - 0.18 : (x < 0 ? x + 0.18 : 0.2), 0.425, 0.23);
            g.add(h);
        });

        // Tapered legs
        [[-0.65, -0.15], [0.65, -0.15], [-0.65, 0.15], [0.65, 0.15]].forEach(([x, z]) => {
            const leg = mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.15, 8), darkMat);
            leg.position.set(x, 0.075, z);
            g.add(leg);
        });

        return g;
    }

    // ── SMALL PLANT ───────────────────────────────────────────────────────────
    function makeSmallPlant(color) {
        const g = new THREE.Group();
        const potMat = mat('#F0EAD6'); // Ceramic
        const plantColor = new THREE.Color(color);

        // Pot
        const pot = mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.12, 24), potMat);
        pot.position.set(0, 0.06, 0);
        g.add(pot);

        // Cactus segments
        const cactusMat = mat(plantColor);
        const seg1 = mesh(new THREE.SphereGeometry(0.08, 16, 12), cactusMat);
        seg1.scale.set(1, 1.4, 1);
        seg1.position.set(0, 0.2, 0);
        g.add(seg1);

        const seg2 = mesh(new THREE.SphereGeometry(0.04, 12, 8), cactusMat);
        seg2.position.set(0.05, 0.3, 0.03);
        g.add(seg2);

        const seg3 = mesh(new THREE.SphereGeometry(0.035, 12, 8), cactusMat);
        seg3.position.set(-0.04, 0.28, -0.04);
        g.add(seg3);

        return g;
    }

    // ── DECORATIVE VASE ───────────────────────────────────────────────────────
    function makeVase(color) {
        const g = new THREE.Group();
        const vaseMat = mat(color, { shininess: 80 });
        const flowerMat = mat('#e74c3c');

        // Elegant curved body
        const b1 = mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.3, 24), vaseMat);
        b1.position.set(0, 0.15, 0);
        g.add(b1);

        const b2 = mesh(new THREE.CylinderGeometry(0.15, 0.06, 0.4, 24), vaseMat);
        b2.position.set(0, 0.5, 0);
        g.add(b2);

        const rim = mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 24), vaseMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(0, 0.7, 0);
        g.add(rim);

        // Stems and flowers
        const stemMat = mat('#2d6a4f');
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const stem = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.6, 6), stemMat);
            stem.rotation.z = 0.2;
            stem.rotation.y = angle;
            stem.position.set(Math.cos(angle) * 0.05, 0.8, Math.sin(angle) * 0.05);
            g.add(stem);

            const flower = mesh(new THREE.SphereGeometry(0.03, 8, 8), flowerMat);
            flower.position.set(Math.cos(angle) * 0.15, 1.1, Math.sin(angle) * 0.15);
            g.add(flower);
        }

        return g;
    }

    // ── FLOOR MIRROR ──────────────────────────────────────────────────────────
    function makeFloorMirror(color) {
        const g = new THREE.Group();
        const frameMat = mat(color);
        const mirrorMat = mat('#a8d8ea', { shininess: 120, reflectivity: 1, transparent: true, opacity: 0.8 });

        // Outer frame
        const frame = mesh(new THREE.BoxGeometry(0.8, 1.8, 0.08), frameMat);
        frame.position.set(0, 0.9, 0);
        g.add(frame);

        // Mirror surface
        const surf = mesh(new THREE.PlaneGeometry(0.68, 1.68), mirrorMat);
        surf.position.set(0, 0.9, 0.045);
        g.add(surf);

        // Stand (A-frame at back)
        const stand = mesh(new THREE.BoxGeometry(0.7, 1.7, 0.04), frameMat);
        stand.position.set(0, 0.85, -0.4);
        stand.rotation.x = 0.2;
        g.add(stand);

        return g;
    }

    // ── WINDOW FRAME ──────────────────────────────────────────────────────────
    function makeWindow(color) {
        const g = new THREE.Group();
        const frameMat = mat(color);
        const glassMat = mat('#AED6F1', { transparent: true, opacity: 0.45, shininess: 120 });
        const darkMat = mat(darken(color, 0.65));

        // Outer frame
        const outerH = mesh(new THREE.BoxGeometry(1.0, 0.06, 0.06), frameMat);
        outerH.position.set(0, 1.2, 0); g.add(outerH);
        const outerHL = mesh(new THREE.BoxGeometry(1.0, 0.06, 0.06), frameMat);
        outerHL.position.set(0, 0.06, 0); g.add(outerHL);
        const outerVL = mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), frameMat);
        outerVL.position.set(-0.47, 0.63, 0); g.add(outerVL);
        const outerVR = mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), frameMat);
        outerVR.position.set(0.47, 0.63, 0); g.add(outerVR);

        // Glass panes (2 side by side)
        [-0.24, 0.24].forEach(x => {
            const pane = mesh(new THREE.BoxGeometry(0.38, 1.06, 0.02), glassMat);
            pane.position.set(x, 0.63, 0); g.add(pane);
        });

        // Centre mullion
        const mullion = mesh(new THREE.BoxGeometry(0.04, 1.10, 0.06), darkMat);
        mullion.position.set(0, 0.63, 0); g.add(mullion);

        // Horizontal bar
        const bar = mesh(new THREE.BoxGeometry(0.94, 0.04, 0.06), darkMat);
        bar.position.set(0, 0.63, 0); g.add(bar);

        return g;
    }

    // ── SINGLE DOOR ───────────────────────────────────────────────────────────
    function makeDoor(color) {
        const g = new THREE.Group();
        const doorMat = mat(color);
        const darkMat = mat(darken(color, 0.6));
        const handleMat = mat('#C0C0C0', { shininess: 100 });

        // Door slab
        const slab = mesh(new THREE.BoxGeometry(0.9, 2.1, 0.05), doorMat);
        slab.position.set(0, 1.05, 0); g.add(slab);

        // Recessed panels (2 vertical)
        [0.56, 1.54].forEach(y => {
            const panel = mesh(new THREE.BoxGeometry(0.68, 0.48, 0.02), darkMat);
            panel.position.set(0, y, 0.04); g.add(panel);
        });

        // Handle
        const handle = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.11, 8), handleMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0.35, 1.05, 0.04); g.add(handle);

        // Handle rose
        const rose = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), handleMat);
        rose.rotation.x = Math.PI / 2;
        rose.position.set(0.28, 1.05, 0.04); g.add(rose);

        // Door frame
        const fTop = mesh(new THREE.BoxGeometry(1.0, 0.08, 0.12), darkMat);
        fTop.position.set(0, 2.18, 0); g.add(fTop);
        const fL = mesh(new THREE.BoxGeometry(0.06, 2.2, 0.12), darkMat);
        fL.position.set(-0.48, 1.10, 0); g.add(fL);
        const fR = mesh(new THREE.BoxGeometry(0.06, 2.2, 0.12), darkMat);
        fR.position.set(0.48, 1.10, 0); g.add(fR);

        return g;
    }

    // ── CURTAIN PANEL ─────────────────────────────────────────────────────────
    function makeCurtain(color) {
        const g = new THREE.Group();
        const fabricMat = mat(color, { side: THREE.DoubleSide, shininess: 15 });
        const rodMat = mat('#888888', { shininess: 70 });
        const ringMat = mat('#AAAAAA', { shininess: 80 });

        // Rod
        const rod = mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.5, 12), rodMat);
        rod.rotation.z = Math.PI / 2;
        rod.position.set(0, 2.42, 0); g.add(rod);

        // Rod finials
        [-0.75, 0.75].forEach(x => {
            const fin = mesh(new THREE.SphereGeometry(0.035, 12, 12), rodMat);
            fin.position.set(x, 2.42, 0); g.add(fin);
        });

        // Curtain rings
        for (let i = 0; i < 6; i++) {
            const ring = mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16), ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(-0.6 + i * 0.24, 2.40, 0); g.add(ring);
        }

        // Fabric — multiple pleated panels
        const pleatOffsets = [-0.55, -0.28, 0, 0.28, 0.55];
        pleatOffsets.forEach((x, i) => {
            const w = 0.24;
            const panel = mesh(new THREE.BoxGeometry(w, 2.3, 0.01 + (i % 2) * 0.02), fabricMat);
            panel.position.set(x, 1.2, (i % 2) * 0.03); g.add(panel);
        });

        // Fabric bottom puddle
        const puddle = mesh(new THREE.BoxGeometry(1.3, 0.08, 0.06), fabricMat);
        puddle.position.set(0, 0.04, 0.02); g.add(puddle);

        return g;
    }

    // ── DRESSER ───────────────────────────────────────────────────────────────
    function makeDresser(color) {
        const g = new THREE.Group();
        const mainMat = mat(color);
        const darkMat = mat(darken(color, 0.62));
        const handleMat = mat('#B8860B', { shininess: 90 });

        // Body
        const body = mesh(new THREE.BoxGeometry(1.0, 1.1, 0.50), mainMat);
        body.position.set(0, 0.60, 0); g.add(body);

        // Top surface
        const top = mesh(new THREE.BoxGeometry(1.04, 0.04, 0.52), darkMat);
        top.position.set(0, 1.14, 0); g.add(top);

        // Plinth
        const plinth = mesh(new THREE.BoxGeometry(1.02, 0.05, 0.50), darkMat);
        plinth.position.set(0, 0.025, 0); g.add(plinth);

        // 4 rows of drawers
        [0.85, 0.65, 0.45, 0.25].forEach(y => {
            // Left drawer
            const dL = mesh(new THREE.BoxGeometry(0.46, 0.17, 0.03), darkMat);
            dL.position.set(-0.25, y, 0.26); g.add(dL);
            const hL = mesh(new THREE.BoxGeometry(0.12, 0.025, 0.025), handleMat);
            hL.position.set(-0.25, y, 0.28); g.add(hL);
            // Right drawer
            const dR = mesh(new THREE.BoxGeometry(0.46, 0.17, 0.03), darkMat);
            dR.position.set(0.25, y, 0.26); g.add(dR);
            const hR = mesh(new THREE.BoxGeometry(0.12, 0.025, 0.025), handleMat);
            hR.position.set(0.25, y, 0.28); g.add(hR);
        });

        // Small mirror on top
        const mirrorFrame = mesh(new THREE.BoxGeometry(0.50, 0.48, 0.04), darkMat);
        mirrorFrame.position.set(0, 1.44, -0.12); g.add(mirrorFrame);
        const mirrorGlass = mat('#AED6F1', { transparent: true, opacity: 0.7, shininess: 120 });
        const mirrorSurf = mesh(new THREE.PlaneGeometry(0.42, 0.40), mirrorGlass);
        mirrorSurf.position.set(0, 1.44, -0.09); g.add(mirrorSurf);

        return g;
    }

    // ── NIGHTSTAND ────────────────────────────────────────────────────────────
    function makeNightstand(color) {
        const g = new THREE.Group();
        const mainMat = mat(color);
        const darkMat = mat(darken(color, 0.65));
        const handleMat = mat('#999999', { shininess: 80 });

        // Body
        const body = mesh(new THREE.BoxGeometry(0.5, 0.55, 0.40), mainMat);
        body.position.set(0, 0.315, 0); g.add(body);

        // Top
        const top = mesh(new THREE.BoxGeometry(0.52, 0.03, 0.42), darkMat);
        top.position.set(0, 0.605, 0); g.add(top);

        // Drawer
        const drawer = mesh(new THREE.BoxGeometry(0.44, 0.16, 0.03), darkMat);
        drawer.position.set(0, 0.40, 0.22); g.add(drawer);
        const h = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.10, 8), handleMat);
        h.rotation.z = Math.PI / 2;
        h.position.set(0, 0.40, 0.24); g.add(h);

        // Open shelf below
        const shelf = mesh(new THREE.BoxGeometry(0.46, 0.02, 0.38), darkMat);
        shelf.position.set(0, 0.18, 0); g.add(shelf);

        // 4 small legs
        [[-0.20, -0.16], [0.20, -0.16], [-0.20, 0.16], [0.20, 0.16]].forEach(([x, z]) => {
            const leg = mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.10, 8), darkMat);
            leg.position.set(x, 0.05, z); g.add(leg);
        });

        // Small table lamp on top
        const lampBase = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.04, 16), mat('#D4A96A'));
        lampBase.position.set(0.1, 0.64, 0.05); g.add(lampBase);
        const lampPole = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), mat('#888'));
        lampPole.position.set(0.1, 0.74, 0.05); g.add(lampPole);
        const lampShade = mesh(new THREE.ConeGeometry(0.09, 0.12, 16, 1, true), mat('#FDE8C8', { side: THREE.DoubleSide }));
        lampShade.position.set(0.1, 0.86, 0.05); g.add(lampShade);

        return g;
    }

    // ── VANITY TABLE ──────────────────────────────────────────────────────────
    function makeVanityTable(color) {
        const g = new THREE.Group();
        const mainMat = mat(color);
        const darkMat = mat(darken(color, 0.62));
        const glassMat = mat('#AED6F1', { transparent: true, opacity: 0.65, shininess: 120 });
        const handleMat = mat('#D4AF37', { shininess: 100 });

        // Table body
        const body = mesh(new THREE.BoxGeometry(1.0, 0.68, 0.45), mainMat);
        body.position.set(0, 0.375, 0); g.add(body);

        // Table top
        const top = mesh(new THREE.BoxGeometry(1.04, 0.03, 0.47), darkMat);
        top.position.set(0, 0.745, 0); g.add(top);

        // Centre drawer
        const drawer = mesh(new THREE.BoxGeometry(0.40, 0.14, 0.03), darkMat);
        drawer.position.set(0, 0.42, 0.24); g.add(drawer);
        const h = mesh(new THREE.BoxGeometry(0.10, 0.02, 0.02), handleMat);
        h.position.set(0, 0.42, 0.26); g.add(h);

        // Side door panels
        [-0.36, 0.36].forEach(x => {
            const door = mesh(new THREE.BoxGeometry(0.24, 0.58, 0.03), mainMat);
            door.position.set(x, 0.37, 0.24); g.add(door);
            const dh = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 8), handleMat);
            dh.rotation.x = Math.PI / 2;
            dh.position.set(x > 0 ? x - 0.09 : x + 0.09, 0.37, 0.26); g.add(dh);
        });

        // 4 tapered legs
        [[-0.44, -0.18], [0.44, -0.18], [-0.44, 0.18], [0.44, 0.18]].forEach(([x, z]) => {
            const leg = mesh(new THREE.CylinderGeometry(0.022, 0.016, 0.12, 8), darkMat);
            leg.position.set(x, 0.06, z); g.add(leg);
        });

        // Large mirror
        const mFrame = mesh(new THREE.BoxGeometry(0.80, 0.70, 0.04), darkMat);
        mFrame.position.set(0, 1.16, -0.10); g.add(mFrame);
        const mGlass = mesh(new THREE.PlaneGeometry(0.70, 0.60), glassMat);
        mGlass.position.set(0, 1.16, -0.07); g.add(mGlass);

        // Mirror stand legs
        [-0.26, 0.26].forEach(x => {
            const mLeg = mesh(new THREE.BoxGeometry(0.03, 0.44, 0.03), darkMat);
            mLeg.position.set(x, 0.98, -0.10); g.add(mLeg);
        });

        // Small perfume bottle on top
        const bottle = mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.10, 12), mat('#A8D8EA', { transparent: true, opacity: 0.7 }));
        bottle.position.set(-0.28, 0.80, 0.02); g.add(bottle);

        return g;
    }

    // ── WALL SCONCE ───────────────────────────────────────────────────────────
    function makeWallSconce(color) {
        const g = new THREE.Group();
        const metalMat = mat(darken(color, 0.7), { shininess: 80 });
        const shadeMat = mat(color, { shininess: 20 });
        const glowMat = mat('#FFFACD', { emissive: '#FFFACD', emissiveIntensity: 0.8 });

        // Wall bracket / backplate
        const plate = mesh(new THREE.BoxGeometry(0.10, 0.22, 0.04), metalMat);
        plate.position.set(0, 0.11, -0.04); g.add(plate);

        // Arm extending from wall
        const arm = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), metalMat);
        arm.rotation.x = Math.PI / 2;
        arm.position.set(0, 0.20, 0.09); g.add(arm);

        // Shade (small cone pointing up)
        const shade = mesh(new THREE.ConeGeometry(0.10, 0.14, 16, 1, true), shadeMat);
        shade.rotation.x = Math.PI;
        shade.position.set(0, 0.28, 0.19); g.add(shade);

        // Glow disc
        const glow = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 16), glowMat);
        glow.position.set(0, 0.21, 0.19); g.add(glow);

        // Point light
        const pt = new THREE.PointLight(0xfff4cc, 0.6, 2.5);
        pt.position.set(0, 0.25, 0.19); g.add(pt);

        return g;
    }

    // ── WALL PANEL LIGHT ──────────────────────────────────────────────────────
    function makeWallPanelLight(color) {
        const g = new THREE.Group();
        const houseMat = mat('#EEEEEE', { shininess: 40 });
        const glowMat = mat(color, { emissive: color, emissiveIntensity: 1.0 });
        const trimMat = mat('#CCCCCC', { shininess: 60 });

        // Housing box (thin, wide)
        const housing = mesh(new THREE.BoxGeometry(0.60, 0.10, 0.06), houseMat);
        housing.position.set(0, 0.05, 0); g.add(housing);

        // LED strip glow
        const strip = mesh(new THREE.BoxGeometry(0.54, 0.03, 0.01), glowMat);
        strip.position.set(0, 0.03, 0.04); g.add(strip);

        // Trim edges
        [-0.3, 0.3].forEach(x => {
            const trim = mesh(new THREE.BoxGeometry(0.02, 0.10, 0.06), trimMat);
            trim.position.set(x, 0.05, 0); g.add(trim);
        });

        // Diffuse point light
        const pt = new THREE.PointLight(0xffffff, 0.5, 3.0);
        pt.position.set(0, 0.10, 0.08); g.add(pt);

        return g;
    }

    // ── FLOOR UPLIGHTER ───────────────────────────────────────────────────────
    function makeFloorUplighter(color) {
        const g = new THREE.Group();
        const metalMat = mat('#555555', { shininess: 80 });
        const glowMat = mat(color, { emissive: color, emissiveIntensity: 0.9 });

        // Round base disc
        const base = mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 24), metalMat);
        base.position.set(0, 0.02, 0); g.add(base);

        // Short pole
        const pole = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 12), metalMat);
        pole.position.set(0, 0.25, 0); g.add(pole);

        // Upward-opening cone shade
        const shade = mesh(new THREE.ConeGeometry(0.16, 0.20, 24, 1, true), mat(darken(color, 0.7), { side: THREE.DoubleSide }));
        shade.position.set(0, 0.58, 0); g.add(shade);

        // Glow disc at top of shade
        const glow = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.01, 24), glowMat);
        glow.position.set(0, 0.68, 0); g.add(glow);

        // Point light shooting upward
        const pt = new THREE.PointLight(0xfff4cc, 0.7, 3.0);
        pt.position.set(0, 0.70, 0); g.add(pt);

        return g;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  MODEL DISPATCHER — pick the right factory per catalog ID
    // ─────────────────────────────────────────────────────────────────────────
    function buildFurnitureModel(item) {
        const color = item.color || '#8B6914';
        switch (item.catalogId) {
            case 'sofa_3seat': return makeSofa(color, 2.1);
            case 'sofa_2seat': return makeSofa(color, 1.55);
            case 'ottoman': return makeOttoman(color);
            case 'bed_queen': return makeBed(color, 1.6, 2.1);
            case 'bed_single': return makeBed(color, 1.0, 2.0);
            case 'dining_table': return makeDiningTable(color, 1.8, 0.9);
            case 'side_table': return makeSideTable(color);
            case 'coffee_table': return makeCoffeeTable(color);
            case 'bar_table': return makeBarTable(color);
            case 'dining_chair': return makeChair(color);
            case 'office_chair': return makeOfficeChair(color);
            case 'armchair': return makeArmchair(color);
            case 'bench': return makeBench(color);
            case 'wardrobe': return makeWardrobe(color);
            case 'storage_cab': return makeStorageCabinet(color);
            case 'credenza': return makeCredenza(color);
            case 'tv_unit': return makeTVUnit(color);
            case 'bookshelf': return makeBookshelf(color);
            case 'desk': return makeDesk(color);
            case 'plant_large': return makePlant(color);
            case 'plant_small': return makeSmallPlant(color);
            case 'lamp_floor': return makeFloorLamp(color);
            case 'rug': return makeRug(color);
            case 'vase_floor': return makeVase(color);
            case 'mirror_floor': return makeFloorMirror(color);
            // Window & Door
            case 'window_single': return makeWindow(color);
            case 'door_single': return makeDoor(color);
            case 'curtain_panel': return makeCurtain(color);
            // Bedroom Extras
            case 'dresser': return makeDresser(color);
            case 'nightstand': return makeNightstand(color);
            case 'vanity_table': return makeVanityTable(color);
            // Lighting
            case 'wall_sconce': return makeWallSconce(color);
            case 'wall_panel_light': return makeWallPanelLight(color);
            case 'floor_uplighter': return makeFloorUplighter(color);
            default: return makeChair(color); // fallback
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  SPRING BOUNCE-IN ANIMATION
    // ─────────────────────────────────────────────────────────────────────────
    function springEase(t) {
        // Damped spring — bounces slightly at the end
        return 1 - Math.pow(2, -10 * t) * Math.cos(t * Math.PI * 4.5);
    }

    function animateDropIn(group, finalScale) {
        const startTime = performance.now();
        const duration = 700; // ms
        group.scale.set(0, 0, 0);
        animatingItems.push({ group, finalScale, startTime, duration });
    }

    function tickAnimations() {
        const now = performance.now();
        animatingItems = animatingItems.filter(anim => {
            const t = Math.min(1, (now - anim.startTime) / anim.duration);
            const s = springEase(t) * anim.finalScale;
            anim.group.scale.set(s, s, s);
            return t < 1;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  SCENE INIT
    // ─────────────────────────────────────────────────────────────────────────
    function isAvailable() { return typeof THREE !== 'undefined'; }

    function init(containerEl) {
        if (!isAvailable()) { showFallback(containerEl); return; }
        container = containerEl;

        if (initialized) { resize(); C3D.refresh(); return; }

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.FogExp2(0x1a1a2e, 0.045);

        // Camera
        camera = new THREE.PerspectiveCamera(48, container.clientWidth / container.clientHeight, 0.1, 80);
        camera.position.set(7, 6, 9);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Orbit Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.07;
            controls.minPolarAngle = 0.1;
            controls.maxPolarAngle = Math.PI / 2 - 0.02;
            controls.minDistance = 1.5;
            controls.maxDistance = 30;
        }

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        ambientLight.name = 'ambientLight';
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.1);
        dirLight.name = 'dirLight';
        dirLight.position.set(8, 14, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 60;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        dirLight.shadow.mapSize.set(2048, 2048);
        dirLight.shadow.bias = -0.0002;
        scene.add(dirLight);

        // Soft fill from opposite side
        const fillLight = new THREE.DirectionalLight(0x8090bb, 0.35);
        fillLight.position.set(-6, 5, -5);
        scene.add(fillLight);

        buildRoom();
        buildAllFurniture();
        initialized = true;
        animate();
        setup3DDrag();
    }

    function showFallback(containerEl) {
        containerEl.innerHTML = `<div style="display:flex;height:100%;align-items:center;justify-content:center;font-family:Inter,sans-serif;color:#aaa;flex-direction:column;gap:12px;">
      <div style="font-size:2rem;">🧊</div><p>Three.js CDN not loaded — check internet connection.</p></div>`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  ROOM GEOMETRY
    // ─────────────────────────────────────────────────────────────────────────
    function buildRoom() {
        const room = appState.currentRoom;
        const W = room.width, L = room.length, H = room.height;
        const wallColor = new THREE.Color(room.wallColor || '#F0EDE8');
        const floorColor = new THREE.Color(room.floorColor || '#C9A87C');

        ['room_floor', 'room_back', 'room_left'].forEach(n => {
            const obj = scene.getObjectByName(n);
            if (obj) scene.remove(obj);
        });
        // Remove existing windows
        const toRemove = scene.children.filter(c => c.name && c.name.startsWith('window_'));
        toRemove.forEach(w => scene.remove(w));

        // Floor with subtle texture via vertex colors
        const floorMesh = mesh(new THREE.PlaneGeometry(W, L, 10, 10),
            new THREE.MeshPhongMaterial({ color: floorColor, shininess: 25 }));
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.set(W / 2, 0.001, L / 2);
        floorMesh.receiveShadow = true;
        floorMesh.name = 'room_floor';
        scene.add(floorMesh);

        // Back wall
        const bwMesh = mesh(new THREE.PlaneGeometry(W, H),
            new THREE.MeshPhongMaterial({ color: wallColor, shininess: 5 }));
        bwMesh.position.set(W / 2, H / 2, 0);
        bwMesh.receiveShadow = true;
        bwMesh.name = 'room_back';
        scene.add(bwMesh);

        // Left wall
        const lwMesh = mesh(new THREE.PlaneGeometry(L, H),
            new THREE.MeshPhongMaterial({ color: wallColor, shininess: 5 }));
        lwMesh.rotation.y = Math.PI / 2;
        lwMesh.position.set(0, H / 2, L / 2);
        lwMesh.receiveShadow = true;
        lwMesh.name = 'room_left';
        scene.add(lwMesh);


        // Skirting boards
        const skirtMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(wallColor).multiplyScalar(0.75) });
        const skirtH = 0.10;
        [
            { w: W, pos: [W / 2, skirtH / 2, 0.01], ry: 0 },
            { w: L, pos: [0.01, skirtH / 2, L / 2], ry: Math.PI / 2 },
        ].forEach(({ w, pos, ry }) => {
            const sm = mesh(new THREE.BoxGeometry(w, skirtH, 0.02), skirtMat);
            sm.position.set(...pos);
            sm.rotation.y = ry;
            scene.add(sm);
        });

        // Windows
        if (room.windows) {
            room.windows.forEach((win, idx) => {
                const wGroup = makeWindowModel(win.width, win.height);
                wGroup.name = `window_${idx}`;
                if (win.wall === 'back') {
                    wGroup.position.set(win.x * W, win.y, 0.02);
                } else if (win.wall === 'left') {
                    wGroup.rotation.y = Math.PI / 2;
                    wGroup.position.set(0.02, win.y, win.z * L);
                }
                scene.add(wGroup);
            });
        }

        // Reframe camera to room
        camera.position.set(W * 0.85 + 3.5, H + 2.5, L * 0.85 + 3.5);
        camera.lookAt(W / 2, H / 4, L / 2);
        if (controls) controls.target.set(W / 2, H / 4, L / 2);
    }

    function makeWindowModel(width, height) {
        const g = new THREE.Group();
        const frameMat = mat('#F0EDE8');
        const glassMat = mat('#a8d8ea', { transparent: true, opacity: 0.4, shininess: 100 });
        const frameT = 0.06; // frame thickness

        // Glass
        const glass = mesh(new THREE.PlaneGeometry(width - frameT, height - frameT), glassMat);
        g.add(glass);

        // Frame Top/Bottom
        const fH = mesh(new THREE.BoxGeometry(width, frameT, 0.04), frameMat);
        const fTop = fH.clone(); fTop.position.y = height / 2; g.add(fTop);
        const fBot = fH.clone(); fBot.position.y = -height / 2; g.add(fBot);

        // Frame Sides
        const fV = mesh(new THREE.BoxGeometry(frameT, height + frameT, 0.04), frameMat);
        const fLeft = fV.clone(); fLeft.position.x = -width / 2; g.add(fLeft);
        const fRight = fV.clone(); fRight.position.x = width / 2; g.add(fRight);

        // Mullions (cross bars)
        const mullionV = mesh(new THREE.BoxGeometry(0.02, height, 0.02), frameMat);
        g.add(mullionV);
        const mullionH = mesh(new THREE.BoxGeometry(width, 0.02, 0.02), frameMat);
        g.add(mullionH);

        return g;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FURNITURE IN SCENE
    // ─────────────────────────────────────────────────────────────────────────
    function positionGroup(group, item) {
        const room = appState.currentRoom;
        group.position.set(
            item.x * room.width,
            0,
            item.y * room.length
        );
        group.rotation.y = (item.rotation || 0) * Math.PI / 180;
        const s = item.scale || 1;
        group.scale.set(s, s, s);
        group.traverseVisible(child => {
            if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
        });
        group.userData.furnitureId = item.id;
    }

    function addFurnitureMesh(item) {
        const group = buildFurnitureModel(item);
        positionGroup(group, item);
        furnitureMeshes[item.id] = group;
        scene.add(group);
        // Spring animation — scale from 0 → actual scale
        animateDropIn(group, item.scale || 1);
    }

    function removeFurnitureMesh(id) {
        const g = furnitureMeshes[id];
        if (!g) return;
        // Quick shrink-out animation
        const startTime = performance.now();
        const duration = 280;
        const origScale = g.scale.x;
        const shrink = () => {
            const t = Math.min(1, (performance.now() - startTime) / duration);
            const s = origScale * (1 - t);
            g.scale.set(s, s, s);
            if (t < 1) requestAnimationFrame(shrink);
            else scene.remove(g);
        };
        shrink();
        delete furnitureMeshes[id];
        animatingItems = animatingItems.filter(a => a.group !== g);
    }

    function updateFurnitureMesh(item) {
        const existing = furnitureMeshes[item.id];
        if (existing) { scene.remove(existing); delete furnitureMeshes[item.id]; }
        addFurnitureMesh(item);
    }

    function buildAllFurniture() {
        Object.values(furnitureMeshes).forEach(g => scene.remove(g));
        furnitureMeshes = {};
        animatingItems = [];
        appState.placedFurniture.forEach(item => {
            const group = buildFurnitureModel(item);
            positionGroup(group, item);
            furnitureMeshes[item.id] = group;
            scene.add(group);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  LIGHTING CONTROLS (called from editor)
    // ─────────────────────────────────────────────────────────────────────────
    function setAmbientIntensity(v) { const l = scene && scene.getObjectByName('ambientLight'); if (l) l.intensity = v; }
    function setDirIntensity(v) { const l = scene && scene.getObjectByName('dirLight'); if (l) l.intensity = v; }
    function setShadowsEnabled(v) { if (renderer) renderer.shadowMap.enabled = v; }
    function setLightColor(hex) {
        ['ambientLight', 'dirLight'].forEach(name => {
            const l = scene && scene.getObjectByName(name);
            if (l) l.color.set(hex);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  REFRESH & RESIZE
    // ─────────────────────────────────────────────────────────────────────────
    function refresh() {
        if (!initialized) return;
        buildRoom();
        buildAllFurniture();
    }

    function resize() {
        if (!renderer || !container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  ANIMATION LOOP
    // ─────────────────────────────────────────────────────────────────────────
    function animate() {
        if (!initialized) return;
        requestAnimationFrame(animate);
        tickAnimations();
        if (controls) controls.update();
        renderer.render(scene, camera);
    }

    function dispose() {
        initialized = false;
        animatingItems = [];
        if (renderer) {
            renderer.dispose();
            if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        furnitureMeshes = {};
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  3D DRAG-TO-MOVE FURNITURE
    // ─────────────────────────────────────────────────────────────────────────
    const raycaster3D = new THREE.Raycaster();
    const mouse3D = new THREE.Vector2();
    const floorPlane3D = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeHit3D = new THREE.Vector3();

    let drag3D = { active: false, group: null, id: null, offset: new THREE.Vector3() };
    let hovered3D = null;

    function getNDC(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((e.clientY - rect.top) / rect.height) * 2 + 1
        };
    }

    function pickFurnitureGroup(e) {
        const { x, y } = getNDC(e);
        mouse3D.set(x, y);
        raycaster3D.setFromCamera(mouse3D, camera);
        const targets = [];
        Object.values(furnitureMeshes).forEach(g =>
            g.traverse(c => { if (c.isMesh) targets.push(c); })
        );
        const hits = raycaster3D.intersectObjects(targets);
        if (!hits.length) return null;
        let obj = hits[0].object;
        while (obj.parent && !obj.userData.furnitureId) obj = obj.parent;
        return obj.userData.furnitureId ? obj : null;
    }

    function setEmissive(group, on) {
        group.traverse(child => {
            if (!child.isMesh) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
                if (!m.emissive) return;
                if (on) {
                    if (!m._origEmissive) m._origEmissive = m.emissive.clone();
                    m.emissive.set(0x003355);
                    m.emissiveIntensity = 0.5;
                } else {
                    if (m._origEmissive) m.emissive.copy(m._origEmissive);
                    m.emissiveIntensity = 0;
                }
            });
        });
    }

    function on3DDown(e) {
        if (e.button !== 0) return;

        // Immediately disable orbit so it cannot start for this pointer
        if (controls) controls.enabled = false;

        const group = pickFurnitureGroup(e);
        if (!group) {
            if (controls) controls.enabled = true;
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const { x, y } = getNDC(e);
        mouse3D.set(x, y);
        raycaster3D.setFromCamera(mouse3D, camera);

        // Plane at the furniture's current height — works at any camera angle
        const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -group.position.y);
        const worldHit = new THREE.Vector3();
        if (!raycaster3D.ray.intersectPlane(dragPlane, worldHit)) {
            if (controls) controls.enabled = true;
            return;
        }

        drag3D.active = true;
        drag3D.group = group;
        drag3D.id = group.userData.furnitureId;
        drag3D.pointerId = e.pointerId;
        drag3D.offset.set(
            group.position.x - worldHit.x,
            0,
            group.position.z - worldHit.z
        );

        // Lock pointer to canvas so fast movement doesn't escape
        try { renderer.domElement.setPointerCapture(e.pointerId); } catch (_) { }

        renderer.domElement.style.cursor = 'grabbing';
        group.position.y = 0.12;   // lift slightly while dragging
    }

    function on3DMove(e) {
        if (drag3D.active && drag3D.group) {
            const { x, y } = getNDC(e);
            mouse3D.set(x, y);
            raycaster3D.setFromCamera(mouse3D, camera);

            const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.12);
            const worldHit = new THREE.Vector3();
            if (!raycaster3D.ray.intersectPlane(dragPlane, worldHit)) return;

            const room = appState.currentRoom;
            let nx = worldHit.x + drag3D.offset.x;
            let nz = worldHit.z + drag3D.offset.z;
            nx = Math.max(0.1, Math.min(room.width - 0.1, nx));
            nz = Math.max(0.1, Math.min(room.length - 0.1, nz));
            drag3D.group.position.set(nx, 0.12, nz);
        } else {
            // Hover highlight
            const g = pickFurnitureGroup(e);
            if (g !== hovered3D) {
                if (hovered3D) setEmissive(hovered3D, false);
                hovered3D = g;
                if (hovered3D) setEmissive(hovered3D, true);
                renderer.domElement.style.cursor = hovered3D ? 'grab' : 'default';
            }
        }
    }

    function on3DUp(e) {
        if (!drag3D.active) return;
        try { renderer.domElement.releasePointerCapture(drag3D.pointerId); } catch (_) { }

        const group = drag3D.group;
        const id = drag3D.id;

        group.position.y = 0;   // land back on floor

        // Write new position back to appState (normalised 0–1 fractions)
        const room = appState.currentRoom;
        const item = appState.placedFurniture.find(f => f.id === id);
        if (item) {
            item.x = Math.max(0, Math.min(1, group.position.x / room.width));
            item.y = Math.max(0, Math.min(1, group.position.z / room.length));
        }

        if (controls) controls.enabled = true;
        renderer.domElement.style.cursor = hovered3D ? 'grab' : 'default';

        // Keep 2D canvas in sync
        if (typeof C2D !== 'undefined' && typeof C2D.render === 'function') C2D.render();

        drag3D.active = false;
        drag3D.group = null;
        drag3D.id = null;
        drag3D.pointerId = null;
    }

    function setup3DDrag() {
        const el = renderer.domElement;
        // pointerdown capture phase — runs BEFORE OrbitControls' own pointerdown handler
        el.addEventListener('pointerdown', on3DDown, { capture: true });
        el.addEventListener('pointermove', on3DMove);
        el.addEventListener('pointerup', on3DUp);
        el.addEventListener('pointercancel', on3DUp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    return {
        init, refresh, resize, dispose,
        addFurnitureMesh, removeFurnitureMesh, updateFurnitureMesh,
        setAmbientIntensity, setDirIntensity, setShadowsEnabled, setLightColor,
        isAvailable
    };
})();
