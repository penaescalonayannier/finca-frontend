import axios from 'axios';
import type { LoginRequest, LoginResponse, Usuario } from '@/types/Auth';

const API_BASE_URL = '/api/auth';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const SELECTED_FINCA_KEY = 'selected_finca_id';

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/login`, credentials);
    const data = response.data;

    // Store token and user info
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data));

    // Set default authorization header
    this.setAuthHeader(data.token);

    return data;
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SELECTED_FINCA_KEY);
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['X-Finca-Id'];
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): LoginResponse | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as LoginResponse;
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  setAuthHeader(token: string): void {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      this.setAuthHeader(token);
    }
    // Initialize finca header for ADMIN users
    const selectedFincaId = this.getSelectedFincaId();
    if (selectedFincaId) {
      this.setFincaHeader(selectedFincaId);
    }
  }

  // Finca selection methods for ADMIN multi-tenancy
  getSelectedFincaId(): string | null {
    return localStorage.getItem(SELECTED_FINCA_KEY);
  }

  setSelectedFincaId(fincaId: string | null): void {
    if (fincaId) {
      localStorage.setItem(SELECTED_FINCA_KEY, fincaId);
      this.setFincaHeader(fincaId);
    } else {
      localStorage.removeItem(SELECTED_FINCA_KEY);
      delete axios.defaults.headers.common['X-Finca-Id'];
    }
  }

  setFincaHeader(fincaId: string): void {
    axios.defaults.headers.common['X-Finca-Id'] = fincaId;
  }

  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      this.setAuthHeader(token);
      await axios.get(`${API_BASE_URL}/validate`);
      return true;
    } catch {
      this.logout();
      return false;
    }
  }

  async getCurrentUser(): Promise<Usuario | null> {
    try {
      const response = await axios.get<Usuario>(`${API_BASE_URL}/me`);
      return response.data;
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.rol === 'ADMIN';
  }

  isResponsable(): boolean {
    const user = this.getUser();
    return user?.rol === 'RESPONSABLE' || user?.rol === 'ADMIN';
  }
}

export default new AuthService();
