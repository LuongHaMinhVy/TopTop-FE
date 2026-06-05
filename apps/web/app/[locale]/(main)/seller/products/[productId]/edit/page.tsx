import { redirect } from "next/navigation";

export default function EditSellerProductRedirectPage({
  params,
}: {
  params: { productId: string };
}) {
  redirect(`/business/products/${params.productId}/edit`);
}
