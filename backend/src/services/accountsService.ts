import type { Kysely, Selectable } from "kysely";
import type { DB, PlaidAccounts } from "../db/models";
import { accountBalanceService } from "./accountBalanceService";
import { plaidService } from "./plaidService";

export namespace accountsService {
  const disconnectPlaidItemIfRequired = async (
    trx: Kysely<DB>,
    plaidAccount: Selectable<PlaidAccounts>
  ) => {
    const remainingActiveAccounts = await trx
      .selectFrom("plaid_accounts")
      .innerJoin("accounts", "accounts.id", "plaid_accounts.account_id")
      .where("plaid_accounts.plaid_item_id", "=", plaidAccount.plaid_item_id)
      .where("accounts.deletedAt", "is", null)
      .select("plaid_accounts.id")
      .execute();

    console.log({ remainingActiveAccounts });

    if (remainingActiveAccounts.length === 0) {
      console.log(
        `Disconnecting account ${plaidAccount.account_id} from Plaid item ${plaidAccount.plaid_item_id}`
      );
      await plaidService.removeItem(plaidAccount.access_token);

      await trx
        .deleteFrom("plaid_accounts")
        .where("plaid_item_id", "=", plaidAccount.plaid_item_id)
        .execute();
    }
  };

  export const deleteAccount = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string
  ) => {
    await db.transaction().execute(async (trx) => {
      // Check if this is a Plaid-linked account
      const plaidAccount = await trx
        .selectFrom("plaid_accounts")
        .where("account_id", "=", accountId)
        .where("budget_id", "=", budgetId)
        .selectAll()
        .executeTakeFirst();

      // Soft delete the account
      await trx
        .updateTable("accounts")
        .set({ deletedAt: new Date() })
        .where("id", "=", accountId)
        .where("budgetId", "=", budgetId)
        .where("deletedAt", "is", null)
        .execute();

      if (plaidAccount) {
        await disconnectPlaidItemIfRequired(trx, plaidAccount);
      }

      // Recalculate all budget balances after account deletion
      await accountBalanceService.recalculateAllBudgetBalancesAfterDelete(
        trx,
        budgetId
      );
    });
  };
}
