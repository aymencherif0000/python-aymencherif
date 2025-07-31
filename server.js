// Serveur Node.js Express pour la gestion des employés dans un fichier JSON
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'employes.json');

app.use(express.json());
app.use(express.static(__dirname)); // Sert les fichiers statiques (HTML, JS, CSS)

// Helper pour lire/écrire le fichier JSON
function readEmployees() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function writeEmployees(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// API : liste des employés
app.get('/api/employees', (req, res) => {
    res.json(readEmployees());
});

// API : ajouter un employé
app.post('/api/employees', (req, res) => {
    const employees = readEmployees();
    const emp = req.body;
    if (!emp.matricule || !emp.nom || !emp.prenom) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    // Ajout automatique de la photo si une image existe dans le dossier images avec le même matricule
    const imagePath = path.join(__dirname, 'images', `${emp.matricule}.jpg`);
    if (fs.existsSync(imagePath)) {
        const imgData = fs.readFileSync(imagePath);
        emp.photo = `data:image/jpeg;base64,${imgData.toString('base64')}`;
    }
    employees.push(emp);
    writeEmployees(employees);
    res.json(emp);
});

// API : modifier un employé
app.put('/api/employees/:matricule', (req, res) => {
    const employees = readEmployees();
    const idx = employees.findIndex(e => e.matricule === req.params.matricule);
    if (idx === -1) return res.status(404).json({ error: 'Employé non trouvé' });
    employees[idx] = { ...employees[idx], ...req.body, matricule: employees[idx].matricule };
    writeEmployees(employees);
    res.json(employees[idx]);
});

// API : supprimer un employé
app.delete('/api/employees/:matricule', (req, res) => {
    let employees = readEmployees();
    const len = employees.length;
    employees = employees.filter(e => e.matricule !== req.params.matricule);
    if (employees.length === len) return res.status(404).json({ error: 'Employé non trouvé' });
    writeEmployees(employees);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
