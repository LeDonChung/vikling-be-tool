import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import configuration from './configuration';
import { DataSource } from 'typeorm';
import { Job } from 'src/entities/job.entity';

export const TypeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [],
  useFactory: (): TypeOrmModuleOptions => {
    const config = configuration();
    return {
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.database,
      extra: {
        connectionLimit: 5,
        acquireTimeout: 30000,
        timeout: 30000,
        reconnect: true,
        multipleStatements: false,
        idleTimeout: 300000,
        maxReconnects: 3,
        reconnectDelay: 2000,
      },
      entities: [Job],
      synchronize: false,
      logging: false,
      migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
      migrationsTableName: 'typeorm_migrations',
    };
  },
  inject: [],
};

const config = configuration();

const dataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  extra: {
    connectionLimit: 3,
    acquireTimeout: 20000,
    timeout: 20000,
  },
  entities: [Job],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
});

export default dataSource;
