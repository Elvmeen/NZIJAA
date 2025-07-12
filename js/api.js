
class NzijaAPI {
  constructor() {
    this.baseURL = '';
    this.token = localStorage.getItem('nzija_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('nzija_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('nzija_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Authentication
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/user');
  }

  // Orders
  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrders() {
    return this.request('/api/orders');
  }

  async getAvailableOrders() {
    return this.request('/api/orders/available');
  }

  async updateOrderStatus(orderId, statusData) {
    return this.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  }

  async acceptOrder(orderId) {
    return this.request(`/api/orders/${orderId}/assign-rider`, {
      method: 'PATCH'
    });
  }

  async trackOrder(orderId) {
    return this.request(`/api/orders/${orderId}/track`);
  }

  // Menu
  async getMenu(vendorId) {
    return this.request(`/api/menu/${vendorId}`);
  }

  async addMenuItem(itemData) {
    return this.request('/api/menu', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  }
}

// Create global API instance
window.nzijaAPI = new NzijaAPI();
