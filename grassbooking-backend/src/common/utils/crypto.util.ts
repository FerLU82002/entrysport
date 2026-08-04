import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY no está configurada');
  }
  return scryptSync(secret, 'chocolaterospe-salt', 32);
}

export function encriptar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), cifrado.toString('hex')].join(':');
}

export function desencriptar(valor: string): string {
  const [ivHex, authTagHex, cifradoHex] = valor.split(':');
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const descifrado = Buffer.concat([
    decipher.update(Buffer.from(cifradoHex, 'hex')),
    decipher.final(),
  ]);
  return descifrado.toString('utf8');
}
