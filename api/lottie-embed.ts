const LOTTIE_PAGE_URL =
  'https://lottiefiles.com/free-animation/black-cat-3OBQxyPyXe';

const LOTTIE_OEMBED_URL =
  'https://embed.lottiefiles.com/oembed?url=' +
  encodeURIComponent(LOTTIE_PAGE_URL);

const FALLBACK_PREVIEW =
  'https://assets-v2.lottiefiles.com/a/7ea04694-1182-11ee-a98e-1362e8508d70/TB9Ub8h2gy.png';

export default {
  async fetch() {
    try {
      const response = await fetch(LOTTIE_OEMBED_URL, {
        headers: {
          accept: 'application/json',
          'user-agent': 'pj-tool-w-pets/1.0',
        },
      });

      if (!response.ok) {
        return Response.json(
          { src: null, preview: FALLBACK_PREVIEW },
          { status: 200 }
        );
      }

      const payload = await response.json();
      const html = typeof payload?.html === 'string' ? payload.html : '';
      const match = html.match(/src=["']([^"']+)["']/i);

      return Response.json({
        src: match?.[1] ?? null,
        preview: FALLBACK_PREVIEW,
      });
    } catch {
      return Response.json(
        { src: null, preview: FALLBACK_PREVIEW },
        { status: 200 }
      );
    }
  },
};
