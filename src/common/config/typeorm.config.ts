import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import configuration from './configuration';
import { DataSource } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import { Token } from 'src/entities/token.entity';
import { TokenDevice } from 'src/entities/token-device.entity';

// Load .env file for TypeORM CLI
dotenvConfig();

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
      entities: [Token, TokenDevice],
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
  entities: [Token, TokenDevice],
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
});

export default dataSource;
