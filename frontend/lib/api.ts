import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token') || localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = Cookies.get('refresh_token') || localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data

          // Store new tokens
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)
          Cookies.set('access_token', access_token)
          Cookies.set('refresh_token', refresh_token)

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        window.location.href = '/auth/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; full_name?: string }) =>
    api.post('/api/auth/register', data),

  login: (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  logout: () => api.post('/api/auth/logout'),

  getMe: () => api.get('/api/auth/me'),

  refreshToken: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refresh_token: refreshToken }),
}

// Projects API
export const projectsAPI = {
  list: () => api.get('/api/projects'),
  get: (id: string) => api.get(`/api/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post('/api/projects', data),
  update: (id: string, data: { name?: string; description?: string; status?: string }) =>
    api.put(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
}

// Identity Engine API
export const identityAPI = {
  listCharacters: (projectId?: string) => 
    api.get('/api/identity/characters', { params: { project_id: projectId } }),
  getCharacter: (id: string) => api.get(`/api/identity/characters/${id}`),
  createCharacter: (data: { name: string; project_id: string; identity_locked?: boolean; similarity_threshold?: number }) =>
    api.post('/api/identity/characters', data),
  updateCharacter: (id: string, data: { name?: string; master_portrait_url?: string; identity_locked?: boolean; similarity_threshold?: number }) =>
    api.put(`/api/identity/characters/${id}`, data),
  deleteCharacter: (id: string) => api.delete(`/api/identity/characters/${id}`),
  addFaceReference: (characterId: string, data: { image_url: string; is_master: boolean }) =>
    api.post(`/api/identity/characters/${characterId}/faces`, null, { params: data }),
  listFaceReferences: (characterId: string) =>
    api.get(`/api/identity/characters/${characterId}/faces`),
  verifyIdentity: (characterId: string, imageUrl: string) =>
    api.post('/api/identity/verify-identity', { character_id: characterId, image_url: imageUrl }),
}

// Scenes API
export const scenesAPI = {
  list: (projectId?: string) => api.get('/api/scenes/scenes', { params: { project_id: projectId } }),
  get: (id: string) => api.get(`/api/scenes/scenes/${id}`),
  create: (data: { name: string; project_id: string; description?: string; duration?: number; characters?: any[]; cinematography?: any; scene_data?: any }) =>
    api.post('/api/scenes/scenes', data),
  update: (id: string, data: any) => api.put(`/api/scenes/scenes/${id}`, data),
  delete: (id: string) => api.delete(`/api/scenes/scenes/${id}`),
  createRenderJob: (sceneId: string, data: { provider?: string; parameters?: any }) =>
    api.post(`/api/scenes/scenes/${sceneId}/render`, data),
}

// Render Queue API
export const renderAPI = {
  listJobs: (sceneId?: string) => api.get('/api/scenes/render/jobs', { params: { scene_id: sceneId } }),
  getJob: (id: string) => api.get(`/api/scenes/render/jobs/${id}`),
  getQueueStatus: () => api.get('/api/scenes/render/queue-status'),
}

// Episodes API
export const episodesAPI = {
  list: (projectId?: string) => api.get('/api/episodes/episodes', { params: { project_id: projectId } }),
  get: (id: string) => api.get(`/api/episodes/episodes/${id}`),
  create: (data: { name: string; project_id: string; description?: string; scene_order?: string[] }) =>
    api.post('/api/episodes/episodes', data),
  update: (id: string, data: any) => api.put(`/api/episodes/episodes/${id}`, data),
  delete: (id: string) => api.delete(`/api/episodes/episodes/${id}`),
  createExportJob: (episodeId: string, data: { format?: string; resolution?: string; aspect_ratio?: string }) =>
    api.post(`/api/episodes/episodes/${episodeId}/export`, data),
  listExportJobs: (episodeId?: string) => api.get('/api/episodes/export/jobs', { params: { episode_id: episodeId } }),
  getExportJob: (id: string) => api.get(`/api/episodes/export/jobs/${id}`),
}
