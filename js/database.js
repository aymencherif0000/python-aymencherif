// Version Node.js : gestion des employés via API REST
class Database {
    constructor() {
        this.employees = [];
        this.loadEmployees();
    }

    async loadEmployees() {
        const res = await fetch('/api/employees');
        this.employees = await res.json();
        if (window.ui) window.ui.refreshEmployeesList(this.employees);
    }

    async addEmployee(employee) {
        const res = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employee)
        });
        if (res.ok) {
            const emp = await res.json();
            this.employees.push(emp);
            if (window.ui) window.ui.refreshEmployeesList(this.employees);
            return emp;
        }
        return null;
    }

    async updateEmployee(matricule, newData) {
        const res = await fetch(`/api/employees/${matricule}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
        });
        if (res.ok) {
            const emp = await res.json();
            const idx = this.employees.findIndex(e => e.matricule === matricule);
            if (idx !== -1) this.employees[idx] = emp;
            if (window.ui) window.ui.refreshEmployeesList(this.employees);
            return true;
        }
        return false;
    }

    async deleteEmployee(matricule) {
        const res = await fetch(`/api/employees/${matricule}`, { method: 'DELETE' });
        if (res.ok) {
            this.employees = this.employees.filter(e => e.matricule !== matricule);
            if (window.ui) window.ui.refreshEmployeesList(this.employees);
            return true;
        }
        return false;
    }

    searchEmployees(query = '', filters = {}) {
        return this.employees.filter(employee => {
            const searchString = `${employee.matricule} ${employee.nom} ${employee.prenom} ${employee.poste} ${employee.service} ${employee.departement}`.toLowerCase();
            if (!searchString.includes(query.toLowerCase())) return false;
            for (const [key, value] of Object.entries(filters)) {
                if (value && employee[key] !== value) return false;
            }
            return true;
        });
    }

    getFilterValues(field) {
        const values = new Set(this.employees.map(e => e[field]).filter(Boolean));
        return Array.from(values).sort();
    }

    exportToCSV() {
        const headers = [
            'Matricule', 'Nom', 'Prénom', 'Genre', 'Email', 
            'Téléphone Fixe', 'Téléphone Portable', 'Poste', 
            'Service', 'Département', 'Date de Recrutement', 'Date de Naissance', 'Remarques', 'Photo (base64)'
        ];
        const rows = this.employees.map(e => [
            e.matricule,
            e.nom,
            e.prenom,
            e.genre,
            e.email || '',
            e.telFixe || '',
            e.telPortable || '',
            e.poste || '',
            e.service || '',
            e.departement || '',
            e.dateRecrutement || '',
            e.dateNaissance || '',
            (e.remarques || '').replace(/\n/g, ' '),
            e.photo || ''
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => '"' + String(val).replace(/"/g, '""') + '"').join(','))
        ].join('\n');
        return csvContent;
    }

    importFromCSV(csvContent) {
        // À adapter si besoin
    }
}
