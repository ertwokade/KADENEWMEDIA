export const json = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const toErrorResponse = (error: unknown, status = 400) => Response.json({ error: error instanceof Error ? error.message : "Beklenmeyen hata" }, { status });
