import { adminApi } from "./api";
import { useAdminAction, useCopy } from "./queries";
import { useToast } from "./toast";

interface BusinessRef {
  id: string;
  name: string;
  active: boolean;
  cardCount: number;
}

/** Everything you can do to a business from the dashboard, with the confirmations it needs. */
export function useBusinessActions() {
  const showToast = useToast();
  const copy = useCopy();

  const setActive = useAdminAction((v: { id: string; active: boolean }) =>
    adminApi.updateBusiness(v.id, { active: v.active }),
  );
  const setReviewUrl = useAdminAction(
    (v: { id: string; reviewUrl: string }) => adminApi.updateBusiness(v.id, { reviewUrl: v.reviewUrl }),
    { success: "Link updated: every card for this business now goes there" },
  );
  const remove = useAdminAction(
    (v: { id: string; deleteCards: boolean }) => adminApi.deleteBusiness(v.id, v.deleteCards),
    {
      success: (result) =>
        result.cards === "delete"
          ? "Business and its cards deleted"
          : result.affectedCards > 0
            ? `Business deleted, ${result.affectedCards} card(s) kept as blank stock`
            : "Business deleted",
    },
  );
  const createOwnerLink = useAdminAction(adminApi.createOwnerLink);
  const removeOwnerLink = useAdminAction(adminApi.removeOwnerLink, { success: "Owner dashboard turned off" });

  return {
    togglePaused(business: BusinessRef) {
      setActive.mutate({ id: business.id, active: !business.active });
    },

    changeReviewUrl(business: BusinessRef) {
      const reviewUrl = window.prompt(`New Google review link or Place ID for "${business.name}":`);
      if (reviewUrl) setReviewUrl.mutate({ id: business.id, reviewUrl });
    },

    delete(business: BusinessRef) {
      if (!window.confirm(`Delete "${business.name}" and all its taps?\n\nThis can't be undone.`)) return;
      const deleteCards =
        business.cardCount > 0 &&
        window.confirm(
          `Also delete its ${business.cardCount} card(s)?\n\nOK = delete the cards too\n` +
            "Cancel = keep them as blank stock you can assign to another business",
        );
      remove.mutate({ id: business.id, deleteCards });
    },

    /** Copies the owner link, creating one first if the business doesn't have it yet. */
    async copyOwnerLink(businessId: string, existingUrl: string | null) {
      try {
        const ownerUrl = existingUrl ?? (await createOwnerLink.mutateAsync(businessId)).ownerUrl;
        if (ownerUrl) await copy(ownerUrl);
      } catch {
        // the failure toast is already shown by useAdminAction
      }
    },

    createOwnerLink(businessId: string) {
      createOwnerLink.mutate(businessId, { onSuccess: () => showToast("Owner link created") });
    },

    resetOwnerLink(businessId: string) {
      const confirmed = window.confirm(
        "Make a new owner link?\n\nThe current link stops working immediately. Send the new one to the owner.",
      );
      if (confirmed) {
        createOwnerLink.mutate(businessId, {
          onSuccess: () => showToast("New owner link created; the old one no longer works"),
        });
      }
    },

    turnOffOwnerLink(businessId: string) {
      const confirmed = window.confirm(
        "Turn off the owner's dashboard?\n\nTheir link stops working. You can create a new one any time.",
      );
      if (confirmed) removeOwnerLink.mutate(businessId);
    },
  };
}
