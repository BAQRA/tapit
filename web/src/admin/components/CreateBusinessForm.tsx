import { useState, type FormEvent } from "react";
import { adminApi } from "../api";
import { useAdminAction } from "../queries";

export function CreateBusinessForm() {
  const [name, setName] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const create = useAdminAction(adminApi.createBusiness, { success: "Business added" });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      { name, reviewUrl },
      {
        onSuccess: () => {
          setName("");
          setReviewUrl("");
        },
      },
    );
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <h2 className="panel__title">Add business</h2>
      <label>
        Name
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Café Example" />
      </label>
      <label>
        Google review link or Place ID
        <input
          required
          value={reviewUrl}
          onChange={(e) => setReviewUrl(e.target.value)}
          placeholder="ChIJ… or https://g.page/r/…/review"
        />
      </label>
      <p className="hint">
        A Place ID becomes a direct "write a review" link. Find it with Google's Place ID Finder.
      </p>
      <button className="button-primary" disabled={create.isPending}>
        Add business
      </button>
    </form>
  );
}
