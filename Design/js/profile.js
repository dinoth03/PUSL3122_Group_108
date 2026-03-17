// profile.js — User Profile functionality

class ProfileManager {
    constructor() {
        this.isEditMode = false;
        this.originalData = {};
        this.init();
    }

    async init() {
        this.attachEventListeners();
        await this.loadProfile();
    }

    attachEventListeners() {
        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const profileForm = document.getElementById('profileForm');
        const togglePasswordBtn = document.getElementById('togglePassword');

        editBtn.addEventListener('click', () => this.enterEditMode());
        cancelBtn.addEventListener('click', () => this.exitEditMode());
        profileForm.addEventListener('submit', (e) => this.handleSubmit(e));
        togglePasswordBtn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
    }

    async loadProfile() {
        try {
            const response = await fetch('api/profile.php?action=get');
            const data = await response.json();

            if (data.success) {
                this.displayProfile(data.user);
                this.originalData = { ...data.user };
            } else {
                this.showError(data.error || 'Failed to load profile');
                // Redirect to login if unauthorized
                if (response.status === 401) {
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Failed to load profile. Please try again.');
        }
    }

    displayProfile(user) {
        document.getElementById('name').value = user.name;
        document.getElementById('email').value = user.email;

        // Hide loading indicator and show form
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('profileForm').style.display = 'block';
    }

    enterEditMode() {
        this.isEditMode = true;

        // Store original values
        this.originalData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: ''
        };

        // Enable all inputs
        document.getElementById('name').disabled = false;
        document.getElementById('email').disabled = false;
        document.getElementById('password').disabled = false;

        // Toggle button visibility
        document.getElementById('editBtn').style.display = 'none';
        document.getElementById('editActions').style.display = 'flex';

        // Change form styling to edit mode
        const form = document.getElementById('profileForm');
        form.classList.add('edit-mode');
        form.classList.remove('view-mode');
    }

    exitEditMode() {
        this.isEditMode = false;

        // Restore original values
        document.getElementById('name').value = this.originalData.name;
        document.getElementById('email').value = this.originalData.email;
        document.getElementById('password').value = '';

        // Disable all inputs
        document.getElementById('name').disabled = true;
        document.getElementById('email').disabled = true;
        document.getElementById('password').disabled = true;

        // Reset password visibility
        document.getElementById('password').type = 'password';
        document.getElementById('togglePassword').textContent = 'Show';

        // Toggle button visibility
        document.getElementById('editBtn').style.display = 'block';
        document.getElementById('editActions').style.display = 'none';

        // Change form styling to view mode
        const form = document.getElementById('profileForm');
        form.classList.remove('edit-mode');
        form.classList.add('view-mode');

        this.clearAlerts();
    }

    async handleSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validation
        if (!name) {
            this.showError('Name is required');
            return;
        }

        if (!email) {
            this.showError('Email is required');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        await this.submitUpdate(name, email, password);
    }

    async submitUpdate(name, email, password) {
        try {
            const submitBtn = document.querySelector('#profileForm button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            const formData = new FormData();
            formData.append('action', 'update');
            formData.append('name', name);
            formData.append('email', email);
            if (password) {
                formData.append('password', password);
            }

            const response = await fetch('api/profile.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess(data.message || 'Profile updated successfully');

                // Update original data
                this.originalData.name = name;
                this.originalData.email = email;

                // Exit edit mode after 1.5 seconds
                setTimeout(() => {
                    this.exitEditMode();
                }, 1500);
            } else {
                this.showError(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('An error occurred while updating your profile');
        } finally {
            const submitBtn = document.querySelector('#profileForm button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    }

    togglePasswordVisibility(e) {
        e.preventDefault();
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePassword');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = 'Hide';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = 'Show';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showSuccess(message) {
        const alert = document.getElementById('successAlert');
        alert.textContent = message;
        alert.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
        }, 5000);
    }

    showError(message) {
        const alert = document.getElementById('errorAlert');
        alert.textContent = message;
        alert.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
        }, 5000);
    }

    clearAlerts() {
        document.getElementById('successAlert').classList.remove('show');
        document.getElementById('errorAlert').classList.remove('show');
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});
