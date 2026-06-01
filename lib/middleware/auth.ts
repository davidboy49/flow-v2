import { adminAuth } from '@/lib/firebase/admin'
import { NextRequest } from 'next/server'

export async function verifyIdToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }
  const token = authHeader.split('Bearer ')[1]
  const decoded = await adminAuth.verifyIdToken(token)
  return decoded.uid
}
