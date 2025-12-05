// Monkey-patch fs.readlink/readlinkSync to avoid EISDIR issues on Windows during Next/Webpack builds
// When fs.readlink is called on regular files or directories, Windows may throw EISDIR.
// We normalize such cases to EINVAL so upstream callers treat it as "not a symlink".

const fs = require('fs');

const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function patchedReadlinkSync(path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (e) {
    if (e && (e.code === 'EISDIR' || e.code === 'UNKNOWN')) {
      // Normalize to EINVAL which many resolvers interpret as not-a-symlink
      e.code = 'EINVAL';
    }
    throw e;
  }
};

const origReadlink = fs.readlink;
fs.readlink = function patchedReadlink(path, options, callback) {
  // options is optional
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  return origReadlink.call(fs, path, options, function (err, target) {
    if (err && (err.code === 'EISDIR' || err.code === 'UNKNOWN')) {
      err.code = 'EINVAL';
    }
    callback && callback(err, target);
  });
};
