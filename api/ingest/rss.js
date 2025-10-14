module.exports = (req, res) => {
  res.status(200).json({ ok: true, route: '/api/ingest/rss', status: 'alive-js' });
};
