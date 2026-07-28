import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query, 
  orderBy
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import rawFirebaseConfig from '../../firebase-applet-config.json';
import { Bug, BugComment, BugStatus, UserProfile, UserRole } from '../types';

const defaultConfig = {
  projectId: 'iconic-shine-9x4wp',
  appId: '1:1009061138952:web:72d662b2430827618177bd',
  apiKey: 'AIzaSyCv_BGZC0f_YGtMmhbldesGE8QiYDtNOhE',
  authDomain: 'iconic-shine-9x4wp.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-bugboard-00d01504-4a9c-4abb-a9d4-9cd5161d3d22',
  storageBucket: 'iconic-shine-9x4wp.firebasestorage.app',
  messagingSenderId: '1009061138952',
  measurementId: '',
  recaptchaSiteKey: ''
};

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  ...defaultConfig,
  ...(typeof rawFirebaseConfig === 'object' && rawFirebaseConfig ? rawFirebaseConfig : {}),
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || rawFirebaseConfig?.apiKey || defaultConfig.apiKey,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || rawFirebaseConfig?.projectId || defaultConfig.projectId,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || rawFirebaseConfig?.authDomain || defaultConfig.authDomain,
  appId: metaEnv.VITE_FIREBASE_APP_ID || rawFirebaseConfig?.appId || defaultConfig.appId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || rawFirebaseConfig?.storageBucket || defaultConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || rawFirebaseConfig?.messagingSenderId || defaultConfig.messagingSenderId,
};
import { uploadFileToDrive } from './drive';
import { saveMediaToVault } from './mediaVault';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.warn('Firestore Error Info: ', JSON.stringify(errInfo));
  return errInfo;
}

const DATABASE_ID = firebaseConfig.firestoreDatabaseId || 'ai-studio-bugboard-00d01504-4a9c-4abb-a9d4-9cd5161d3d22';

// Initialize Firebase App, Auth, Firestore & Cloud Storage
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore with database ID
export const db = getFirestore(app, DATABASE_ID);
export const bugsCollection = collection(db, 'bugs');
export const usersCollection = collection(db, 'users');

// Test Firestore connection on boot without throwing
async function validateConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore offline notice during connection test:', error.message);
    }
  }
}
validateConnection().catch(() => {});

// Cloud Storage
export const storage = getStorage(app);

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const fileName = (file.name || '').toLowerCase();
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic|heif|bmp)$/i.test(fileName);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = (e.target?.result as string) || '';
        if (!result) return resolve('');

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width || 800;
            let height = img.height || 600;
            const maxDim = 800;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              let dataUrl = canvas.toDataURL('image/jpeg', 0.60);

              if (dataUrl.length > 300000) {
                // Secondary tighter compression pass to ensure < 300KB
                const canvas2 = document.createElement('canvas');
                const scale = 550 / Math.max(width, height);
                canvas2.width = Math.round(width * scale);
                canvas2.height = Math.round(height * scale);
                const ctx2 = canvas2.getContext('2d');
                if (ctx2) {
                  ctx2.drawImage(img, 0, 0, canvas2.width, canvas2.height);
                  dataUrl = canvas2.toDataURL('image/jpeg', 0.45);
                }
              }

              resolve(dataUrl);
              return;
            }
          } catch (err) {
            console.warn('Canvas image compression notice:', err);
          }

          resolve(result);
        };

        img.onerror = () => resolve(result);
        img.src = result;
      };

      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    } else {
      // Video and Audio files
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = (reader.result as string) || '';
        resolve(result);
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    }
  });
}

/**
 * Uploads a media file (image, video, or audio) directly to Google Drive.
 * Pure Google Drive storage system without Firebase Storage.
 */
export async function uploadMediaToStorage(
  file: File,
  folderPath: string = 'bugs/general',
  fileNamePrefix: string = 'media'
): Promise<string> {
  const driveToken = sessionStorage.getItem('google_drive_token') 
    || localStorage.getItem('owner_google_drive_token') 
    || sessionStorage.getItem('owner_google_drive_token');

  // 1. Primary: Upload directly to Google Drive
  try {
    const driveRes = await uploadFileToDrive(file, driveToken || undefined);
    if (driveRes && driveRes.directUrl) {
      return driveRes.directUrl;
    }
  } catch (e) {
    console.warn('Google Drive primary upload notice:', e);
  }

  // 2. Portable Data URL fallback if Drive is offline or unauthenticated
  try {
    const dataUrl = await fileToDataUrl(file);
    if (dataUrl) {
      return dataUrl;
    }
  } catch (e) {
    console.warn('fileToDataUrl fallback notice:', e);
  }

  return '';
}

