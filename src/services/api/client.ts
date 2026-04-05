export type ApiResponse<T> = {
  data: T;
  status: number;
};

export interface ApiClient {
  get<T>(path: string): Promise<ApiResponse<T>>;
  post<TBody, TResponse>(path: string, body: TBody): Promise<ApiResponse<TResponse>>;
}

const wait = (timeoutMs: number) => new Promise((resolve) => setTimeout(resolve, timeoutMs));

export const createMockApiClient = (): ApiClient => ({
  async get<T>(_path: string) {
    await wait(250);
    return { data: {} as T, status: 200 };
  },
  async post<TBody, TResponse>(path: string, body: TBody) {
    await wait(250);
    return { data: { path, body } as TResponse, status: 200 };
  },
});
