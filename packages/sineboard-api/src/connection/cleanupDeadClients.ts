import { ConnectionManager } from './ConnectionManager';
import { DataSourceManager } from '../datasource';

export function cleanupDeadClientJob(connection: ConnectionManager, datasourceManager: DataSourceManager) {
  setInterval(async () => {
    await findDeadClients(connection, datasourceManager);
  }, 60000 * 5);
}

async function findDeadClients(connection: ConnectionManager, datasourceManager: DataSourceManager) {
  const lookBackDate = (new Date().setMinutes(new Date().getMinutes() - 5) / 1000).toFixed(0);
  const clientsToClear = await connection.redis.zrangebyscore('clientHeartbeat', 0, lookBackDate);
  for await (const client of clientsToClear) {
    connection.redis.multi()
      .srem('clients', client)
      .lrem('TemplateInitialization', 0, `client:${client}`)
      .del(`client:${client}`)
      .del(`rendered:${client}`)
      .zrem('clientHeartbeat', client)
      .exec();
    connection.redis.scanStream({ match: `rendered:${client}:*` }).on('data', (keys: string[]) => connection.redis.del(...keys));

    const jobsToDelete = Array.from(datasourceManager.scheduleJobs.keys()).filter((job) => job.split(':')[0] === client);
    datasourceManager.remove(...jobsToDelete);
  }
}
