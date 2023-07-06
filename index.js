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
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const did_resolver_1 = require("did-resolver");
const web_did_resolver_1 = __importDefault(require("web-did-resolver"));
const did_jwt_1 = require("did-jwt");
const fs_1 = __importDefault(require("fs"));
const qrcode_1 = __importDefault(require("qrcode"));
const cors_1 = __importDefault(require("cors"));
const node_persist_1 = __importDefault(require("node-persist"));
const ethers_1 = require("ethers");
const abi_json_1 = __importDefault(require("./abi.json"));
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const provider = new ethers_1.JsonRpcProvider(process.env.RPC);
const contract = new ethers_1.Contract(process.env.CONTRACT_ADDRESS, abi_json_1.default, provider);
node_persist_1.default.init({
    dir: 'db',
    logging(...args) {
        console.log(args);
    },
});
const did = `did:web:issuer-verifier-express.delightfulriver-e0d8cb6b.westeurope.azurecontainerapps.io`;
app.use((0, cors_1.default)({
    origin: '*'
}));
app.use(express_1.default.json());
app.get('/.well-known/did.json', (req, res) => {
    res.send(fs_1.default.readFileSync('.well-known/did.json').toString());
});
app.get('/verifierQrCode', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let QRbase64 = yield new Promise((resolve, reject) => {
        qrcode_1.default.toDataURL(Buffer.from('https://issuer-verifier-express.delightfulriver-e0d8cb6b.westeurope.azurecontainerapps.io/verifier').toString('base64'), function (err, code) {
            if (err) {
                reject(reject);
                return;
            }
            resolve(code);
        });
    });
    return res.send({ qrCode: QRbase64 });
}));
app.post('/verifier', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jwt } = req.body;
    const webResolver = web_did_resolver_1.default.getResolver();
    const resolver = new did_resolver_1.Resolver(Object.assign({}, webResolver));
    try {
        const vc = yield (0, did_jwt_1.verifyJWT)(jwt, {
            resolver,
            audience: did
        });
        if (vc.verified) {
            const [name, tokenId, hashVc] = yield contract.identity(vc.payload.sub);
            if (hashVc === (0, ethers_1.sha256)(Buffer.from(jwt))) {
                yield node_persist_1.default.setItem(vc.payload.sub.toLowerCase(), JSON.stringify(true));
            }
        }
        res.status(200).send({});
    }
    catch (error) {
        console.log(error);
        res.status(500).send({});
    }
}));
app.get('/isVerified', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { address } = req.query;
    address = `${address}`.toLocaleLowerCase();
    const ver = yield node_persist_1.default.getItem(address);
    if (ver != null) {
        res.status(200).send({ verified: JSON.parse(ver) });
    }
    else {
        res.status(200).send({ verified: false });
    }
}));
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, address, apiKey } = req.query;
    if (apiKey !== process.env.API_KEY) {
        res.status(403).send({});
    }
    const signer = (0, did_jwt_1.ES256KSigner)((0, did_jwt_1.hexToBytes)(process.env.PRIVATE_KEY));
    const vcPayload = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'IdentityProvider'],
        sub: `${address}`.toLowerCase(),
        credentialSubject: {
            name
        }
    };
    const vcJwt = yield (0, did_jwt_1.createJWT)(Object.assign({ aud: did }, vcPayload), { issuer: did, signer }, { alg: 'ES256K' });
    const webResolver = web_did_resolver_1.default.getResolver();
    const resolver = new did_resolver_1.Resolver(Object.assign({}, webResolver));
    const jwt = yield (0, did_jwt_1.verifyJWT)(vcJwt, {
        resolver,
        audience: did
    });
    let QRbase64 = yield new Promise((resolve, reject) => {
        qrcode_1.default.toDataURL(vcJwt, function (err, code) {
            if (err) {
                reject(reject);
                return;
            }
            resolve(code);
        });
    });
    res.send({ qrCode: QRbase64, jwt: vcJwt });
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
