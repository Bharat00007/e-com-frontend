import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const proxyTarget = env.VITE_PROXY_TARGET || 'https://e-com-backend-wheat.vercel.app';
    const apiProxy = {
        '/api': {
            target: proxyTarget,
            changeOrigin: true,
            secure: proxyTarget.startsWith('https'),
            agent: false,
            headers: {
                Connection: 'close',
            },
            configure: (proxy: {
                on: (
                    event: string,
                    handler: (...args: any[]) => void
                ) => void;
            }) => {
                proxy.on('proxyRes', (proxyRes, req) => {
                    const setCookies = proxyRes.headers['set-cookie'];
                    const host = req.headers.host || '';
                    const isLocalHttp =
                        host.startsWith('localhost') || host.startsWith('127.0.0.1');
                    if (isLocalHttp && Array.isArray(setCookies)) {
                        // Strip `Secure` and relax `SameSite=None` -> `SameSite=Lax` when running on plain HTTP localhost proxy
                        // so every browser cleanly stores and sends HttpOnly session cookies for localhost:5173.
                        proxyRes.headers['set-cookie'] = setCookies.map((cookie: string) =>
                            cookie
                                .replace(/;\s*Secure/gi, '')
                                .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
                        );
                    }
                });
                proxy.on('error', (err, req, res) => {
                    console.warn('[vite proxy error handled]', req.url, err.message);
                    if (res && !res.headersSent && typeof res.writeHead === 'function') {
                        res.writeHead(503, { 'Content-Type': 'application/json' });
                        res.end(
                            JSON.stringify({
                                success: false,
                                error: { code: 'PROXY_RESET', message: 'Upstream connection reset. Please retry.' },
                            })
                        );
                    }
                });
            },
        },
    };

    return {
        plugins: [react(), tailwindcss()],
        server: {
            port: 5173,
            proxy: apiProxy,
        },
        preview: {
            port: 5173,
            proxy: apiProxy,
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                        'ui-icons': ['lucide-react'],
                    },
                },
            },
        },
    };
});
