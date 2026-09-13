import { useEpisodes, useSettings } from '../data'
import PageShell from './PageShell'

/** open.spotify.com/episode/ID → open.spotify.com/embed/episode/ID */
function spotifyEmbed(url: string): string | null {
  const match = url.match(/^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(episode|show)\/([A-Za-z0-9]+)/)
  return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null
}

export default function PodcastPage() {
  const { data: settings } = useSettings()
  const { data: episodes, isLoading } = useEpisodes()
  const show = settings?.integrations.spotifyShowUrl ? spotifyEmbed(settings.integrations.spotifyShowUrl) : null

  return (
    <PageShell
      eyebrow="Podcast"
      title="The Familist Podcast"
      lead="Expert interviews, reunification success stories, and practical guidance for families."
      documentTitle={`The Familist Podcast | ${settings?.brandName ?? 'Familist'}`}
      narrow
    >
      {show && (
        <iframe className="spotify-embed spotify-show" src={show} title="The Familist Podcast on Spotify" loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
      )}

      {isLoading && <p className="muted">Loading episodes…</p>}
      {episodes && episodes.length === 0 && !show && <p className="muted">New episodes are coming soon.</p>}

      <div className="episode-list">
        {episodes?.map((ep) => {
          const embed = ep.spotify_url ? spotifyEmbed(ep.spotify_url) : null
          return (
            <div className="episode" key={ep.id}>
              <div className="episode-head">
                {ep.episode_number != null && <span className="episode-number">Episode {ep.episode_number}</span>}
                {ep.duration && <span className="episode-duration">{ep.duration}</span>}
              </div>
              <h2>{ep.title}</h2>
              {ep.description && <p>{ep.description}</p>}
              {embed && (
                <iframe className="spotify-embed" src={embed} title={`${ep.title} on Spotify`} loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
              )}
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
