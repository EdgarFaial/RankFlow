
import { User } from '../types';

class AuthService {
  async login(email: string, name: string): Promise<User> {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, type: 'login' })
    });
    
    if (!response.ok) throw new Error('Falha no login');
    const data = await response.json();
    return data.user;
  }
}

export const authService = new AuthService();
