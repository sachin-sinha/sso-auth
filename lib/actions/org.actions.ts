import type { AccountInfo } from '@/types/organization';
import { getAccountInfo } from '@/lib/actions/auth.actions';
import { authTokenPayload } from '@/lib/actions/verifications.actions';
import { logger } from '@/lib/utils/logger';

type SingleOrgResponse = Promise<[AccountInfo | null, string]>;

export class OrgActions {
  readonly useridForLogging: string;

  constructor({ userid }: { userid: string }) {
    this.useridForLogging = userid;
  }

  private async fetchOrgWithFilter({
    filterAttribute,
    filterValue
  }: {
    filterAttribute: string;
    filterValue: string;
  }): SingleOrgResponse {
    try {
      // Get the organization by filter
      const res = await getAccountInfo(
        authTokenPayload({
          userid: this.useridForLogging || filterValue, // userid is being passed, just for logging purpose
          option: 'all',
          filter: `(${filterAttribute} = "${filterValue}")`
        })
      );

      if (res?.rows?.length > 0) {
        const row = res?.rows[0];
        const parsedAccountInfo = JSON.parse(row?.v);

        if (parsedAccountInfo?.organization?.id) {
          return [parsedAccountInfo as AccountInfo, ''];
        }

        return [null, 'Organization not found']; // Return error
      } else {
        return [null, 'Organization not found']; // Return error
      }
    } catch (error) {
      const msg = 'Failed to get organization by ' + filterAttribute;
      logger.error({ error, msg, fields: { filterAttribute, filterValue } });
      return [null, msg];
    }
  }

  /**
   * Check the org by `id` in the `userservice`
   */
  async getOrgById({ id }: { id: string }): SingleOrgResponse {
    return this.fetchOrgWithFilter({
      filterAttribute: 'organization.id',
      filterValue: id
    });
  }

  /**
   * Check the org by `scimToken` in the `userservice`
   */
  async getOrgBySCIMToken({ scimToken }: { scimToken: string }): SingleOrgResponse {
    return this.fetchOrgWithFilter({
      filterAttribute: 'organization.scimToken',
      filterValue: scimToken
    });
  }

  /**
   * Check the org by `domain` in the `userservice`
   */
  async getOrgByDomain({ domain }: { domain: string }): SingleOrgResponse {
    return this.fetchOrgWithFilter({
      filterAttribute: 'organization.domain',
      filterValue: domain
    });
  }
}
