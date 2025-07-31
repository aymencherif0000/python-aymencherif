// Point d'entrée de l'application
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation des classes principales
    const auth = new Auth();
    const db = new Database();
    window.ui = new UI(db, auth); // Rendre l'UI accessible globalement

    // Appliquer le thème sauvegardé
    const savedTheme = localStorage.getItem('theme') || 'light';
    ui.setTheme(savedTheme);

    // Gestion du bouton Sign Out
    const signOutBtn = document.getElementById('btn-signout');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            auth.logout();
        });
    }
});
