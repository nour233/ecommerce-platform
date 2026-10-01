import { redirect } from "next/navigation";

/** The public campaign index was retired; featured campaigns live on the storefront home. */
export default function CampaignsPage() {
  redirect("/");
}
