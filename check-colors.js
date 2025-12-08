const { userHorseOps } = require('./server/db/database');

console.log('=== Checking user_horses label_color ===\n');

const horses = userHorseOps.findByUserId.all(1); // Get horses for user 1

horses.forEach(horse => {
    console.log(`ID: ${horse.id}, Name: "${horse.horse_name}", Color: ${horse.label_color || 'NULL'}`);
});

console.log(`\nTotal horses: ${horses.length}`);
