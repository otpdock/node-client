"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockFetchError = exports.mockFetch = void 0;
const mockFetch = (response) => {
    global.fetch = jest.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
    }));
};
exports.mockFetch = mockFetch;
const mockFetchError = (status, statusText) => {
    global.fetch = jest.fn(() => Promise.resolve({
        ok: false,
        status,
        statusText,
    }));
};
exports.mockFetchError = mockFetchError;
