// config.js: project settings.
//   duration: the video's length in seconds.
//   bpm:      the rhythm that bounces, dances and pulse() follow. Clawd always moves to some beat; if the video has music,
//             set this to the song's tempo, and set offset to the time in seconds of its first downbeat.
//   format:   the frame (FORMATS in core.js): 'vertical' (1080×1920: Reels, Shorts, TikTok), 'landscape' (1920×1080),
//             'square' (1080×1080) or 'portrait' (1080×1350, feed posts). studio.html?format=landscape and
//             render.mjs --format=landscape override it for one run.
const PROJECT = { duration: 11, bpm: 120, offset: 0, format: 'vertical' };