// User Role Helper
export async function getOrSetUserRole(firebaseUser: FirebaseUser): Promise<UserRole> {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const getDocPromise = getDoc(userRef);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000));

    const userSnap = await Promise.race([getDocPromise, timeoutPromise]);

    if (userSnap && userSnap.exists()) {
      const data = userSnap.data();
      if (data.role) {
        return data.role as UserRole;
      }
    }

    const isOwnerEmail = firebaseUser.email?.toLowerCase() === 'finm7854@gmail.com';
    let isFirstUser = false;
    try {
      const getDocsPromise = getDocs(usersCollection);
      const docsTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const usersSnap = await Promise.race([getDocsPromise, docsTimeout]);
      if (usersSnap) {
        isFirstUser = usersSnap.empty;
      }
    } catch (e) {
      // ignore check error
    }

    const role: UserRole = (isOwnerEmail || isFirstUser) ? 'Admin' : 'Member';

    setDoc(userRef, {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email,
      photoURL: firebaseUser.photoURL,
      role: role,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch((err) => console.warn('setDoc role warning:', err));

    return role;
  } catch (error) {
    console.warn("Notice: setting/getting user role fallback:", error);
    return firebaseUser.email?.toLowerCase() === 'finm7854@gmail.com' ? 'Admin' : 'Member';
  }
}

export async function updateUserRoleInDb(uid: string, newRole: UserRole): Promise<void> {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: new Date().toISOString()
  });
}

// Local user fallback helper for domain-restricted environments
let authStateCallback: ((user: UserProfile | null) => void) | null = null;

export function getStoredLocalUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem('bugboard_local_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function setStoredLocalUser(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem('bugboard_local_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bugboard_local_user');
    }
  } catch (e) {}
  if (authStateCallback) {
    authStateCallback(user);
  }
}

// Google Sign-In function
export async function signInWithGoogle(): Promise<{ user: UserProfile | null; accessToken?: string }> {
  try {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
      return { user: null };
    }

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    const user = result.user;
    const role = await getOrSetUserRole(user);

    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role,
      accessToken
    };
    if (accessToken) {
      sessionStorage.setItem('google_drive_token', accessToken);
      localStorage.setItem('owner_google_drive_token', accessToken);
      sessionStorage.setItem('owner_google_drive_token', accessToken);
    }
    setStoredLocalUser(profile);
    return { user: profile, accessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-blocked' || 
      error?.code === 'auth/popup-closed-by-user' || 
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup')
    ) {
      console.log('Sign-in popup blocked or closed; triggering standard Google OAuth redirect.');
      try {
        await signInWithRedirect(auth, googleProvider);
        return { user: null };
      } catch (redirectErr) {
        console.error('Redirect sign-in error:', redirectErr);
      }
    }
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      console.warn('Firebase Auth unauthorized-domain error encountered. Falling back to local user session.');
      const fallbackProfile: UserProfile = {
        uid: 'user_fallback_owner',
        displayName: 'Finm (Admin)',
        email: 'finm7854@gmail.com',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        role: 'Admin'
      };
      setStoredLocalUser(fallbackProfile);
      return { user: fallbackProfile };
    }
    console.error('Google sign in error:', error);
    throw error;
  }
}

