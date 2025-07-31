// Gestion de l'interface utilisateur
class UI {
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;
        this.initializeUI();
        this.setupEventListeners();
        this.updateDateTime();
        this.refreshEmployeesList();
        this.updateFilters();
    }

    // Initialisation de l'interface
    initializeUI() {
        // Mise à jour de l'horloge toutes les secondes
        setInterval(() => this.updateDateTime(), 1000);

        // Cacher les fonctionnalités admin si l'utilisateur n'est pas admin
        if (!this.auth.isAdmin()) {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    // Configuration des écouteurs d'événements
    setupEventListeners() {
        // Recherche
        document.getElementById('search-input').addEventListener('input', 
            e => this.handleSearch(e.target.value)
        );

        // Filtres
        document.querySelectorAll('.filters select').forEach(select => {
            select.addEventListener('change', () => this.handleSearch());
        });

        // Boutons d'action
        document.getElementById('btn-add-employee').addEventListener('click', 
            () => this.showEmployeeModal()
        );
        document.getElementById('btn-export-csv').addEventListener('click', 
            () => this.exportToCSV()
        );
        document.getElementById('btn-export-pdf').addEventListener('click', 
            () => this.exportToPDF()
        );
        document.getElementById('btn-settings').addEventListener('click', 
            () => this.showSettingsModal()
        );
        document.getElementById('btn-import').addEventListener('click', () => {
            // Crée un input file caché pour sélectionner le fichier
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.txt';
            input.style.display = 'none';
            input.addEventListener('change', (e) => {
                if (input.files.length > 0) {
                    const file = input.files[0];
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        alert('Fichier importé : ' + file.name + '\nContenu :\n' + evt.target.result.substring(0, 200));
                        // Ici, vous pouvez ajouter la logique pour traiter le contenu du fichier
                    };
                    reader.readAsText(file);
                }
            });
            document.body.appendChild(input);
            input.click();
            setTimeout(() => document.body.removeChild(input), 1000);
        });

        // Formulaire employé
        document.getElementById('employee-form').addEventListener('submit', 
            e => this.handleEmployeeSubmit(e)
        );

        // Thème
        document.getElementById('theme-light').addEventListener('click', 
            () => this.setTheme('light')
        );
        document.getElementById('theme-dark').addEventListener('click', 
            () => this.setTheme('dark')
        );

        // Fermeture des modales
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', e => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal);
            });
        });

        // Ajout utilisateur
        const addUserBtn = document.getElementById('add-user');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                if (!this.auth.isAdmin()) return;
                const username = prompt('Nom d\'utilisateur :');
                if (!username) return;
                const password = prompt('Mot de passe :');
                if (!password) return;
                const role = prompt('Rôle (admin ou user) :', 'user');
                if (!role || (role !== 'admin' && role !== 'user')) return alert('Rôle invalide');
                if (this.auth.addUser(username, password, role)) {
                    alert('Utilisateur ajouté !');
                    this.showSettingsModal();
                } else {
                    alert('Erreur : utilisateur existant ou droits insuffisants.');
                }
            });
        }
    }

    // Mise à jour de la date et l'heure
    updateDateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('fr-FR');
        document.getElementById('current-datetime').textContent = 
            `${dateStr} ${timeStr}`;
    }

    // Mise à jour de la liste des employés
    refreshEmployeesList(employees = this.db.employees) {
        const tbody = document.getElementById('employees-list');
        tbody.innerHTML = '';

        employees.forEach(employee => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', (e) => {
                // Empêche le clic sur les boutons d'action d'ouvrir la fiche
                if (e.target.closest('button')) return;
                this.showEmployeeCard(employee.matricule);
            });
            // Calcul de la durée du travail (robuste)
            let duree = '';
            if (employee.dateRecrutement) {
                const dateRec = new Date(employee.dateRecrutement);
                if (!isNaN(dateRec.getTime())) {
                    const today = new Date();
                    let years = today.getFullYear() - dateRec.getFullYear();
                    let months = today.getMonth() - dateRec.getMonth();
                    let days = today.getDate() - dateRec.getDate();
                    if (days < 0) {
                        months--;
                        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
                    }
                    if (months < 0) {
                        years--;
                        months += 12;
                    }
                    duree = `${years} an${years>1?'s':''} ${months} mois`;
                }
            }
            tr.innerHTML = `
                <td>${employee.matricule}</td>
                <td>${employee.nom}</td>
                <td>${employee.prenom}</td>
                <td>${employee.email || ''}</td>
                <td>${employee.service || ''}</td>
                <td>${employee.telPortable || ''}</td>
                <td>${employee.telFixe || ''}</td>
                <td>${duree}</td>
                <td>
                    ${this.auth.isAdmin() ? `<button class="btn admin-only" onclick="ui.showEmployeeModal('${employee.matricule}');event.stopPropagation();"><i class="fas fa-edit"></i></button>` : ''}
                    ${this.auth.isAdmin() ? `<button class="btn" onclick="ui.confirmDeleteEmployee('${employee.matricule}');event.stopPropagation();"><i class="fas fa-trash"></i></button>` : ''}
                    <button class="btn" onclick="ui.printBadge('${employee.matricule}');event.stopPropagation();">
                        <i class="fas fa-id-badge"></i>
                    </button>
                    <a class="btn" href="mailto:${employee.email}" onclick="event.stopPropagation();">
                        <i class="fas fa-envelope"></i>
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Affiche la carte de visite de l'employé
    showEmployeeCard(matricule) {
        const emp = this.db.employees.find(e => e.matricule === matricule);
        if (!emp) return;
        // Remplir les champs du modal
        document.getElementById('card-matricule').textContent = emp.matricule || '';
        document.getElementById('card-nom').textContent = emp.nom || '';
        document.getElementById('card-prenom').textContent = emp.prenom || '';
        document.getElementById('card-poste').textContent = emp.poste || '';
        document.getElementById('card-service').textContent = emp.service || '';
        document.getElementById('card-departement').textContent = emp.departement || '';
        document.getElementById('card-tel-fixe').textContent = emp.telFixe || '';
        document.getElementById('card-tel-portable').textContent = emp.telPortable || '';
        document.getElementById('card-email').textContent = emp.email || '';
        document.getElementById('card-date-recrutement').textContent = emp.dateRecrutement || '';
        document.getElementById('card-genre').textContent = emp.genre === 'H' ? 'Homme' : (emp.genre === 'F' ? 'Femme' : '');
        
        // Ajout d'un retour à la ligne tous les 25 caractères pour la remarque, affichage multi-ligne
        function wrapText(text, maxLen) {
            if (!text) return '';
            return text.replace(new RegExp(`(.{1,${maxLen}})`, 'g'), '$1\n');
        }
        document.getElementById('card-remarques').innerText = wrapText(emp.remarques, 25);
        
        // Photo
        const photoImg = document.getElementById('card-photo-img');
        if (emp.photo) {
            photoImg.src = emp.photo;
            photoImg.style.display = '';
        } else {
            photoImg.src = '';
            photoImg.style.display = 'none';
        }
        document.getElementById('card-date-naissance').textContent = emp.dateNaissance || '';
        document.getElementById('employee-card-modal').style.display = 'block';
    }

    // Mise à jour des filtres
    updateFilters() {
        const fields = ['poste', 'service', 'departement'];
        fields.forEach(field => {
            const select = document.getElementById(`filter-${field}`);
            const values = this.db.getFilterValues(field);
            
            select.innerHTML = `<option value="">Tous les ${field}s</option>`;
            values.forEach(value => {
                select.innerHTML += `<option value="${value}">${value}</option>`;
            });
        });
    }

    // Gestion de la recherche et des filtres
    handleSearch(searchQuery = document.getElementById('search-input').value) {
        const filters = {
            poste: document.getElementById('filter-poste').value,
            service: document.getElementById('filter-service').value,
            departement: document.getElementById('filter-departement').value,
            genre: document.getElementById('filter-genre').value
        };

        const filteredEmployees = this.db.searchEmployees(searchQuery, filters);
        this.refreshEmployeesList(filteredEmployees);
    }

    // Affichage du modal employé
    showEmployeeModal(matricule = null) {
        const modal = document.getElementById('employee-modal');
        const form = document.getElementById('employee-form');
        const title = modal.querySelector('.modal-header h2');

        if (matricule) {
            const employee = this.db.employees.find(e => e.matricule === matricule);
            title.textContent = 'Modifier un employé';
            // Remplir le formulaire (tous les champs, même s'ils n'existent pas dans l'objet)
            [
                'matricule','nom','prenom','genre','telFixe','telPortable','email','poste','service','departement','dateRecrutement','dateNaissance','remarques'
            ].forEach(key => {
                const input = form.querySelector(`#${key}`);
                if (input) input.value = employee[key] || '';
            });
            // Stocker la photo actuelle dans un data-attribute pour la conserver si non modifiée
            form.dataset.photo = employee.photo || '';
            form.dataset.matricule = matricule;
        } else {
            title.textContent = 'Ajouter un employé';
            form.reset();
            form.dataset.matricule = '';
            form.dataset.photo = '';
        }
        modal.style.display = 'block';
    }

    // Soumission du formulaire employé
    handleEmployeeSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const matricule = form.dataset.matricule || form.matricule.value;

        // Gestion de la photo (conversion en base64 si nouvelle photo sélectionnée)
        const fileInput = form.querySelector('#photo');
        const file = fileInput && fileInput.files && fileInput.files[0];
        // Toujours inclure le champ photo, même vide
        const processAndSave = (photoData) => {
            const employee = {
                matricule: form.matricule.value,
                nom: form.nom.value,
                prenom: form.prenom.value,
                genre: form.genre.value,
                telFixe: form.telFixe.value,
                telPortable: form.telPortable.value,
                email: form.email.value,
                poste: form.poste.value,
                service: form.service.value,
                departement: form.departement.value,
                dateRecrutement: form.dateRecrutement.value,
                dateNaissance: form.dateNaissance.value,
                remarques: form.remarques.value,
                photo: (typeof photoData !== 'undefined') ? photoData : (form.dataset.photo || '')
            };
            if (!employee.photo) employee.photo = '';
            if (form.dataset.matricule) {
                this.db.updateEmployee(matricule, employee);
            } else {
                this.db.addEmployee(employee);
            }
            this.closeModal(document.getElementById('employee-modal'));
            this.refreshEmployeesList();
            this.updateFilters();
        };
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                processAndSave(evt.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            processAndSave();
        }
    }

    // Confirmation de suppression d'un employé
    confirmDeleteEmployee(matricule) {
        if (!this.auth.isAdmin()) return;

        const employee = this.db.employees.find(e => e.matricule === matricule);
        if (confirm(`Voulez-vous vraiment supprimer l'employé ${employee.prenom} ${employee.nom} ?`)) {
            this.db.deleteEmployee(matricule);
            this.refreshEmployeesList();
            this.updateFilters();
        }
    }

    // Export CSV
    exportToCSV() {
        const csvContent = this.db.exportToCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'employees.csv';
        link.click();
    }

    // Export PDF
    exportToPDF() {
        // Utilisation de jsPDF pour exporter le tableau des employés
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let y = 10;
        doc.setFontSize(12);
        doc.text('Liste des employés', 10, y);
        y += 10;
        this.db.employees.forEach(emp => {
            let x = 10;
            doc.setFont(undefined, 'bold');
            doc.text(`Matricule :`, x, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.matricule || ''), x + 30, y);
            doc.setFont(undefined, 'bold');
            doc.text(`Nom :`, x + 70, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.nom || ''), x + 90, y);
            doc.setFont(undefined, 'bold');
            doc.text(`Prénom :`, x + 120, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.prenom || ''), x + 145, y);
            y += 8;
            doc.setFont(undefined, 'bold');
            doc.text(`Poste :`, x, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.poste || ''), x + 30, y);
            doc.setFont(undefined, 'bold');
            doc.text(`Service :`, x + 70, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.service || ''), x + 95, y);
            doc.setFont(undefined, 'bold');
            doc.text(`Département :`, x + 120, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.departement || ''), x + 155, y);
            y += 8;
            doc.setFont(undefined, 'bold');
            doc.text(`Genre :`, x, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.genre || ''), x + 25, y);
            doc.setFont(undefined, 'bold');
            doc.text(`Date de naissance :`, x + 50, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.dateNaissance || ''), x + 95, y);
            doc.setFont(undefined, 'bold');
            doc.text(`Date recrutement :`, x + 120, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.dateRecrutement || ''), x + 160, y);
            y += 8;
            doc.setFont(undefined, 'bold');
            doc.text(`Email :`, x, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.email || ''), x + 25, y);
            doc.setFont(undefined, 'bold');
            doc.text(`Tél. Fixe :`, x + 70, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.telFixe || ''), x + 95, y);
            doc.setFont(undefined, 'bold');
            doc.text(`Tél. Portable :`, x + 120, y); doc.setFont(undefined, 'normal'); doc.text(String(emp.telPortable || ''), x + 155, y);
            y += 8;
            // Remarques avec retour à la ligne tous les 25 caractères
            doc.setFont(undefined, 'bold');
            doc.text(`Remarques :`, x, y);
            doc.setFont(undefined, 'normal');
            let remarques = String(emp.remarques || '');
            let remarquesLines = remarques.match(/.{1,25}/g) || [''];
            let remarquesY = y;
            remarquesLines.forEach((line, idx) => {
                doc.text(line, x + 30, remarquesY + idx * 7);
            });
            // Photo positionnée à droite, centrée verticalement sur la section remarques
            let photoHeight = 40;
            let photoWidth = 32;
            let photoY = y + Math.max(0, ((remarquesLines.length * 7) - photoHeight) / 2);
            if (emp.photo) {
                try {
                    doc.addImage(emp.photo, 'JPEG', 160, photoY, photoWidth, photoHeight);
                } catch (e) {
                    doc.text('Photo', 160, photoY + 10);
                }
            }
            y += Math.max(remarquesLines.length * 7, photoHeight) + 5;
            doc.setDrawColor(180);
            doc.line(10, y, 200, y); // séparateur
            y += 8;
            if (y > 260) {
                doc.addPage();
                y = 10;
            }
        });
        doc.save('employes.pdf');
    }

    // Impression du badge
    printBadge(matricule) {
        const employee = this.db.employees.find(e => e.matricule === matricule);
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Badge - ${employee.prenom} ${employee.nom}</title>
                <style>
                    .badge {
                        display: inline-block;
                        min-width: 8.5cm;
                        max-width: 12cm;
                        border: 1px solid #000;
                        padding: 10px;
                        margin: 20px auto;
                        text-align: left;
                        background: #fff;
                        box-sizing: border-box;
                        font-size: 15px;
                    }
                    .badge-info {
                        width: 100%;
                    }
                    .photo {
                        width: 100px;
                        height: 120px;
                        margin: 10px auto;
                        border: 1px solid #ccc;
                        background: #f0f0f0;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                </style>
            </head>
            <body>
                <div class="badge">
                    <div class="badge-info" style="text-align:left;display:flex;gap:16px;align-items:flex-start;">
                        <div style="flex:1;">
                            <div><strong>Matricule :</strong> ${employee.matricule || ''}</div>
                            <div><strong>Nom :</strong> ${employee.nom || ''}</div>
                            <div><strong>Prénom :</strong> ${employee.prenom || ''}</div>
                            <div><strong>Poste :</strong> ${employee.poste || ''}</div>
                            <div><strong>Service :</strong> ${employee.service || ''}</div>
                            <div><strong>Département :</strong> ${employee.departement || ''}</div>
                            <div><strong>Téléphone fixe :</strong> ${employee.telFixe || ''}</div>
                            <div><strong>Téléphone portable :</strong> ${employee.telPortable || ''}</div>
                            <div><strong>Email :</strong> ${employee.email || ''}</div>
                            <div><strong>Date de recrutement :</strong> ${employee.dateRecrutement || ''}</div>
                            <div><strong>Date de naissance :</strong> ${employee.dateNaissance || ''}</div>
                            <div><strong>Genre :</strong> ${employee.genre === 'H' ? 'Homme' : (employee.genre === 'F' ? 'Femme' : '')}</div>
                            <div><strong>Remarques :</strong><br><span style="white-space:pre-line;word-break:break-word;">${(employee.remarques||'').replace(/(.{25})/g,'$1\n')}</span></div>
                        </div>
                        <div class="photo" style="flex:0 0 100px;text-align:center;">
                            ${employee.photo ? `<img src="${employee.photo}" alt="Photo" style="width:100px;height:120px;object-fit:cover;border-radius:8px;border:1.5px solid #bbb;background:#f4f4f4;box-shadow:0 2px 8px #0001;" />` : 'Photo'}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    // Affichage du modal paramètres
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const usersList = document.getElementById('users-list');

        // Mise à jour de la liste des utilisateurs
        if (this.auth.isAdmin()) {
            usersList.innerHTML = this.auth.users.map(user => `
                <div class="user-item">
                    <span>${user.username} (${user.role})</span>
                    <button class="btn" onclick="ui.editUser('${user.username}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn" onclick="ui.deleteUser('${user.username}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        modal.style.display = 'block';
    }

    // Gestion du thème
    setTheme(theme) {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
        localStorage.setItem('theme', theme);
    }

    // Gestion des utilisateurs
    editUser(username) {
        if (!this.auth.isAdmin()) return;

        const newPassword = prompt('Nouveau mot de passe :', '');
        if (newPassword) {
            this.auth.updateUser(username, { password: newPassword });
        }
    }

    deleteUser(username) {
        if (!this.auth.isAdmin()) return;

        if (confirm(`Voulez-vous vraiment supprimer l'utilisateur ${username} ?`)) {
            this.auth.deleteUser(username);
            this.showSettingsModal(); // Rafraîchir la liste
        }
    }

    // Fermeture des modales
    closeModal(modal) {
        modal.style.display = 'none';
    }
}

// Fermer le modal fiche employé
window.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.getElementById('close-card-modal');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById('employee-card-modal').style.display = 'none';
        };
    }
    // Fermer en cliquant en dehors du contenu
    window.onclick = function(event) {
        const modal = document.getElementById('employee-card-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
