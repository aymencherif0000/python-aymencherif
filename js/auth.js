// Gestion de l'authentification
class Auth {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.checkAuth();
    }

    // Charger les utilisateurs depuis le stockage local
    loadUsers() {
        const users = localStorage.getItem('users');
        if (!users) {
            // Créer un admin par défaut si aucun utilisateur n'existe
            const defaultUsers = [{
                username: 'admin',
                password: 'admin123', // À changer en production !
                role: 'admin'
            }];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(users);
    }

    // Vérifier si l'utilisateur est connecté
    checkAuth() {
        const user = sessionStorage.getItem('currentUser');
        if (!user) {
            this.redirectToLogin();
        } else {
            this.currentUser = JSON.parse(user);
        }
    }

    // Rediriger vers la page de connexion
    redirectToLogin() {
        if (!location.pathname.endsWith('login.html')) {
            location.href = 'login.html';
        }
    }

    // Connexion
    login(username, password) {
        const user = this.users.find(u => 
            u.username === username && u.password === password
        );

        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    }

    // Déconnexion
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        this.redirectToLogin();
    }

    // Vérifier si l'utilisateur est admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // Ajouter un nouvel utilisateur (admin uniquement)
    addUser(username, password, role) {
        if (!this.isAdmin()) return false;

        if (this.users.some(u => u.username === username)) {
            return false; // L'utilisateur existe déjà
        }

        const newUser = { username, password, role };
        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        return true;
    }

    // Modifier un utilisateur (admin uniquement)
    updateUser(username, newData) {
        if (!this.isAdmin()) return false;

        const index = this.users.findIndex(u => u.username === username);
        if (index === -1) return false;

        this.users[index] = { ...this.users[index], ...newData };
        localStorage.setItem('users', JSON.stringify(this.users));
        return true;
    }

    // Supprimer un utilisateur (admin uniquement)
    deleteUser(username) {
        if (!this.isAdmin()) return false;

        const index = this.users.findIndex(u => u.username === username);
        if (index === -1) return false;

        this.users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(this.users));
        return true;
    }
}
