import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { getSession } from '@/lib/auth-server';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Route for product images (sellers only)
  productImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getSession();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      if (session.user.role !== 'seller' && session.user.role !== 'admin') {
        throw new UploadThingError('Only sellers can upload product images');
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('file url', file.ufsUrl);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),

  // Route for multiple product images
  productImages: f({ image: { maxFileSize: '4MB', maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      const session = await getSession();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      if (session.user.role !== 'seller' && session.user.role !== 'admin') {
        throw new UploadThingError('Only sellers can upload product images');
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
