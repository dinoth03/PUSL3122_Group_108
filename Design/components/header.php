<?php
// header.php — Reusable header component
?>
<header class="main-header">
    <div class="header-content">
        <div class="brand">
            <i class="fas fa-couch"></i>
            <h1>Design <span>Compiler</span></h1>
        </div>
        <nav class="main-nav">
            <ul>
                <li><a href="editor.html"><i class="fas fa-edit"></i> Editor</a></li>
                <li><a href="designs.html"><i class="fas fa-folder"></i> My Designs</a></li>
                <li><a href="rooms.html"><i class="fas fa-door-open"></i> Rooms</a></li>
                <li id="user-profile">
                    <span id="header-user-name">Guest</span>
                    <a href="profile.html" id="profileBtn" title="View Profile"><i class="fas fa-user-circle"></i></a>
                    <button id="logoutBtn" onclick="authLogout()"><i class="fas fa-sign-out-alt"></i></button>
                </li>
            </ul>
        </nav>
    </div>
</header>
