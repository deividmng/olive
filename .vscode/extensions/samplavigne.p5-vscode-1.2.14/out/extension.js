"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const got_1 = __importDefault(require("got"));
const stream_1 = require("stream");
const util_1 = require("util");
const libraries_json_1 = __importDefault(require("./libraries.json"));
const pipeline = (0, util_1.promisify)(stream_1.Stream.pipeline);
const Uri = vscode.Uri;
const vsfs = vscode.workspace.fs;
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        updateJSConfig(context);
        let createProject = vscode.commands.registerCommand("p5-vscode.createProject", () => __awaiter(this, void 0, void 0, function* () {
            try {
                let filePath = yield vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                });
                if (filePath) {
                    const dest = filePath[0].path;
                    yield copyTemplate(dest);
                    const destUri = Uri.file(dest);
                    // open a workspace folder in a new window
                    yield vscode.commands.executeCommand("vscode.openFolder", destUri, true);
                    // hacky way to actually open the sketch file...
                    if (process.platform !== "win32") {
                        const sketchFile = Uri.parse(`vscode://file${Uri.joinPath(destUri, "sketch.js").path}`);
                        yield vscode.env.openExternal(sketchFile);
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
        }));
        let installLibrary = vscode.commands.registerCommand("p5-vscode.installLibrary", () => __awaiter(this, void 0, void 0, function* () {
            const libraries = libraries_json_1.default
                .filter((l) => l.install)
                .map((l) => {
                return {
                    label: l.name,
                    description: l.authors ? l.authors.map((a) => a.name).join(", ") : "",
                    detail: l.desc,
                    install: l.install,
                    url: l.url,
                };
            });
            const result = yield vscode.window.showQuickPick(libraries, {
                placeHolder: "Library name",
            });
            if (result) {
                const action = yield vscode.window.showQuickPick([
                    {
                        label: "Install " + result.label,
                        action: "install",
                    },
                    {
                        label: "Visit home page",
                        action: "visit",
                    },
                ], {
                    placeHolder: "Select action",
                });
                if (action) {
                    if (action.action === "install" && result.install) {
                        installP5Library(result.install);
                    }
                    else {
                        vscode.env.openExternal(vscode.Uri.parse(result.url));
                    }
                }
            }
        }));
        context.subscriptions.push(createProject);
        context.subscriptions.push(installLibrary);
    });
}
exports.activate = activate;
function installP5Library(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspacePath = vscode.workspace.rootPath;
        if (!workspacePath ||
            !(0, fs_1.existsSync)(path.join(workspacePath, "index.html")) ||
            !(0, fs_1.existsSync)(path.join(workspacePath, "libraries"))) {
            vscode.window.showErrorMessage("Make sure your workspace includes an index.html and a libraries folder.");
            return false;
        }
        const urls = typeof url === "string" ? [url] : url;
        for (const u of urls) {
            const basename = path.basename(u);
            const dest = path.join(workspacePath, "libraries", basename);
            const indexPath = path.join(workspacePath, "index.html");
            if (!(0, fs_1.existsSync)(dest)) {
                try {
                    yield pipeline(got_1.default.stream(u), (0, fs_1.createWriteStream)(dest));
                }
                catch (e) {
                    vscode.window.showErrorMessage("Could not download library.");
                }
            }
            let indexFileContents = (0, fs_1.readFileSync)(indexPath, "utf-8");
            const scriptTag = `<script src="libraries/${basename}"></script>`;
            if (!indexFileContents.includes(scriptTag)) {
                indexFileContents = indexFileContents.replace("</head>", `  ${scriptTag}\n  </head>`);
                (0, fs_1.writeFileSync)(indexPath, indexFileContents);
            }
            vscode.window.showInformationMessage("Library installed");
        }
    });
}
function copyTemplate(dest) {
    return __awaiter(this, void 0, void 0, function* () {
        const paths = [
            "index.html",
            "style.css",
            "sketch.js",
            "libraries/p5.min.js",
            "libraries/p5.sound.min.js",
        ];
        const baseSrc = Uri.joinPath(Uri.file(__dirname), "../template");
        const baseDest = Uri.file(dest);
        vsfs.createDirectory(baseDest);
        // create the libraries directory
        const librariesPath = Uri.joinPath(baseDest, "libraries");
        vsfs.createDirectory(librariesPath);
        // copy over all the files
        for (const p of paths) {
            const src = Uri.joinPath(baseSrc, p);
            const dest = Uri.joinPath(baseDest, p);
            if ((0, fs_1.existsSync)(dest.path)) {
                continue;
            }
            try {
                yield vsfs.copy(src, dest, { overwrite: false });
            }
            catch (e) {
                console.error(e);
            }
        }
        // creates a jsonconfig that tells vscode where to find the types file
        const jsconfig = {
            "compilerOptions": {
                "target": "es6",
            },
            include: [
                "*.js",
                "**/*.js",
                Uri.joinPath(Uri.file(__dirname), "../p5types", "global.d.ts").fsPath,
            ],
        };
        const jsconfigPath = Uri.joinPath(baseDest, "jsconfig.json");
        (0, fs_1.writeFileSync)(jsconfigPath.fsPath, JSON.stringify(jsconfig, null, 2));
    });
}
function updateJSConfig(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspacePath = vscode.workspace.rootPath;
        if (!workspacePath) {
            return false;
        }
        const jsconfigPath = path.join(workspacePath, "jsconfig.json");
        if (!(0, fs_1.existsSync)(jsconfigPath)) {
            return false;
        }
        let jsconfigContents = (0, fs_1.readFileSync)(jsconfigPath, "utf-8");
        const extensionName = context.extension.id;
        const currentName = extensionName + "-" + context.extension.packageJSON.version;
        const regex = new RegExp(extensionName + "-[0-9.]+", "m");
        if (regex.test(jsconfigContents)) {
            jsconfigContents = jsconfigContents.replace(regex, currentName);
            (0, fs_1.writeFileSync)(jsconfigPath, jsconfigContents);
        }
    });
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map