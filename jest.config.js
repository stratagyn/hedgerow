module.exports = {

    collectCoverage: true,
    collectCoverageFrom: ["./src/*.ts"],
    coverageDirectory: "coverage",

    coveragePathIgnorePatterns: [
        "\\\\node_modules\\\\",
        "*.d.ts",
        ".\\\\src\\\\_cmn_.ts",
        ".\\\\src\\\\_trie_.ts",
        ".\\\\src\\\\index.ts",
        ".\\\\src\\\\htypes.ts",
        ".\\\\lib\\\\"
    ],

    coverageProvider: "v8",

    coverageReporters: [
        "json",
        "text",
        "lcov",
        "clover"
    ],

    moduleDirectories: [
        "node_modules"
    ],

    moduleFileExtensions: [
        "js",
        "mjs",
        "cjs",
        "jsx",
        "ts",
        "tsx",
        "json",
        "node"
    ],

    preset: "ts-jest",
    slowTestThreshold: 5,
    testEnvironment: "node",
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
    verbose: true
};