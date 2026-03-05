/**
 * Global error handler middleware.
 */
export function errorHandler(err, _req, res, _next) {
    console.error('[ERROR]', err.message || err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
    });
}
