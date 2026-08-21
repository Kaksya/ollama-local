import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPost } from '../api.js'

export default function CreatePost() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = ({ target }) => setForm((current) => ({ ...current, [target.name]: target.value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const post = await createPost(form)
      navigate(`/posts/${post.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="compose-layout">
      <div className="intro">
        <span className="eyebrow">New story</span>
        <h1>Turn a thought into<br /><em>something worth sharing.</em></h1>
        <p>Write your post and let your local Ollama model find the three ideas at its heart.</p>
        <Link className="articles-button" to="/articles">View published articles <span>→</span></Link>
      </div>

      <form className="editor-card" onSubmit={submit}>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" value={form.title} onChange={update} maxLength="200" required placeholder="Give your story a name" />

        <div className="label-row">
          <label htmlFor="description">Description</label>
          <span>{form.description.length} characters</span>
        </div>
        <textarea id="description" name="description" value={form.description} onChange={update} required rows="9" placeholder="What do you want to say?" />

        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-footer">
          <p><span>✦</span> Three tags will be generated on the next page.</p>
          <button disabled={saving} type="submit">{saving ? 'Publishing…' : 'Publish story'} <span>→</span></button>
        </div>
      </form>
    </section>
  )
}
