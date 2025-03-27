export const mockFetch = (response: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    } as Response)
  );
};

export const mockFetchError = (status: number, statusText: string) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      statusText,
    } as Response)
  );
}; 