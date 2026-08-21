import { useEffect, useRef, useState } from 'react'
import {
  deleteKnowledgeDocument,
  getKnowledgeDocuments,
  sendChatMessage,
  uploadKnowledgeDocument,
} from '../api.js'

const formatSize = (bytes) => bytes < 1024
  ? `${bytes} B`
  : `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`

export default function Chatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [documents, setDocuments] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [knowledgeError, setKnowledgeError] = useState('')
  const endRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getKnowledgeDocuments().then(setDocuments).catch((err) => setKnowledgeError(err.message))
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function submitMessage(event) {
    event.preventDefault()
    const message = input.trim()
    if (!message || sending || documents.length === 0) return

    const history = messages.map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, { role: 'user', content: message }])
    setInput('')
    setError('')
    setSending(true)
    try {
      const response = await sendChatMessage(message, history)
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.reply, sources: response.sources || [] },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  async function uploadDocument(event) {
    event.preventDefault()
    if (!selectedFile || uploading) return
    setKnowledgeError('')
    setUploading(true)
    try {
      const document = await uploadKnowledgeDocument(selectedFile)
      setDocuments((current) => [document, ...current])
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setKnowledgeError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function removeDocument(id) {
    setKnowledgeError('')
    try {
      await deleteKnowledgeDocument(id)
      setDocuments((current) => current.filter((document) => document.id !== id))
    } catch (err) {
      setKnowledgeError(err.message)
    }
  }

  return (
    <section className="chat-page">
      <div className="chat-page-heading">
        <div>
          <span className="eyebrow">Local knowledge assistant</span>
          <h1>Ask your <em>knowledge base.</em></h1>
        </div>
        <p>Upload your sources, then ask Gemma questions grounded in their content.</p>
      </div>

      <div className="chat-workspace">
        <div className="chat-card">
          <div className="chat-status">
            <span className="chat-avatar">G</span>
            <div>
              <strong>Gemma assistant</strong>
              <small>{documents.length ? 'Grounded in your sources' : 'Waiting for knowledge'}</small>
            </div>
            <span className="local-status"><i /> Local</span>
          </div>

          <div className="messages" aria-live="polite" aria-label="Conversation">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                <span className="message-avatar">{message.role === 'assistant' ? 'G' : 'You'}</span>
                <div className="message-content">
                  <p>{message.content}</p>
                  {message.sources?.length > 0 && (
                    <div className="message-sources">
                      {message.sources.map((source) => <span key={source}>{source}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="message assistant">
                <span className="message-avatar">G</span>
                <p className="typing" aria-label="Gemma is responding"><i /><i /><i /></p>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && <p className="chat-error" role="alert">{error}</p>}

          <form className="chat-form" onSubmit={submitMessage}>
            <textarea
              aria-label="Message"
              disabled={documents.length === 0}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form.requestSubmit()
                }
              }}
              placeholder={documents.length ? 'Ask a question about your sources…' : 'Upload knowledge to begin…'}
              rows="2"
              value={input}
            />
            <button disabled={sending || !input.trim() || documents.length === 0} type="submit">
              {sending ? 'Thinking…' : 'Send'} <span>→</span>
            </button>
          </form>
        </div>

        <aside className="knowledge-card">
          <div className="knowledge-heading">
            <div>
              <span className="knowledge-icon">⌁</span>
              <div><strong>Knowledge base</strong><small>{documents.length} {documents.length === 1 ? 'source' : 'sources'}</small></div>
            </div>
            <span className="private-badge">Local only</span>
          </div>

          <form className="upload-form" onSubmit={uploadDocument}>
            <label className="upload-zone" htmlFor="knowledge-file">
              <span>＋</span>
              <strong>{selectedFile ? selectedFile.name : 'Choose a source'}</strong>
              <small>TXT, Markdown, or PDF · max 5 MB</small>
            </label>
            <input
              accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
              className="knowledge-file-input"
              id="knowledge-file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              ref={fileInputRef}
              type="file"
            />
            <button disabled={!selectedFile || uploading} type="submit">
              {uploading ? 'Adding source…' : 'Add to knowledge base'}
            </button>
          </form>

          {knowledgeError && <p className="knowledge-error" role="alert">{knowledgeError}</p>}

          <div className="knowledge-list">
            {documents.length === 0 ? (
              <div className="knowledge-empty"><span>◇</span><p>Your uploaded sources will appear here.</p></div>
            ) : documents.map((document) => (
              <div className="knowledge-item" key={document.id}>
                <span className="file-icon">{document.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'TXT'}</span>
                <div><strong>{document.name}</strong><small>{formatSize(document.size)}</small></div>
                <button aria-label={`Remove ${document.name}`} onClick={() => removeDocument(document.id)} type="button">×</button>
              </div>
            ))}
          </div>

          <p className="knowledge-note"><span>✦</span> Answers are generated locally from the most relevant excerpts.</p>
        </aside>
      </div>
    </section>
  )
}
