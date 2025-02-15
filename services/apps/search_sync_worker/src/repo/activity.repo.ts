import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbActivitySyncData } from './activity.data'

export class ActivityRepository extends RepositoryBase<ActivityRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async getActivityData(activityIds: string[]): Promise<IDbActivitySyncData[]> {
    const results = await this.db().any(
      `
      select id,
            "tenantId",
            "segmentId",
            type,
            timestamp,
            platform,
            "isContribution",
            score,
            "sourceId",
            "sourceParentId",
            attributes,
            channel,
            body,
            title,
            url,
            (sentiment -> 'sentiment')::int as sentiment,
            "importHash",
            "memberId",
            "conversationId",
            "parentId",
            username,
            "objectMemberId",
            "objectMemberUsername"
      from activities where id in ($(activityIds:csv))
    `,
      {
        activityIds,
      },
    )

    return results
  }

  public async checkActivitiesExist(tenantId: string, activityIds: string[]): Promise<string[]> {
    const results = await this.db().any(
      `
      select id from activities where "tenantId" = $(tenantId) and id in ($(activityIds:csv))
    `,
      {
        tenantId,
        activityIds,
      },
    )

    return results.map((r) => r.id)
  }

  public async markSynced(activityIds: string[]): Promise<void> {
    await this.db().none(
      `update activities set "searchSyncedAt" = now() where id in ($(activityIds:csv))`,
      {
        activityIds,
      },
    )
  }

  public async getTenantActivitiesForSync(
    tenantId: string,
    page: number,
    perPage: number,
    cutoffDate: string,
  ): Promise<string[]> {
    const results = await this.db().any(
      `
      select id from activities 
      where "tenantId" = $(tenantId) and 
            (
              "searchSyncedAt" is null or
              "searchSyncedAt" < $(cutoffDate)
            )
      limit ${perPage} offset ${(page - 1) * perPage};
      `,
      {
        tenantId,
        cutoffDate,
      },
    )

    return results.map((r) => r.id)
  }

  public async getTenantIds(): Promise<string[]> {
    const results = await this.db().any(`select distinct "tenantId" from activities;`)

    return results.map((r) => r.tenantId)
  }
}
