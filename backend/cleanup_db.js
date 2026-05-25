const db = require('./config/db');

async function cleanup() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await db.getConnection();

        console.log('Disabling foreign key checks...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Drop required_skills column from jobs table if it exists
        console.log('Altering jobs table...');
        const [jobCols] = await connection.execute('DESCRIBE jobs');
        const jobColNames = jobCols.map(c => c.Field);
        if (jobColNames.includes('required_skills')) {
            await connection.execute('ALTER TABLE jobs DROP COLUMN required_skills');
            console.log('Dropped required_skills from jobs.');
        } else {
            console.log('required_skills already dropped or not present in jobs.');
        }

        // 2. Alter candidates table (drop photo_path, phone, experience_years, education, work_experience_timeline, github, location, title)
        console.log('Altering candidates table...');
        const [candCols] = await connection.execute('DESCRIBE candidates');
        const candColNames = candCols.map(c => c.Field);
        
        const dropCols = [];
        if (candColNames.includes('photo_path')) dropCols.push('DROP COLUMN photo_path');
        if (candColNames.includes('phone')) dropCols.push('DROP COLUMN phone');
        if (candColNames.includes('experience_years')) dropCols.push('DROP COLUMN experience_years');
        if (candColNames.includes('education')) dropCols.push('DROP COLUMN education');
        if (candColNames.includes('work_experience_timeline')) dropCols.push('DROP COLUMN work_experience_timeline');
        if (candColNames.includes('github')) dropCols.push('DROP COLUMN github');
        if (candColNames.includes('location')) dropCols.push('DROP COLUMN location');
        if (candColNames.includes('title')) dropCols.push('DROP COLUMN title');

        if (dropCols.length > 0) {
            await connection.execute(`ALTER TABLE candidates ${dropCols.join(', ')}`);
            console.log(`Dropped columns from candidates: ${dropCols.join(', ')}`);
        }

        // Ensure avatar_url exists
        const [updatedCandCols] = await connection.execute('DESCRIBE candidates');
        const updatedCandColNames = updatedCandCols.map(c => c.Field);
        if (!updatedCandColNames.includes('avatar_url')) {
            await connection.execute('ALTER TABLE candidates ADD COLUMN avatar_url varchar(255) DEFAULT NULL');
            console.log('Added avatar_url to candidates.');
        }
        
        // Ensure department exists
        if (!updatedCandColNames.includes('department')) {
            await connection.execute('ALTER TABLE candidates ADD COLUMN department varchar(100) DEFAULT NULL');
            console.log('Added department to candidates.');
        }

        // 3. Create otps table
        console.log('Creating otps table if not exists...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS \`otps\` (
              \`id\` int NOT NULL AUTO_INCREMENT,
              \`email\` varchar(100) NOT NULL,
              \`otp_code\` varchar(6) NOT NULL,
              \`purpose\` varchar(50) NOT NULL,
              \`expires_at\` datetime NOT NULL,
              \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('otps table ready.');

        // 4. Truncate / clear data (except user ID 1)
        console.log('Cleaning up table data...');
        await connection.execute('TRUNCATE TABLE screening_results');
        await connection.execute('TRUNCATE TABLE resumes');
        await connection.execute('TRUNCATE TABLE jobs');
        await connection.execute('TRUNCATE TABLE candidates');
        await connection.execute('TRUNCATE TABLE otps');

        // Delete all users except ID 1 (Rishav Mandal)
        await connection.execute('DELETE FROM users WHERE id > 1');
        console.log('Users cleaned up ( Rishav Mandal preserved).');

        // Make sure user ID 1 is active and clean
        await connection.execute("UPDATE users SET is_active = 1, company_name = NULL WHERE id = 1");

        console.log('Enabling foreign key checks...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Database cleanup completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error during db cleanup:', err);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}

cleanup();
