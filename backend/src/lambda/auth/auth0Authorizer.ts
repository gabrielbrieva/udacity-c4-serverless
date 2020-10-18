import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-saet8-p4.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  try {
    const jwt: Jwt = decode(token, { complete: true }) as Jwt
    const key = await getSigningKey(jwt.header.kid)

    return verify(token, key.publicKey, { algorithms: ['RS256'] }) as JwtPayload

  } catch (err) {
    console.log(err);
  }

  return null;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

interface ISignedKey {
  kid: string,
  nbf: string,
  publicKey: string
}

async function getSigningKey(jwtKid: string): Promise<ISignedKey> {

  if (!jwtKid)
    throw new Error('jwtKid arg is required')

  const response = await Axios.get(jwksUrl, {
    responseType: 'json'
  });

  let keys = response?.data?.keys

  if (!keys || !keys.length)
    throw new Error('The JWKS endpoint did not contain any keys')

  const signedKeys: ISignedKey[] = keys = keys
    .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
      && key.kty === 'RSA' // We are only supporting RSA
      && key.kid           // The `kid` must be present to be useful for later
      && key.x5c && key.x5c.length // Has useful public keys (we aren't using n or e)
    ).map(key => {
      return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) }
    });

  // If at least a single signing key doesn't exist we have a problem... Kaboom.
  if (!signedKeys.length)
    throw new Error('The JWKS endpoint did not contain any signing keys')

  const signingKey = signedKeys.find(key => key.kid === jwtKid)

  if (!signingKey)
    throw new Error(`Unable to find a signing key that matches '${jwtKid}'`)

  return signingKey;
}

function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}