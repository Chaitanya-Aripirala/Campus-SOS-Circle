import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { DataStore } from '../services/store';
import { signToken, AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, rollNumber, department, year, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Fetch system settings to validate email against Admin-configured rules
    const settings = await DataStore.getSettings();

    if (settings) {
      if (!settings.allowSelfRegistration) {
        await DataStore.logRegistrationAttempt(cleanEmail, 'FAILED', 'Self-registration currently disabled by Admin');
        return res.status(403).json({
          success: false,
          message: 'Student self-registration is currently paused by the Campus Safety Administration.',
        });
      }

      // Check configured domain
      const expectedDomain = (settings.studentEmailDomain || 'anurag.edu.in').toLowerCase();
      if (!cleanEmail.endsWith(`@${expectedDomain}`)) {
        await DataStore.logRegistrationAttempt(cleanEmail, 'FAILED', `Email domain must be @${expectedDomain}`);
        return res.status(400).json({
          success: false,
          message: `Please use your official college email ending with @${expectedDomain} (e.g. 23eg105a50@${expectedDomain}).`,
        });
      }

      // Check regex pattern if configured
      if (settings.studentEmailRegex) {
        try {
          const regex = new RegExp(settings.studentEmailRegex, 'i');
          if (!regex.test(cleanEmail)) {
            await DataStore.logRegistrationAttempt(cleanEmail, 'FAILED', 'Email does not match format pattern');
            return res.status(400).json({
              success: false,
              message: `Email format does not match college pattern (${settings.studentEmailPattern || '{rollNumber}@anurag.edu.in'}). Example: 23eg105a50@${expectedDomain}`,
            });
          }
        } catch (regexErr) {
          // If custom regex is malformed, fall back to domain check
        }
      }
    }

    // Check if user already exists
    const existing = await DataStore.findUserByEmail(cleanEmail);
    if (existing) {
      await DataStore.logRegistrationAttempt(cleanEmail, 'FAILED', 'Account already exists');
      return res.status(409).json({
        success: false,
        message: 'An account with this college email already exists. Please log in.',
      });
    }

    // Password strength check
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasDigit) {
      return res.status(400).json({
        success: false,
        message: 'Password must include at least one uppercase letter, one lowercase letter, and one number.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await DataStore.createUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'Student',
      rollNumber: rollNumber?.trim() || cleanEmail.split('@')[0].toUpperCase(),
      department: department?.trim() || 'Engineering',
      year: year?.trim() || 'Student',
      phone: phone?.trim() || '',
      profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
    });

    await DataStore.logRegistrationAttempt(cleanEmail, 'SUCCESS', 'Registration completed');
    await DataStore.addAuditLog('USER_REGISTER', { id: user._id, name: user.name, role: user.role }, cleanEmail);

    const token = signToken({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      department: user.department,
      phone: user.phone,
    });

    const { passwordHash: _, ...userSafe } = user;
    return res.status(201).json({
      success: true,
      message: 'Student registration successful!',
      token,
      user: userSafe,
    });
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'College email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await DataStore.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email. Please check or register.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact Campus Safety Administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = signToken({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      department: user.department,
      phone: user.phone,
    });

    await DataStore.addAuditLog('USER_LOGIN', { id: user._id, name: user.name, role: user.role });

    const { passwordHash: _, ...userSafe } = user;
    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: userSafe,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await DataStore.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { passwordHash: _, ...userSafe } = user;
    return res.json({ success: true, user: userSafe });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
