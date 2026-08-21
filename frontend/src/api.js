const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || 'Something went wrong. Please try again.')
  return data
}

export const createPost = (post) => request('/posts/', { method: 'POST', body: JSON.stringify(post) })
export const getPosts = () => request('/posts/')
export const getPost = (id) => request(`/posts/${id}/`)
export const getKnowledgeDocuments = () => request('/knowledge/')
export const uploadKnowledgeDocument = (file) => {
  const body = new FormData()
  body.append('file', file)
  return request('/knowledge/', { method: 'POST', body })
}
export const deleteKnowledgeDocument = (id) => request(`/knowledge/${id}/`, { method: 'DELETE' })
export const sendChatMessage = (message, history) => request('/chat/', {
  method: 'POST',
  body: JSON.stringify({ message, history }),
})
