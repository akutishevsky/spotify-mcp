// Spotify Web API Types
// Based on https://developer.spotify.com/documentation/web-api

// ── Common Objects ──────────────────────────────────────────────────

export interface SpotifyImage {
    url: string;
    height: number | null;
    width: number | null;
}

export interface SpotifyExternalUrls {
    spotify: string;
}

export interface SpotifyExternalIds {
    isrc?: string;
    ean?: string;
    upc?: string;
}

export interface SpotifyFollowers {
    href: string | null;
    total: number;
}

export interface SpotifyRestrictions {
    reason: string;
}

export interface SpotifyCopyright {
    text: string;
    type: "C" | "P";
}

export interface SpotifyResumePoint {
    fully_played: boolean;
    resume_position_ms: number;
}

export interface SpotifyPagingObject<T> {
    href: string;
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
    items: T[];
}

export interface SpotifyCursorPagingObject<T> {
    href: string;
    limit: number;
    next: string | null;
    cursors: {
        after: string | null;
        before?: string | null;
    };
    total?: number;
    items: T[];
}

// ── Artists ──────────────────────────────────────────────────────────

export interface SpotifySimplifiedArtist {
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    name: string;
    type: "artist";
    uri: string;
}

export interface SpotifyArtist extends SpotifySimplifiedArtist {
    followers: SpotifyFollowers;
    genres: string[];
    images: SpotifyImage[];
    popularity: number;
}

// ── Albums ───────────────────────────────────────────────────────────

export type SpotifyAlbumType = "album" | "single" | "compilation";
export type SpotifyReleaseDatePrecision = "year" | "month" | "day";

export interface SpotifySimplifiedAlbum {
    album_type: SpotifyAlbumType;
    total_tracks: number;
    available_markets: string[];
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    images: SpotifyImage[];
    name: string;
    release_date: string;
    release_date_precision: SpotifyReleaseDatePrecision;
    restrictions?: SpotifyRestrictions;
    type: "album";
    uri: string;
    artists: SpotifySimplifiedArtist[];
}

export interface SpotifyAlbum extends SpotifySimplifiedAlbum {
    tracks: SpotifyPagingObject<SpotifySimplifiedTrack>;
    copyrights: SpotifyCopyright[];
    external_ids: SpotifyExternalIds;
    genres: string[];
    label: string;
    popularity: number;
}

export interface SpotifySavedAlbum {
    added_at: string;
    album: SpotifyAlbum;
}

// ── Tracks ───────────────────────────────────────────────────────────

export interface SpotifySimplifiedTrack {
    artists: SpotifySimplifiedArtist[];
    available_markets: string[];
    disc_number: number;
    duration_ms: number;
    explicit: boolean;
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    is_playable?: boolean;
    linked_from?: SpotifyLinkedTrack;
    restrictions?: SpotifyRestrictions;
    name: string;
    preview_url: string | null;
    track_number: number;
    type: "track";
    uri: string;
    is_local: boolean;
}

export interface SpotifyTrack extends SpotifySimplifiedTrack {
    album: SpotifySimplifiedAlbum;
    external_ids: SpotifyExternalIds;
    popularity: number;
}

export interface SpotifyLinkedTrack {
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    type: "track";
    uri: string;
}

export interface SpotifySavedTrack {
    added_at: string;
    track: SpotifyTrack;
}

// ── Audio Features & Analysis ────────────────────────────────────────

export interface SpotifyAudioFeatures {
    acousticness: number;
    analysis_url: string;
    danceability: number;
    duration_ms: number;
    energy: number;
    id: string;
    instrumentalness: number;
    key: number;
    liveness: number;
    loudness: number;
    mode: number;
    speechiness: number;
    tempo: number;
    time_signature: number;
    track_href: string;
    type: "audio_features";
    uri: string;
    valence: number;
}

export interface SpotifyAudioAnalysis {
    meta: {
        analyzer_version: string;
        platform: string;
        detailed_status: string;
        status_code: number;
        timestamp: number;
        analysis_time: number;
        input_process: string;
    };
    track: {
        num_samples: number;
        duration: number;
        sample_md5: string;
        offset_seconds: number;
        window_seconds: number;
        analysis_sample_rate: number;
        analysis_channels: number;
        end_of_fade_in: number;
        start_of_fade_out: number;
        loudness: number;
        tempo: number;
        tempo_confidence: number;
        time_signature: number;
        time_signature_confidence: number;
        key: number;
        key_confidence: number;
        mode: number;
        mode_confidence: number;
    };
    bars: SpotifyTimeInterval[];
    beats: SpotifyTimeInterval[];
    sections: SpotifySection[];
    segments: SpotifySegment[];
    tatums: SpotifyTimeInterval[];
}

export interface SpotifyTimeInterval {
    start: number;
    duration: number;
    confidence: number;
}

