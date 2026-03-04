export const log = {
    info: (module: string, message: string, data?: Record<string, any>) => {
        console.log(JSON.stringify({
            level: 'INFO',
            timestamp: new Date().toISOString(),
            module,
            message,
            ...(data && { data })
        }));
    },
    warn: (module: string, message: string, data?: Record<string, any>) => {
        console.warn(JSON.stringify({
            level: 'WARN',
            timestamp: new Date().toISOString(),
            module,
            message,
            ...(data && { data })
        }));
    },
    error: (module: string, message: string, error?: any) => {
        console.error(JSON.stringify({
            level: 'ERROR',
            timestamp: new Date().toISOString(),
            module,
            message,
            ...(error && { error: error instanceof Error ? error.message : String(error) }),
            stack: error instanceof Error ? error.stack : undefined
        }));
    }
};
