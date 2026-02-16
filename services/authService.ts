
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

  async loginWithGoogle(): Promise<User> {
    // Simulação de fluxo OAuth - Em prod, aqui entraria o SDK do Google
    return new Promise((resolve) => {
      setTimeout(async () => {
        const mockUser = {
          email: 'google_user@example.com',
          name: 'Usuário Google',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Google',
          type: 'google'
        };
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockUser)
        });
        const data = await response.json();
        resolve(data.user);
      }, 1000);
    });
  }
}

export const authService = new AuthService();