export interface SpotifySection {
    start: number;
    duration: number;
    confidence: number;
    loudness: number;
    tempo: number;
    tempo_confidence: number;
    key: number;
    key_confidence: number;
    mode: number;
    mode_confidence: number;
    time_signature: number;
    time_signature_confidence: number;
}

export interface SpotifySegment {
    start: number;
    duration: number;
    confidence: number;
    loudness_start: number;
    loudness_max: number;
    loudness_max_time: number;
    loudness_end: number;
    pitches: number[];
    timbre: number[];
}

// ── Playlists ────────────────────────────────────────────────────────

export interface SpotifySimplifiedPlaylist {
    collaborative: boolean;
    description: string | null;
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    images: SpotifyImage[];
    name: string;
    owner: SpotifyPublicUser;
    public: boolean | null;
    snapshot_id: string;
    tracks: {
        href: string;
        total: number;
    };
    type: "playlist";
    uri: string;
}

export interface SpotifyPlaylist extends SpotifySimplifiedPlaylist {
    followers: SpotifyFollowers;
    tracks: SpotifyPagingObject<SpotifyPlaylistTrack>;
}

export interface SpotifyPlaylistTrack {
    added_at: string | null;
    added_by: SpotifyPublicUser | null;
    is_local: boolean;
    track: SpotifyPlayableItem | null;
}

export type SpotifyPlayableItem = SpotifyTrack | SpotifyEpisode;

export interface SpotifyFeaturedPlaylists {
    message: string;
    playlists: SpotifyPagingObject<SpotifySimplifiedPlaylist>;
}

// ── Episodes ─────────────────────────────────────────────────────────

export interface SpotifySimplifiedEpisode {
    audio_preview_url: string | null;
    description: string;
    html_description: string;
    duration_ms: number;
    explicit: boolean;
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    images: SpotifyImage[];
    is_externally_hosted: boolean;
    is_playable: boolean;
    languages: string[];
    name: string;
    release_date: string;
    release_date_precision: SpotifyReleaseDatePrecision;
    resume_point?: SpotifyResumePoint;
    type: "episode";
    uri: string;
    restrictions?: SpotifyRestrictions;
}

export interface SpotifyEpisode extends SpotifySimplifiedEpisode {
    show: SpotifySimplifiedShow;
}

export interface SpotifySavedEpisode {
    added_at: string;
    episode: SpotifyEpisode;
}

// ── Shows ────────────────────────────────────────────────────────────

export interface SpotifySimplifiedShow {
    available_markets: string[];
    copyrights: SpotifyCopyright[];
    description: string;
    html_description: string;
    explicit: boolean;
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    images: SpotifyImage[];
    is_externally_hosted: boolean;
    languages: string[];
    media_type: string;
    name: string;
    publisher: string;
    type: "show";
    uri: string;
    total_episodes: number;
}

export interface SpotifyShow extends SpotifySimplifiedShow {
    episodes: SpotifyPagingObject<SpotifySimplifiedEpisode>;
}

export interface SpotifySavedShow {
    added_at: string;
    show: SpotifySimplifiedShow;
}

// ── Audiobooks & Chapters ────────────────────────────────────────────

export interface SpotifyAuthor {
    name: string;
}

export interface SpotifyNarrator {
    name: string;
}

export interface SpotifySimplifiedAudiobook {
    authors: SpotifyAuthor[];
    available_markets: string[];
    copyrights: SpotifyCopyright[];
    description: string;
    html_description: string;
    edition?: string;
    explicit: boolean;
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    images: SpotifyImage[];
    languages: string[];
    media_type: string;
    name: string;
    narrators: SpotifyNarrator[];
    publisher: string;
    type: "audiobook";
    uri: string;
    total_chapters: number;
}

export interface SpotifyAudiobook extends SpotifySimplifiedAudiobook {
    chapters: SpotifyPagingObject<SpotifySimplifiedChapter>;
}

export interface SpotifySimplifiedChapter {
    audio_preview_url: string | null;
    available_markets: string[];
    chapter_number: number;
    description: string;
    html_description: string;
    duration_ms: number;
    explicit: boolean;
    external_urls: SpotifyExternalUrls;
    href: string;
    id: string;
    images: SpotifyImage[];
    is_playable: boolean;
    languages: string[];
    name: string;
    release_date: string;
    release_date_precision: SpotifyReleaseDatePrecision;
    resume_point?: SpotifyResumePoint;
    type: "chapter";
    uri: string;
    restrictions?: SpotifyRestrictions;
}

export interface SpotifyChapter extends SpotifySimplifiedChapter {
    audiobook: SpotifySimplifiedAudiobook;
}

// ── Users ────────────────────────────────────────────────────────────

