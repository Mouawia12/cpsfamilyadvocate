import { adminApi, type AdminEpisode } from '../api/adminApi'
import CollectionManager from '../components/CollectionManager'
import { Field, ImageInput, Toggle, inputCls } from '../components/ui'

export default function PodcastPage() {
  return (
    <CollectionManager<AdminEpisode>
      title="Podcast episodes"
      hint="Paste the Spotify link of each episode (Share → Copy link to episode). Episodes appear on the Podcast page with a Spotify player."
      itemName="episode"
      queryKey="podcast"
      api={adminApi.podcast}
      blank={() => ({ title: '', episode_number: null, description: '', spotify_url: '', image_url: null, duration: '', visible: true, published_at: new Date().toISOString().slice(0, 10) })}
      summary={(ep) => (
        <>
          <div className="font-semibold text-navy">{ep.episode_number != null && `#${ep.episode_number} · `}{ep.title}</div>
          <div className="text-[0.8rem] text-muted">{ep.published_at?.slice(0, 10) ?? 'No date'}{ep.spotify_url ? ' · Spotify linked' : ' · No Spotify link'}</div>
        </>
      )}
      form={(d, set) => (
        <>
          <Field label="Title">
            <input className={inputCls} value={d.title ?? ''} onChange={(e) => set({ title: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Episode number">
              <input type="number" min={0} className={inputCls} value={d.episode_number ?? ''} onChange={(e) => set({ episode_number: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Length">
              <input className={inputCls} value={d.duration ?? ''} onChange={(e) => set({ duration: e.target.value })} placeholder="32 min" />
            </Field>
            <Field label="Release date">
              <input type="date" className={inputCls} value={d.published_at?.slice(0, 10) ?? ''} onChange={(e) => set({ published_at: e.target.value || null })} />
            </Field>
          </div>
          <Field label="Spotify link" hint="Example: https://open.spotify.com/episode/…">
            <input type="url" className={inputCls} value={d.spotify_url ?? ''} onChange={(e) => set({ spotify_url: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={4} value={d.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <ImageInput label="Cover image (optional)" value={d.image_url} onChange={(url) => set({ image_url: url })} />
          <Toggle checked={Boolean(d.visible)} onChange={(v) => set({ visible: v })} label="Visible on the website" />
        </>
      )}
    />
  )
}
