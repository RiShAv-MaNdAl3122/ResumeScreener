const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    try {
        console.log('Auth login attempt, body:', req.body);
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Missing email or password' });

        const connection = await db.getConnection();
        // Query minimal guaranteed columns including is_active.
        const [rows] = await connection.execute('SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1', [email]);
        console.log('Auth DB rows:', rows && rows.length ? { id: rows[0].id, email: rows[0].email, is_active: rows[0].is_active } : rows);
        connection.release();

        if (!rows || rows.length === 0) return res.status(401).json({ success: false, message: 'Invalid email or password' });
        const user = rows[0];

        // Check if the user account is active
        if (!user.is_active) return res.status(403).json({ success: false, message: 'Account inactive' });

        if (!user.password_hash) {
            console.error('Auth login error: missing password_hash for user', user.email);
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        console.log('Auth: password_hash present:', Boolean(user.password_hash));
        let match = false;
        try {
            match = await bcrypt.compare(password, user.password_hash);
        } catch (bcryptErr) {
            console.error('Auth login bcrypt error:', bcryptErr && bcryptErr.stack ? bcryptErr.stack : bcryptErr);
            return res.status(500).json({ success: false, message: 'Login failed' });
        }
        if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const payload = { id: user.id, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Auth login error:', err && err.stack ? err.stack : err);
        return res.status(500).json({ success: false, message: 'Login failed' });
    }
};

exports.signup = async (req, res) => {
    try {
        console.log('Auth signup attempt, body:', req.body);
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const connection = await db.getConnection();

        // Check if email already exists
        const [existing] = await connection.execute('SELECT id, full_name, role FROM users WHERE email = ? LIMIT 1', [email]);
        if (existing && existing.length > 0) {
            // Already registered in MySQL
            const user = existing[0];
            connection.release();
            
            const payload = { id: user.id, email, role: user.role };
            const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });

            return res.status(200).json({
                success: true,
                token,
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    email,
                    role: user.role
                }
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Setting default role to 'recruiter'
        const userRole = 'recruiter';
        const is_active = 1;

        const [result] = await connection.execute(
            'INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [fullName, email, passwordHash, userRole, is_active]
        );

        const newUserId = result.insertId;
        connection.release();

        const payload = { id: newUserId, email, role: userRole };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });

        return res.status(201).json({
            success: true,
            token,
            user: {
                id: newUserId,
                full_name: fullName,
                email,
                role: userRole
            }
        });
    } catch (err) {
        console.error('Auth signup error:', err && err.stack ? err.stack : err);
        return res.status(500).json({ success: false, message: 'Signup failed' });
    }
};

