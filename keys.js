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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elliptic_1 = __importDefault(require("elliptic"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
//const key = crypto.randomBytes(32).toString("hex");
const key = process.env.PRIVATE_KEY;
const ec = new elliptic_1.default.ec('secp256k1');
const prv = ec.keyFromPrivate(key, 'hex');
const pub = prv.getPublic();
console.log(`Public (hex): ${prv.getPublic('hex')}`);
console.log(`x (hex): ${pub.getX().toBuffer().toString('hex')}`);
console.log(`y (hex): ${pub.getY().toBuffer().toString('hex')}`);
console.log(`x (base64): ${pub.getX().toBuffer().toString('base64')}`);
console.log(`y (base64): ${pub.getY().toBuffer().toString('base64')}`);
console.log(`-- kty: EC, crv: secp256k1`);
console.log({
    "kty": "EC",
    "crv": " v",
    "x": `${pub.getX().toBuffer().toString('base64')}`,
    "y": `${pub.getY().toBuffer().toString('base64')}`
});
