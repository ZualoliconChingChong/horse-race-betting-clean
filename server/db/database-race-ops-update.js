// This file contains the updated raceOps section to add into database.js
// Copy this and replace the existing raceOps section

// Helper function to generate next serial number
function generateRaceSerial(db) {
    const result = db.exec('SELECT serial FROM races WHERE serial IS NOT NULL ORDER BY id DESC LIMIT 1');
    
    if (!result.length || !result[0].values.length) {
        return 'LB-001';
    }
    
    const lastSerial = result[0].values[0][0];
    const match = lastSerial.match(/LB-(\d+)/);
    
    if (!match) {
        return 'LB-001';
    }
    
    const nextNum = parseInt(match[1], 10) + 1;
    return `LB-${String(nextNum).padStart(3, '0')}`;
}

// Race operations
const raceOps = {
    create: {
        run: (status, mapData, registrationStart, registrationEnd, createdBy, name = null) => {
            const serial = generateRaceSerial(db);
            db.run(
                'INSERT INTO races (status, map_data, registration_start, registration_end, created_by, name, serial) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [status, mapData, registrationStart, registrationEnd, createdBy, name, serial]
            );
            return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
        }
    },
    findById: {
        get: (id) => toObjects(db.exec('SELECT * FROM races WHERE id = ?', [id]))[0]
    },
    findActive: {
        all: () => toObjects(db.exec("SELECT * FROM races WHERE status IN ('waiting', 'registration', 'running') ORDER BY created_at DESC"))
    },
    findRecent: {
        all: () => toObjects(db.exec('SELECT * FROM races ORDER BY created_at DESC LIMIT 20'))
    },
    updateStatus: {
        run: (status, id) => db.run('UPDATE races SET status = ? WHERE id = ?', [status, id])
    },
    updateResults: {
        run: (results, raceEnd, id) => db.run("UPDATE races SET status = 'finished', results = ?, race_end = ? WHERE id = ?", [results, raceEnd, id])
    },
    updatePool: {
        run: (amount, id) => db.run('UPDATE races SET total_pool = total_pool + ? WHERE id = ?', [amount, id])
    },
    startRace: {
        run: (raceStart, id) => db.run("UPDATE races SET status = 'running', race_start = ? WHERE id = ?", [raceStart, id])
    },
    updateMapData: {
        run: (mapData, id) => db.run('UPDATE races SET map_data = ? WHERE id = ?', [mapData, id])
    },
    updateName: {
        run: (name, id) => db.run('UPDATE races SET name = ? WHERE id = ?', [name, id])
    }
};