exports.loginFirebase = async (req, res) => {
    try {
        console.log('Firebase sync login attempt, body:', req.body);
        const { email, password, fullName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const connection = await db.getConnection();

        // 1. Check if user already exists in MySQL
        const [rows] = await connection.execute(
            'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        let userId;
        let finalFullName = fullName || (rows && rows.length ? rows[0].full_name : email.split('@')[0]);
        let userRole = 'recruiter';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        if (!rows || rows.length === 0) {
            // User does not exist in MySQL (e.g. signed up in Firebase but not synced yet)
            // Let's create the user in MySQL to keep them in sync
            const is_active = 1;
            const [result] = await connection.execute(
                'INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
                [finalFullName, email, passwordHash, userRole, is_active]
            );
            userId = result.insertId;
            console.log('Created missing user in MySQL on Firebase login sync:', email);
        } else {
            const user = rows[0];
            userId = user.id;
            userRole = user.role;
            finalFullName = user.full_name;

            // Update password in MySQL to keep it in sync (e.g. if reset in Firebase)
            await connection.execute(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [passwordHash, userId]
            );
            console.log('Updated user password in MySQL on Firebase login sync:', email);
        }

        connection.release();

        const payload = { id: userId, email, role: userRole };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });

        return res.json({
            success: true,
            token,
            user: {
                id: userId,
                full_name: finalFullName,
                email,
                role: userRole
            }
        });
    } catch (err) {
        console.error('Firebase sync login error:', err && err.stack ? err.stack : err);
        return res.status(500).json({ success: false, message: 'Firebase login sync failed' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.execute(
            'SELECT id, full_name, email, role, company_name, created_at FROM users WHERE id = ? LIMIT 1',
            [req.user.id]
        );
        connection.release();
        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('getProfile error:', err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { fullName, companyName } = req.body;
        if (!fullName) {
            return res.status(400).json({ success: false, message: 'Full name is required' });
        }
        const connection = await db.getConnection();
        await connection.execute(
            'UPDATE users SET full_name = ?, company_name = ? WHERE id = ?',
            [fullName, companyName || null, req.user.id]
        );
        connection.release();
        return res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: req.user.id,
                full_name: fullName,
                company_name: companyName
            }
        });
    } catch (err) {
        console.error('updateProfile error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

// ── NEW OTP & CREDENTIAL RESET FLOWS ──────────────────────────────────────────

exports.sendOtp = async (req, res) => {
    try {
        const { email, purpose } = req.body;
        if (!email || !purpose) return res.status(400).json({ success: false, message: 'Email and purpose are required' });

        const connection = await db.getConnection();

        // If purpose is signup, make sure email is not already registered
        if (purpose === 'signup') {
            const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
            if (existing && existing.length > 0) {
                connection.release();
                return res.status(400).json({ success: false, message: 'Email is already registered' });
            }
        }

        // If purpose is forgot_password, check if email exists
        if (purpose === 'forgot_password') {
            const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
            if (!existing || existing.length === 0) {
                connection.release();
                return res.status(404).json({ success: false, message: 'Email not registered' });
            }
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Delete old OTPs for this email & purpose
        await connection.execute('DELETE FROM otps WHERE email = ? AND purpose = ?', [email, purpose]);

        // Insert new OTP
        await connection.execute(
            'INSERT INTO otps (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
            [email, otpCode, purpose, expiresAt]
        );

        connection.release();

        // Print to the server terminal console
        console.log('\n========================================');
        console.log(`[OTP] Email: ${email} | Code: ${otpCode} | Purpose: ${purpose}`);
        console.log('========================================\n');

        return res.json({ success: true, message: 'Verification OTP sent successfully' });
    } catch (err) {
        console.error('sendOtp error:', err);
        return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otpCode, purpose } = req.body;
        if (!email || !otpCode || !purpose) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and purpose are required' });
        }

        const connection = await db.getConnection();
        const [rows] = await connection.execute(
            'SELECT id FROM otps WHERE email = ? AND otp_code = ? AND purpose = ? AND expires_at > ? LIMIT 1',
            [email, otpCode, purpose, new Date()]
        );

        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        connection.release();
        return res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        console.error('verifyOtp error:', err);
        return res.status(500).json({ success: false, message: 'Verification failed' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otpCode, newPassword } = req.body;
        if (!email || !otpCode || !newPassword) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        const connection = await db.getConnection();

        // Verify OTP
        const [otpRows] = await connection.execute(
            'SELECT id FROM otps WHERE email = ? AND otp_code = ? AND purpose = "forgot_password" AND expires_at > ? LIMIT 1',
            [email, otpCode, new Date()]
        );

        if (!otpRows || otpRows.length === 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        // Delete used OTP
        await connection.execute('DELETE FROM otps WHERE email = ? AND purpose = "forgot_password"', [email]);

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await connection.execute('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);
        connection.release();

        return res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('resetPassword error:', err);
        return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

exports.changeEmailRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newEmail } = req.body;

        if (!currentPassword || !newEmail) {
            return res.status(400).json({ success: false, message: 'Current password and new email are required' });
        }

        const connection = await db.getConnection();

        // Get user profile
        const [rows] = await connection.execute('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Compare password
        const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!match) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // Check if new email is already registered
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [newEmail]);
        if (existing && existing.length > 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Email address already registered' });
        }

        // Generate and save OTP for the new email
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await connection.execute('DELETE FROM otps WHERE email = ? AND purpose = "change_email"', [newEmail]);
        await connection.execute(
            'INSERT INTO otps (email, otp_code, purpose, expires_at) VALUES (?, ?, "change_email", ?)',
            [newEmail, otpCode, expiresAt]
        );

        connection.release();

        console.log('\n========================================');
        console.log(`[OTP] Email: ${newEmail} | Code: ${otpCode} | Purpose: change_email`);
        console.log('========================================\n');

        return res.json({ success: true, message: 'Verification OTP sent to new email address' });
    } catch (err) {
        console.error('changeEmailRequest error:', err);
        return res.status(500).json({ success: false, message: 'Failed to request email change' });
    }
};

exports.changeEmailConfirm = async (req, res) => {
    try {
        const userId = req.user.id;
        const { newEmail, otpCode } = req.body;

        if (!newEmail || !otpCode) {
            return res.status(400).json({ success: false, message: 'New email and OTP code are required' });
        }

        const connection = await db.getConnection();

        // Verify OTP
        const [otpRows] = await connection.execute(
            'SELECT id FROM otps WHERE email = ? AND otp_code = ? AND purpose = "change_email" AND expires_at > ? LIMIT 1',
            [newEmail, otpCode, new Date()]
        );

        if (!otpRows || otpRows.length === 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
        }

        // Delete used OTP
        await connection.execute('DELETE FROM otps WHERE email = ? AND purpose = "change_email"', [newEmail]);

        // Update email in users
        await connection.execute('UPDATE users SET email = ? WHERE id = ?', [newEmail, userId]);
        connection.release();

        return res.json({ success: true, message: 'Email address updated successfully' });
    } catch (err) {
        console.error('changeEmailConfirm error:', err);
        return res.status(500).json({ success: false, message: 'Failed to confirm email change' });
    }
};

exports.resetPasswordSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required' });
        }

        const connection = await db.getConnection();

        // Get user profile
        const [rows] = await connection.execute('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [userId]);
        if (!rows || rows.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Compare password
        const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!match) {
            connection.release();
            return res.status(401).json({ success: false, message: 'Invalid current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
        connection.release();

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('resetPasswordSettings error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update password' });
    }
};

exports.changeEmailFirebase = async (req, res) => {
    try {
        const userId = req.user.id;
        const { newEmail } = req.body;
        if (!newEmail) return res.status(400).json({ success: false, message: 'New email is required' });

        const connection = await db.getConnection();
        
        // Check if new email is already registered in MySQL
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1', [newEmail, userId]);
        if (existing && existing.length > 0) {
            connection.release();
            return res.status(400).json({ success: false, message: 'Email address already registered' });
        }

        await connection.execute('UPDATE users SET email = ? WHERE id = ?', [newEmail, userId]);
        connection.release();
        return res.json({ success: true, message: 'Email address updated successfully' });
    } catch (err) {
        console.error('changeEmailFirebase error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update email' });
    }
};
