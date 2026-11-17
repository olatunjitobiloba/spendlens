// Stand-in for Node built-ins (fs, path, crypto) in browser bundles. qpdf-wasm
// only requires them when it detects Node, which never happens in the browser.
export {};
