import crypto from 'crypto';
import elliptic from 'elliptic';
import * as dotenv from 'dotenv';

dotenv.config();

//const key = crypto.randomBytes(32).toString("hex");
const key = process.env.PRIVATE_KEY!
const ec = new elliptic.ec('secp256k1');
const prv = ec.keyFromPrivate(key,'hex');
const pub = prv.getPublic();

console.log(`Public (hex): ${prv.getPublic('hex')}`)
console.log(`x (hex): ${pub.getX().toBuffer().toString('hex')}`)
console.log(`y (hex): ${pub.getY().toBuffer().toString('hex')}`)
console.log(`x (base64): ${pub.getX().toBuffer().toString('base64')}`)
console.log(`y (base64): ${pub.getY().toBuffer().toString('base64')}`)
console.log(`-- kty: EC, crv: secp256k1`)

console.log({
    "kty": "EC",
    "crv": " v",
    "x": `${pub.getX().toBuffer().toString('base64')}`,
    "y": `${pub.getY().toBuffer().toString('base64')}`
})