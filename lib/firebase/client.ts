import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-api-key-for-build-prerender',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:12345:web:12345',
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)

// SSO providers
export const googleProvider = new GoogleAuthProvider()
export const microsoftProvider = new OAuthProvider('microsoft.com')
// For enterprise SAML/OIDC — configure the provider ID in Firebase Console first
export const samlProvider = new OAuthProvider('saml.your-provider-id')
