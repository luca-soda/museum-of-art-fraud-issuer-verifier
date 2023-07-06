import { Issuer, JwtCredentialPayload, createVerifiableCredentialJwt, verifyCredential } from "did-jwt-vc";
import express from 'express';
import * as dotenv from 'dotenv';
import { getResolver } from 'ethr-did-resolver';
import { Resolver } from 'did-resolver';
import web from 'web-did-resolver';
import { ES256KSigner, hexToBytes, createJWT, verifyJWT } from 'did-jwt';
import fs from 'fs';
import qrCode from 'qrcode';
import cors from 'cors';
import storage from 'node-persist';
import { Contract, JsonRpcProvider, ethers, sha256 } from 'ethers';
import abi from './abi.json';

dotenv.config();

const app = express();
const port = process.env.PORT;

const provider = new JsonRpcProvider(process.env.RPC!);
const contract = new Contract(process.env.CONTRACT_ADDRESS!, abi, provider)

storage.init({
    dir: 'db',
    logging(...args) {
        console.log(args);
    },
});
const did = `did:web:issuer-verifier-express.delightfulriver-e0d8cb6b.westeurope.azurecontainerapps.io`;

app.use(cors({
    origin: '*'
}))

app.use(express.json());

app.get('/.well-known/did.json', (req, res) => {
    res.send(fs.readFileSync('.well-known/did.json').toString());
});

app.get('/verifierQrCode', async (req, res) => {
    let QRbase64 = await new Promise((resolve, reject) => {
        qrCode.toDataURL(Buffer.from('https://issuer-verifier-express.delightfulriver-e0d8cb6b.westeurope.azurecontainerapps.io/verifier').toString('base64'), function (err, code) {
            if (err) {
                reject(reject);
                return;
            }
            resolve(code);
        });
    });

    return res.send({qrCode: QRbase64});
});

app.post('/verifier', async (req, res) => {
    const { jwt } = req.body

    const webResolver = web.getResolver();

    const resolver = new Resolver({
        ...webResolver
    })
    try {
        const vc = await verifyJWT(jwt, {
            resolver,
            audience: did
        });

        if (vc.verified) {
            const [name, tokenId, hashVc] = await contract.identity(vc.payload.sub);
            if (hashVc === sha256(Buffer.from(jwt))){
                await storage.setItem(vc.payload.sub!.toLowerCase(), JSON.stringify(true));
            }
        }
        res.status(200).send({});
    }
    catch (error) {
        console.log(error);
        res.status(500).send({});
    }
});

app.get('/isVerified', async (req: any, res: any) => {
    let { address } = req.query;
    address = `${address}`.toLocaleLowerCase();
    const ver = await storage.getItem(address);
    if (ver != null) {
        res.status(200).send({ verified: JSON.parse(ver) });
    }
    else {
        res.status(200).send({ verified: false });
    }
});

app.get('/', async (req: any, res: any) => {
    const { name, address, apiKey } = req.query;
    if (apiKey !== process.env.API_KEY) {
        res.status(403).send({});
    }
    const signer = ES256KSigner(hexToBytes(process.env.PRIVATE_KEY!));

    const vcPayload = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'IdentityProvider'],
        sub: `${address}`.toLowerCase(),
        credentialSubject: {
            name
        }
    };

    const vcJwt = await createJWT(
        { aud: did,  ...vcPayload },
        { issuer: did, signer },
        { alg: 'ES256K' }
    )

    const webResolver = web.getResolver();

    const resolver = new Resolver({
        ...webResolver
    })


    const jwt = await verifyJWT(vcJwt, {
        resolver,
        audience: did
    })

    let QRbase64 = await new Promise((resolve, reject) => {
        qrCode.toDataURL(vcJwt, function (err, code) {
            if (err) {
                reject(reject);
                return;
            }
            resolve(code);
        });
    });

    res.send({ qrCode: QRbase64, jwt: vcJwt });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

