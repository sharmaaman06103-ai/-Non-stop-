import express from 'express';
import { createServer as createViteServer } from 'vite';
import ytSearch from 'yt-search';
import ytdl from '@distube/ytdl-core';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Search API
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.json([]);
      }
      
      const r = await ytSearch(query);
      // Filter out non-videos and limit to 30 items
      const videos = r.videos.slice(0, 30);
      res.json(videos);
    } catch (error) {
      console.error('Search failed:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Trending/Default API
  app.get('/api/trending', async (req, res) => {
    try {
      // ytSearch doesn't have a built in trending that works perfectly, 
      // so let's just make a very generic search that returns popular stuff
      const r = await ytSearch('latest trending music videos 2026');
      res.json(r.videos.slice(0, 30));
    } catch (error) {
      console.error('Trending failed:', error);
      res.status(500).json({ error: 'Failed to fetch trending' });
    }
  });

  // Download API
  app.get('/api/download', async (req, res) => {
    try {
      const videoId = req.query.videoId as string;
      if (!videoId) {
        return res.status(400).json({ error: 'Missing videoId' });
      }

      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await ytdl.getInfo(url);
      
      // Clean title for a valid filename
      let title = info.videoDetails.title || 'video';
      title = title.replace(/[^\w\s-]/gi, '').trim();

      res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
      res.header('Content-Type', 'video/mp4');

      ytdl(url, { filter: 'audioandvideo', quality: 'highest' }).pipe(res);
    } catch (error) {
      console.error('Download failed:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed or video is restricted' });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
