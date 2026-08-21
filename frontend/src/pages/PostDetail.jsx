import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPost } from '../api.js'

export default function PostDetail() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPost(id).then(setPost).catch((err) => setError(err.message))
  }, [id])

  if (error) return (
    <section className="state-card">
      <span className="eyebrow">Ollama unavailable</span>
      <h1>We couldn’t prepare your tags.</h1>
      <p>{error}</p>
      <Link to="/">← Write another post</Link>
    </section>
  )

  if (!post) return <div className="loader" aria-label="Loading"><span /><p>Asking Gemma for the best tags…</p></div>

  return (
    <article className="post-detail">
      <div className="detail-nav">
        <Link className="back-link" to="/articles">← All articles</Link>
        <Link className="back-link" to="/">Write a new story</Link>
      </div>
      <div className="post-meta"><span>Published just now</span><span className="dot">•</span><span>AI-tagged</span></div>
      <h1>{post.title}</h1>
      <div className="tags" aria-label="Generated tags">
        {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
      </div>
      <div className="rule" />
      <p className="description">{post.description}</p>
      <aside>
        <span>✦</span>
        <div><strong>Tagged by Gemma</strong><p>These themes were generated locally from your description.</p></div>
      </aside>
    </article>
  )
}
