const supabase = require('../config/supabase');

module.exports = async function isAdmin(req, res, next) {
  const token = req.session && req.session.accessToken;

  if (!token) {
    return res.redirect('/admin/logg-inn');
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    req.session.accessToken = null;
    return res.redirect('/admin/logg-inn');
  }

  return next();
};