export interface SpotifyPublicUser {
    display_name: string | null;
    external_urls: SpotifyExternalUrls;
    followers?: SpotifyFollowers;
    href: string;
    id: string;
    images?: SpotifyImage[];
    type: "user";
    uri: string;
}

export interface SpotifyPrivateUser extends SpotifyPublicUser {
    country?: string;
    email?: string;
    explicit_content?: {
        filter_enabled: boolean;
        filter_locked: boolean;
    };
    product?: "premium" | "free" | "open";
}

// ── Player ───────────────────────────────────────────────────────────

export interface SpotifyDevice {
    id: string | null;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number | null;
    supports_volume: boolean;
}

export interface SpotifyContext {
    type: "artist" | "playlist" | "album" | "show";
    href: string;
    external_urls: SpotifyExternalUrls;
    uri: string;
}

export interface SpotifyActions {
    interrupting_playback?: boolean;
    pausing?: boolean;
    resuming?: boolean;
    seeking?: boolean;
    skipping_next?: boolean;
    skipping_prev?: boolean;
    toggling_repeat_context?: boolean;
    toggling_shuffle?: boolean;
    toggling_repeat_track?: boolean;
    transferring_playback?: boolean;
}

export interface SpotifyPlaybackState {
    device: SpotifyDevice;
    repeat_state: "off" | "track" | "context";
    shuffle_state: boolean;
    context: SpotifyContext | null;
    timestamp: number;
    progress_ms: number | null;
    is_playing: boolean;
    item: SpotifyPlayableItem | null;
    currently_playing_type: "track" | "episode" | "ad" | "unknown";
    actions: { disallows: SpotifyActions };
}

export interface SpotifyCurrentlyPlaying {
    context: SpotifyContext | null;
    timestamp: number;
    progress_ms: number | null;
    is_playing: boolean;
    item: SpotifyPlayableItem | null;
    currently_playing_type: "track" | "episode" | "ad" | "unknown";
    actions: { disallows: SpotifyActions };
}

export interface SpotifyQueue {
    currently_playing: SpotifyPlayableItem | null;
    queue: SpotifyPlayableItem[];
}

export interface SpotifyPlayHistory {
    track: SpotifyTrack;
    played_at: string;
    context: SpotifyContext | null;
}

// ── Categories ───────────────────────────────────────────────────────

export interface SpotifyCategory {
    href: string;
    icons: SpotifyImage[];
    id: string;
    name: string;
}

// ── Search ───────────────────────────────────────────────────────────

export interface SpotifySearchResult {
    tracks?: SpotifyPagingObject<SpotifyTrack>;
    artists?: SpotifyPagingObject<SpotifyArtist>;
    albums?: SpotifyPagingObject<SpotifySimplifiedAlbum>;
    playlists?: SpotifyPagingObject<SpotifySimplifiedPlaylist>;
    shows?: SpotifyPagingObject<SpotifySimplifiedShow>;
    episodes?: SpotifyPagingObject<SpotifySimplifiedEpisode>;
    audiobooks?: SpotifyPagingObject<SpotifySimplifiedAudiobook>;
}

// ── Recommendations ──────────────────────────────────────────────────

export interface SpotifyRecommendationSeed {
    afterFilteringSize: number;
    afterRelinkingSize: number;
    href: string | null;
    id: string;
    initialPoolSize: number;
    type: "artist" | "track" | "genre";
}

export interface SpotifyRecommendations {
    seeds: SpotifyRecommendationSeed[];
    tracks: SpotifyTrack[];
}

// ── API Response Wrappers ────────────────────────────────────────────

export interface SpotifySeveralAlbums {
    albums: SpotifyAlbum[];
}

export interface SpotifySeveralArtists {
    artists: SpotifyArtist[];
}

export interface SpotifySeveralTracks {
    tracks: SpotifyTrack[];
}

export interface SpotifySeveralAudioFeatures {
    audio_features: SpotifyAudioFeatures[];
}

export interface SpotifySeveralAudiobooks {
    audiobooks: SpotifyAudiobook[];
}

export interface SpotifySeveralChapters {
    chapters: SpotifyChapter[];
}

export interface SpotifySeveralEpisodes {
    episodes: SpotifyEpisode[];
}

export interface SpotifySeveralShows {
    shows: SpotifySimplifiedShow[];
}

export interface SpotifyDevicesResponse {
    devices: SpotifyDevice[];
}

export interface SpotifyNewReleases {
    albums: SpotifyPagingObject<SpotifySimplifiedAlbum>;
}

export interface SpotifyAvailableMarkets {
    markets: string[];
}

export interface SpotifyAvailableGenreSeeds {
    genres: string[];
}

export interface SpotifySnapshotResponse {
    snapshot_id: string;
}

export interface SpotifySuccessResponse {
    success: true;
}
