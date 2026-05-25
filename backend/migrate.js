const db = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // 1. Drop notifications table
        console.log('Dropping notifications table if exists...');
        await db.execute('DROP TABLE IF EXISTS notifications');
        console.log('notifications table dropped.');

        // 2. Remove columns from candidates table
        console.log('Dropping phone, experience_years, education, work_experience_timeline from candidates table...');
        
        // Let's verify existing columns first to avoid crashes on re-runs
        const [columns] = await db.execute('DESCRIBE candidates');
        const colNames = columns.map(c => c.Field);
        
        const dropQueries = [];
        if (colNames.includes('phone')) dropQueries.push('DROP COLUMN phone');
        if (colNames.includes('experience_years')) dropQueries.push('DROP COLUMN experience_years');
        if (colNames.includes('education')) dropQueries.push('DROP COLUMN education');
        if (colNames.includes('work_experience_timeline')) dropQueries.push('DROP COLUMN work_experience_timeline');
        
        if (dropQueries.length > 0) {
            const sql = `ALTER TABLE candidates ${dropQueries.join(', ')}`;
            await db.execute(sql);
            console.log('Candidates columns dropped successfully.');
        } else {
            console.log('No candidate columns need to be dropped.');
        }
        
        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
