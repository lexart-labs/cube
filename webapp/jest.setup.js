// Global config for jest
global.$ = jest.fn().mockReturnValue({
    tooltip: jest.fn(),
    modal: jest.fn(),
});