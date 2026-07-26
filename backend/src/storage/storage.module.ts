import { Module, Global } from '@nestjs/common';
import { StorageProvider } from './storage.provider';
import { MinIOStorageProvider } from './minio-storage.provider';

@Global()
@Module({
  providers: [
    {
      provide: StorageProvider,
      useClass: MinIOStorageProvider,
    },
  ],
  exports: [StorageProvider],
})
export class StorageModule {}