// Directly connect/sign in with any Gmail email address
export function loginWithGmailAddress(email: string, name?: string): UserProfile {
  const cleanEmail = email.trim().toLowerCase();
  const displayName = name?.trim() || cleanEmail.split('@')[0] || 'Gmail User';
  const uid = `gmail_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const profile: UserProfile = {
    uid,
    displayName,
    email: cleanEmail,
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
    role: 'Admin'
  };
  setStoredLocalUser(profile);
  try {
    const userRef = doc(db, 'users', uid);
    setDoc(userRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
  } catch (e) {}
  return profile;
}

export async function logOut(): Promise<void> {
  sessionStorage.removeItem('google_drive_token');
  setStoredLocalUser(null);
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('firebaseSignOut warning:', e);
  }
}

export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  authStateCallback = callback;
  const initialLocalUser = getStoredLocalUser();
  if (initialLocalUser) {
    callback(initialLocalUser);
  }

  // Handle OAuth redirect results (especially for mobile/Android)
  getRedirectResult(auth)
    .then(async (result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;
        const user = result.user;
        const role = await getOrSetUserRole(user);
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          photoURL: user.photoURL,
          role,
          accessToken
        };
        if (accessToken) {
          sessionStorage.setItem('google_drive_token', accessToken);
          localStorage.setItem('owner_google_drive_token', accessToken);
          sessionStorage.setItem('owner_google_drive_token', accessToken);
        }
        setStoredLocalUser(profile);
      }
    })
    .catch((err) => {
      console.warn('Google Auth redirect result notice:', err);
    });

  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const storedToken = sessionStorage.getItem('google_drive_token') || undefined;
      const role = await getOrSetUserRole(firebaseUser);

      const profile: UserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        role,
        accessToken: storedToken
      };
      setStoredLocalUser(profile);
      callback(profile);
    } else {
      const localUser = getStoredLocalUser();
      callback(localUser);
    }
  });
}

// Live Bug Board Subscription using Firestore real-time listener (onSnapshot)
export function subscribeToBugs(
  callback: (bugs: Bug[]) => void,
  onError?: (errorInfo: FirestoreErrorInfo) => void
) {
  const q = query(bugsCollection, orderBy('createdAt', 'desc'));
  
  const processDocs = (snapshot: any) => {
    const bugsList: Bug[] = snapshot.docs.map((docSnap: any) => {
      const data = docSnap.data();
      
      const imageUrls: string[] = Array.isArray(data.imageUrls)
        ? data.imageUrls
        : (data.photoUrl ? [data.photoUrl] : []);
        
      const videoUrls: string[] = Array.isArray(data.videoUrls)
        ? data.videoUrls
        : (data.videoUrl ? [data.videoUrl] : []);
        
      const audioUrls: string[] = Array.isArray(data.audioUrls)
        ? data.audioUrls
        : [];

      const photoUrl = data.photoUrl || (imageUrls.length > 0 ? imageUrls[0] : '');
      const videoUrl = data.videoUrl || (videoUrls.length > 0 ? videoUrls[0] : '');
      const priorityLevel = data.priorityLevel || data.priority || 'Medium';
      const category = data.category || (Array.isArray(data.tags) ? data.tags.join(', ') : 'General');
      const authorName = data.authorName || data.createdBy || 'Anonymous';
      const solverName = data.solverName || data.solvedBy || '';

      return {
        id: docSnap.id,
        title: data.title || 'Untitled Bug',
        description: data.description || '',
        status: (data.status as BugStatus) || 'open',
        priorityLevel,
        category,
        authorName,
        createdAt: data.createdAt || new Date().toISOString(),
        solverName,
        solvedAt: data.solvedAt || '',
        imageUrls,
        videoUrls,
        audioUrls,

        // Backwards compatibility fields
        photoUrl,
        videoUrl,
        photoDriveId: data.photoDriveId || '',
        videoDriveId: data.videoDriveId || '',
        solvedBy: solverName,
        priority: priorityLevel as any,
        tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : [category],
        createdBy: authorName,
        createdByEmail: data.createdByEmail || ''
      };
    });
    return bugsList;
  };

  const unsub = onSnapshot(q, (snapshot) => {
    callback(processDocs(snapshot));
  }, (err) => {
    console.warn("Primary bugs query failed, trying unsorted query...", err);
    if (onError) {
      const errInfo = handleFirestoreError(err, OperationType.GET, 'bugs');
      onError(errInfo);
    }
    // Fallback: try unsorted query if index or query error occurs
    onSnapshot(bugsCollection, (snapshot) => {
      const bugsList = processDocs(snapshot);
      bugsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(bugsList);
    }, (fallbackErr) => {
      console.warn("Fallback bugs listener failed:", fallbackErr);
      if (onError) {
        const errInfo = handleFirestoreError(fallbackErr, OperationType.GET, 'bugs');
        onError(errInfo);
      }
    });
  });

  return () => {
    unsub();
  };
}

// Add or update a Bug document with a specific ID to prevent duplicates
export async function createBugWithId(customId: string, bugData: Omit<Bug, 'id'> & { id?: string }) {
  const imageUrls = bugData.imageUrls || (bugData.photoUrl ? [bugData.photoUrl] : []);
  const videoUrls = bugData.videoUrls || (bugData.videoUrl ? [bugData.videoUrl] : []);
  const audioUrls = bugData.audioUrls || [];

  const authorName = bugData.authorName || bugData.createdBy || 'Anonymous';
  const solverName = bugData.solverName || bugData.solvedBy || '';
  const priorityLevel = bugData.priorityLevel || bugData.priority || 'Medium';
  const category = bugData.category || (bugData.tags ? bugData.tags.join(', ') : 'General');

  const payload = {
    title: bugData.title,
    description: bugData.description || bugData.title,
    status: bugData.status || 'open',
    priorityLevel,
    category,
    authorName,
    createdAt: bugData.createdAt || new Date().toISOString(),
    solverName,
    solvedAt: bugData.solvedAt || '',
    imageUrls,
    videoUrls,
    audioUrls,

    // Backwards compatibility fields
    photoUrl: bugData.photoUrl || (imageUrls.length > 0 ? imageUrls[0] : ''),
    videoUrl: bugData.videoUrl || (videoUrls.length > 0 ? videoUrls[0] : ''),
    priority: priorityLevel,
    tags: bugData.tags || [category],
    createdBy: authorName,
    createdByEmail: bugData.createdByEmail || ''
  };

  try {
    const bugDocRef = doc(db, 'bugs', customId);
    await setDoc(bugDocRef, payload, { merge: true });
    return customId;
  } catch (err) {
    console.warn("Notice: createBugWithId Firestore notice:", err);
    return customId;
  }
}

// Add a new Bug document to Firestore
export async function createBug(bugData: Omit<Bug, 'id'>) {
  const imageUrls = bugData.imageUrls || (bugData.photoUrl ? [bugData.photoUrl] : []);
  const videoUrls = bugData.videoUrls || (bugData.videoUrl ? [bugData.videoUrl] : []);
  const audioUrls = bugData.audioUrls || [];

  const authorName = bugData.authorName || bugData.createdBy || 'Anonymous';
  const solverName = bugData.solverName || bugData.solvedBy || '';
  const priorityLevel = bugData.priorityLevel || bugData.priority || 'Medium';
  const category = bugData.category || (bugData.tags ? bugData.tags.join(', ') : 'General');

  const payload = {
    title: bugData.title,
    description: bugData.description || bugData.title,
    status: bugData.status || 'open',
    priorityLevel,
    category,
    authorName,
    createdAt: bugData.createdAt || new Date().toISOString(),
    solverName,
    solvedAt: bugData.solvedAt || '',
    imageUrls,
    videoUrls,
    audioUrls,

    // Backwards compatibility fields
    photoUrl: bugData.photoUrl || (imageUrls.length > 0 ? imageUrls[0] : ''),
    videoUrl: bugData.videoUrl || (videoUrls.length > 0 ? videoUrls[0] : ''),
    priority: priorityLevel,
    tags: bugData.tags || [category],
    createdBy: authorName,
    createdByEmail: bugData.createdByEmail || ''
  };

  try {
    const addPromise = addDoc(bugsCollection, payload);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore addDoc timeout')), 2500)
    );
    const docRef = await Promise.race([addPromise, timeoutPromise]);
    return docRef.id;
  } catch (err) {
    console.warn("Notice: createBug Firestore notice (using fallback docId):", err);
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }
}

// Mark Bug as Solved (Preserves all media attachments so they remain accessible)
export async function markBugSolvedInDb(bugId: string, solverName: string) {
  try {
    const bugRef = doc(db, 'bugs', bugId);
    const resolvedSolver = solverName.trim() || 'Anonymous Friend';
    await updateDoc(bugRef, {
      status: 'solved',
      solverName: resolvedSolver,
      solvedBy: resolvedSolver,
      solvedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Notice: Firestore updateDoc fallback for markBugSolvedInDb:", err);
  }
}

// Add Comment to Bug
export async function addCommentToBug(
  bugId: string,
  text: string,
  authorName: string,
  authorEmail?: string,
  authorPhoto?: string,
  audioUrl?: string
) {
  try {
    const commentsRef = collection(db, 'bugs', bugId, 'comments');
    const docRef = await addDoc(commentsRef, {
      bugId,
      text: text.trim(),
      authorName: authorName.trim() || 'Community Member',
      authorEmail: authorEmail || '',
      authorPhoto: authorPhoto || '',
      audioUrl: audioUrl || '',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    console.error('Failed to add comment to Firestore:', err);
    throw err;
  }
}

// Subscribe to Comments for a Bug
export function subscribeToComments(bugId: string, callback: (comments: BugComment[]) => void) {
  try {
    const commentsRef = collection(db, 'bugs', bugId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: BugComment[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as BugComment);
        });
        callback(list);
      },
      (err) => {
        console.warn('Comments realtime listener notice:', err);
        // Fallback unsorted
        onSnapshot(
          commentsRef,
          (snapshot) => {
            const list: BugComment[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as BugComment);
            });
            list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            callback(list);
          },
          () => callback([])
        );
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to comments:', err);
    callback([]);
    return () => {};
  }
}

// Reopen Bug (Mark as Open)
export async function reopenBugInDb(bugId: string) {
  try {
    const bugRef = doc(db, 'bugs', bugId);
    await updateDoc(bugRef, {
      status: 'open',
      solverName: '',
      solvedBy: '',
      solvedAt: ''
    });
  } catch (err) {
    console.warn("Notice: Firestore updateDoc fallback for reopenBugInDb:", err);
  }
}

// Append new photos/videos/audio to an existing bug document
export async function addMediaToBugInDb(
  bugId: string,
  newImageUrls: string[],
  newVideoUrls: string[],
  newAudioUrls: string[] = []
) {
  try {
    const bugRef = doc(db, 'bugs', bugId);
    const snap = await getDoc(bugRef);
    if (!snap.exists()) return;
    const data = snap.data();

    const existingImages: string[] = Array.isArray(data.imageUrls)
      ? data.imageUrls
      : (data.photoUrl ? [data.photoUrl] : []);
      
    const existingVideos: string[] = Array.isArray(data.videoUrls)
      ? data.videoUrls
      : (data.videoUrl ? [data.videoUrl] : []);

    const existingAudios: string[] = Array.isArray(data.audioUrls)
      ? data.audioUrls
      : [];

    const updatedImages = [...existingImages, ...newImageUrls];
    const updatedVideos = [...existingVideos, ...newVideoUrls];
    const updatedAudios = [...existingAudios, ...newAudioUrls];

    await updateDoc(bugRef, {
      imageUrls: updatedImages,
      videoUrls: updatedVideos,
      audioUrls: updatedAudios,
      photoUrl: updatedImages[0] || '',
      videoUrl: updatedVideos[0] || ''
    });
  } catch (err) {
    console.error('Failed to update bug media in Firestore:', err);
    throw err;
  }
}

// Remove a specific media URL from a bug
export async function removeMediaFromBugInDb(
  bugId: string,
  mediaUrlToRemove: string,
  mediaType: 'image' | 'video' | 'audio'
) {
  try {
    const bugRef = doc(db, 'bugs', bugId);
    const snap = await getDoc(bugRef);
    if (!snap.exists()) return;
    const data = snap.data();

    if (mediaType === 'image') {
      const existing: string[] = Array.isArray(data.imageUrls) ? data.imageUrls : (data.photoUrl ? [data.photoUrl] : []);
      const updated = existing.filter((url) => url !== mediaUrlToRemove);
      await updateDoc(bugRef, {
        imageUrls: updated,
        photoUrl: updated[0] || ''
      });
    } else if (mediaType === 'video') {
      const existing: string[] = Array.isArray(data.videoUrls) ? data.videoUrls : (data.videoUrl ? [data.videoUrl] : []);
      const updated = existing.filter((url) => url !== mediaUrlToRemove);
      await updateDoc(bugRef, {
        videoUrls: updated,
        videoUrl: updated[0] || ''
      });
    } else if (mediaType === 'audio') {
      const existing: string[] = Array.isArray(data.audioUrls) ? data.audioUrls : [];
      const updated = existing.filter((url) => url !== mediaUrlToRemove);
      await updateDoc(bugRef, {
        audioUrls: updated
      });
    }
  } catch (err) {
    console.error('Failed to remove media from bug in Firestore:', err);
    throw err;
  }
}

// Delete Bug Video
export async function deleteBugVideoInDb(bugId: string) {
  try {
    const bugRef = doc(db, 'bugs', bugId);
    await updateDoc(bugRef, {
      videoUrl: '',
      videoDriveId: ''
    });
  } catch (err) {
    console.warn("Notice: Firestore updateDoc fallback for deleteBugVideoInDb:", err);
  }
}

// Delete Bug
export async function deleteBugInDb(bugId: string) {
  try {
    const bugRef = doc(db, 'bugs', bugId);
    await deleteDoc(bugRef);
  } catch (err) {
    console.warn("Notice: Firestore deleteDoc fallback for deleteBugInDb:", err);
  }
}

// Initial Sample Data (Empty - demo bugs removed)
const INITIAL_SAMPLE_BUGS: Omit<Bug, 'id'>[] = [];

const DEMO_TITLES = [
  "Layout shift on login",
  "API Timeout on Filter",
  "Token refresh failure",
  "Websocket disconnect"
];

export async function clearDemoBugsFromDb() {
  // No-op to preserve user created bugs
}

export async function seedSampleBugsIfEmpty() {
  // No-op
}
